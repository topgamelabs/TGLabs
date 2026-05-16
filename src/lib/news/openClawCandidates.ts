import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { evaluateMobileGameNewsRelevance } from "./newsRelevance"
import { validateSourceQuality } from "./sourceQuality"

const MIN_RAW_CONTENT_LENGTH = 800
const DEFAULT_LIMIT = 10
const MAX_SCAN_MULTIPLIER = 10
const STALE_PENDING_DAYS = 30

interface OpenClawCandidateOptions {
  markSkipped?: boolean
}

export interface OpenClawCandidate {
  id: string
  source_url: string
  source_domain: string | null
  raw_title: string | null
  raw_excerpt: string | null
  published_source_at: string
  raw_content: string
  content_hash: string | null
}

interface RawCandidateRow extends OpenClawCandidate {
  source_id: string | null
  raw_content: string
}

async function markSkippedCandidate(queueId: string, reason: string) {
  const patch = {
    extraction_status: "skipped",
    rewrite_status: "skipped",
    rewrite_error: reason,
    rewrite_finished_at: new Date().toISOString(),
  }

  const { error } = await supabaseAdmin
    .from("raw_news_queue")
    .update(patch)
    .eq("id", queueId)
    .eq("extraction_status", "pending")
    .eq("rewrite_status", "pending")

  if (error) {
    const { error: fallbackError } = await supabaseAdmin
      .from("raw_news_queue")
      .update({
        extraction_status: "skipped",
        rewrite_status: "skipped",
      })
      .eq("id", queueId)
      .eq("extraction_status", "pending")
      .eq("rewrite_status", "pending")

    if (fallbackError) {
      console.error(
        "[OpenClaw] Failed to mark skipped candidate",
        queueId,
        fallbackError.message
      )
    }
  }
}

export async function cleanupStalePendingRewriteQueue() {
  const cutoff = new Date(
    Date.now() - STALE_PENDING_DAYS * 24 * 60 * 60 * 1000
  ).toISOString()

  const patch = {
    extraction_status: "skipped",
    rewrite_status: "skipped",
    rewrite_error: "stale_pending_over_30_days",
    rewrite_finished_at: new Date().toISOString(),
  }

  const { data, error } = await supabaseAdmin
    .from("raw_news_queue")
    .update(patch)
    .eq("extraction_status", "pending")
    .eq("rewrite_status", "pending")
    .lt("published_source_at", cutoff)
    .select("id")

  if (!error) {
    return data?.length || 0
  }

  const { data: fallbackData, error: fallbackError } = await supabaseAdmin
    .from("raw_news_queue")
    .update({
      extraction_status: "skipped",
      rewrite_status: "skipped",
    })
    .eq("extraction_status", "pending")
    .eq("rewrite_status", "pending")
    .lt("published_source_at", cutoff)
    .select("id")

  if (fallbackError) {
    console.error(
      "[OpenClaw] Failed to clean stale pending queue",
      fallbackError.message
    )
    return 0
  }

  return fallbackData?.length || 0
}

export async function cleanupNonRewriteablePendingQueue(limit = 100) {
  const safeLimit = Math.min(Math.max(Math.floor(limit || 100), 1), 250)
  const { data, error } = await supabaseAdmin
    .from("raw_news_queue")
    .select("id,source_url,raw_title,raw_excerpt,raw_content")
    .eq("extraction_status", "pending")
    .eq("rewrite_status", "pending")
    .not("raw_content", "is", null)
    .limit(safeLimit)

  if (error || !data) {
    console.error("[OpenClaw] Non-rewriteable cleanup query failed", error?.message)
    return 0
  }

  let cleaned = 0

  for (const row of data as Array<{
    id: string
    source_url: string | null
    raw_title: string | null
    raw_excerpt: string | null
    raw_content: string | null
  }>) {
    const relevance = evaluateMobileGameNewsRelevance({
      title: row.raw_title,
      excerpt: row.raw_excerpt,
      content: row.raw_content,
      url: row.source_url,
    })

    if (relevance.allowed || relevance.action === "defer") {
      continue
    }

    await markSkippedCandidate(
      row.id,
      relevance.reason || "not_rewriteable_for_current_pipeline"
    )
    cleaned++
  }

  return cleaned
}

