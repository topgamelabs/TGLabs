import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { assertFetchSuccess } from "./assertFetchSuccess"
import { extractPublishedDateFromHtml } from "./extractPublishedDate"
import { fetchWithRetry } from "./fetchWithRetry"
import { hashContent } from "./newsIdentity"
import { validateFreshness } from "./validateFreshness"

const MAX_FETCH_ATTEMPTS = 3
const DEFAULT_FETCH_LIMIT = 10
const DEFAULT_FETCH_TIMEOUT_MS = 10000
const DEFAULT_FETCH_RETRIES = 1

interface ProcessFetchQueueOptions {
  limit?: number
  deadlineMs?: number
  timeoutMs?: number
  retries?: number
}

interface RawNewsQueueRow {
  id: string
  source_url: string
  fetch_attempts: number | null
  published_source_at: string | null
}

function rejectedRewritePatch(reason: string | null) {
  const normalizedReason = reason || "freshness_rejected"

  return {
    extraction_status: "skipped",
    rewrite_status: "skipped",
    rewrite_error: normalizedReason,
    rewrite_finished_at: new Date().toISOString(),
  }
}

export async function processFetchQueue(options: ProcessFetchQueueOptions = {}) {
  const result = {
    processed: 0,
    fetched: 0,
    rejectedDuplicate: 0,
    failed: 0,
    stoppedReason: null as string | null,
  }
  const limit = Math.min(
    Math.max(Math.floor(options.limit || DEFAULT_FETCH_LIMIT), 1),
    25
  )

  const { data, error } = await supabaseAdmin
    .from("raw_news_queue")
    .select("*")
    .eq("fetch_status", "pending")
    .neq("freshness_status", "rejected")
    .or(`fetch_attempts.is.null,fetch_attempts.lt.${MAX_FETCH_ATTEMPTS}`)
    .order("discovered_at", { ascending: false })
    .limit(limit)

  if (error || !data) {
    console.error("[FETCH] Failed to load queue", error?.message)
    return result
  }

  for (const row of data as RawNewsQueueRow[]) {
    if (options.deadlineMs && Date.now() >= options.deadlineMs) {
      result.stoppedReason = "fetch_time_limit_reached"
      break
    }

    result.processed++
    console.log(`[FETCH] ${row.source_url}`)

    const fetched = await fetchWithRetry(row.source_url, {
      contentType: "html",
      retries: options.retries ?? DEFAULT_FETCH_RETRIES,
      timeoutMs: options.timeoutMs || DEFAULT_FETCH_TIMEOUT_MS,
    })

    const attempts = (row.fetch_attempts || 0) + fetched.attempts

    try {
      assertFetchSuccess(fetched.body, fetched.status)

      if (!fetched.ok) {
        throw new Error(fetched.error || `FETCH_HTTP_${fetched.status}`)
      }

      const discoveredDate =
        row.published_source_at || extractPublishedDateFromHtml(fetched.body)
      const freshness = validateFreshness(discoveredDate)
      const contentHash = hashContent(fetched.body)

      const { data: duplicateContent, error: duplicateError } =
        await supabaseAdmin
          .from("raw_news_queue")
          .select("id,source_url")
          .eq("content_hash", contentHash)
          .neq("id", row.id)
          .limit(1)

      if (duplicateError) {
        console.error("[FETCH] Duplicate content check failed", duplicateError.message)
      }

      if (duplicateContent && duplicateContent.length > 0) {
        const { error: updateError } = await supabaseAdmin
          .from("raw_news_queue")
          .update({
            fetch_status: "success",
            fetch_http_status: fetched.status,
            fetch_attempts: attempts,
            raw_content: fetched.body,
            content_hash: contentHash,
            fetched_at: new Date().toISOString(),
            freshness_status: "rejected",
            freshness_reason: "duplicate_content_hash",
            ...rejectedRewritePatch("duplicate_content_hash"),
            fetch_error: null,
          })
          .eq("id", row.id)

        if (updateError) {
          console.error("[FETCH] Failed to update duplicate", updateError.message)
        }

        console.log(`[FETCH DUPLICATE] ${row.source_url}`)
        result.rejectedDuplicate++
        continue
      }

      const { error: updateError } = await supabaseAdmin
        .from("raw_news_queue")
        .update({
          fetch_status: "success",
          fetch_http_status: fetched.status,
          fetch_attempts: attempts,
          raw_content: fetched.body,
          content_hash: contentHash,
          published_source_at: discoveredDate,
          freshness_status: freshness.status,
          freshness_reason: freshness.reason,
          ...(freshness.status === "rejected"
            ? rejectedRewritePatch(freshness.reason)
            : {}),
          fetched_at: new Date().toISOString(),
          fetch_error: null,
        })
        .eq("id", row.id)

      if (updateError) {
        console.error("[FETCH] Failed to update success", updateError.message)
      }

      console.log(`[FETCH SUCCESS] ${row.source_url}`)
      result.fetched++
    } catch (error) {
      const message = error instanceof Error ? error.message : "FETCH_FAILED"
      const nextStatus = attempts >= MAX_FETCH_ATTEMPTS ? "failed" : "pending"

      console.error(`[FETCH FAILED] ${row.source_url}`, message)
      result.failed++

      const { error: updateError } = await supabaseAdmin
        .from("raw_news_queue")
        .update({
          fetch_status: nextStatus,
          fetch_http_status: fetched.status || null,
          fetch_error: message,
          fetch_attempts: attempts,
        })
        .eq("id", row.id)

      if (updateError) {
        console.error("[FETCH] Failed to update failure", updateError.message)
      }
    }
  }

  return result
}