export async function getOpenClawCandidates(
  limit = DEFAULT_LIMIT,
  options: OpenClawCandidateOptions = {}
) {
  const requestedLimit = Number.isFinite(limit) ? limit : DEFAULT_LIMIT
  const safeLimit = Math.min(Math.max(requestedLimit, 1), 25)

  const { data, error } = await supabaseAdmin
    .from("raw_news_queue")
    .select(
      "id,source_id,source_url,source_domain,raw_title,raw_excerpt,published_source_at,raw_content,content_hash"
    )
    .eq("fetch_status", "success")
    .eq("freshness_status", "accepted")
    .eq("extraction_status", "pending")
    .eq("rewrite_status", "pending")
    .not("raw_content", "is", null)
    .not("published_source_at", "is", null)
    .order("published_source_at", { ascending: false })
    .limit(safeLimit * MAX_SCAN_MULTIPLIER)

  if (error || !data) {
    console.error("[OpenClaw] Candidate query failed", error?.message)
    return []
  }

  const validContentRows: RawCandidateRow[] = []

  for (const row of data as RawCandidateRow[]) {
    if (!row.raw_content || row.raw_content.length < MIN_RAW_CONTENT_LENGTH) {
      if (options.markSkipped) {
        await markSkippedCandidate(row.id, "raw_content_too_short")
      }
      continue
    }

    validContentRows.push(row)
  }

  const sourceIds = Array.from(
    new Set(validContentRows.map((row) => row.source_id).filter(Boolean))
  ) as string[]

  const sourcesById = new Map<string, Record<string, unknown>>()

  if (sourceIds.length > 0) {
    const { data: sources, error: sourceError } = await supabaseAdmin
      .from("news_sources")
      .select("*")
      .in("id", sourceIds)

    if (sourceError) {
      console.error("[OpenClaw] Source quality query failed", sourceError.message)
      return []
    }

    for (const source of (sources || []) as Record<string, unknown>[]) {
      if (typeof source.id === "string") {
        sourcesById.set(source.id, source)
      }
    }
  }

  const candidates: OpenClawCandidate[] = []

  for (const row of validContentRows) {
    if (row.source_id) {
      const source = sourcesById.get(row.source_id)
      if (!source) {
        if (options.markSkipped) {
          await markSkippedCandidate(row.id, "source_not_found")
        }
        continue
      }

      const quality = validateSourceQuality(source)
      if (!quality.allowed) {
        console.log(
          `[OpenClaw] Candidate skipped ${row.source_url}: ${quality.reason}`
        )
        if (options.markSkipped) {
          await markSkippedCandidate(row.id, quality.reason || "source_not_allowed")
        }
        continue
      }
    }

    const relevance = evaluateMobileGameNewsRelevance({
      title: row.raw_title,
      excerpt: row.raw_excerpt,
      content: row.raw_content,
      url: row.source_url,
    })

    if (!relevance.allowed) {
      console.log(
        `[OpenClaw] Candidate ${
          relevance.action === "defer" ? "deferred" : "skipped"
        } ${row.source_url}: ${relevance.reason}`
      )
      if (options.markSkipped && relevance.action !== "defer") {
        await markSkippedCandidate(
          row.id,
          relevance.reason || "not_mobile_or_cross_platform_game"
        )
      }
      continue
    }

    candidates.push({
      id: row.id,
      source_url: row.source_url,
      source_domain: row.source_domain,
      raw_title: row.raw_title,
      raw_excerpt: row.raw_excerpt,
      published_source_at: row.published_source_at,
      raw_content: row.raw_content,
      content_hash: row.content_hash,
    })

    if (candidates.length >= safeLimit) break
  }

  return candidates
}
