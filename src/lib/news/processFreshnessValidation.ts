import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { validateFreshness } from "./validateFreshness"

const STALE_UNFILTERED_DAYS = 30

interface FreshnessQueueRow {
  id: string
  raw_title: string | null
  published_source_at: string | null
}

async function cleanupStaleUnfilteredRawNews() {
  const cutoff = new Date(
    Date.now() - STALE_UNFILTERED_DAYS * 24 * 60 * 60 * 1000
  ).toISOString()

  const patch = {
    freshness_status: "rejected",
    freshness_reason: "stale_unfiltered_over_30_days",
    extraction_status: "skipped",
    rewrite_status: "skipped",
    rewrite_error: "stale_unfiltered_over_30_days",
    rewrite_finished_at: new Date().toISOString(),
  }

  const { data, error } = await supabaseAdmin
    .from("raw_news_queue")
    .update(patch)
    .in("freshness_status", ["pending", "pending_date_extraction"])
    .lt("discovered_at", cutoff)
    .select("id")

  if (!error) {
    return data?.length || 0
  }

  const { data: fallbackData, error: fallbackError } = await supabaseAdmin
    .from("raw_news_queue")
    .update({
      freshness_status: "rejected",
      freshness_reason: "stale_unfiltered_over_30_days",
    })
    .in("freshness_status", ["pending", "pending_date_extraction"])
    .lt("discovered_at", cutoff)
    .select("id")

  if (fallbackError) {
    console.error(
      "[Freshness] Failed to clean stale unfiltered raw news",
      fallbackError.message
    )
    return 0
  }

  return fallbackData?.length || 0
}

export async function processFreshnessValidation() {
  const result = {
    processed: 0,
    accepted: 0,
    rejected: 0,
    pendingDateExtraction: 0,
    cleanedStaleUnfiltered: 0,
  }

  result.cleanedStaleUnfiltered = await cleanupStaleUnfilteredRawNews()

  const { data, error } = await supabaseAdmin
    .from("raw_news_queue")
    .select("*")
    .in("freshness_status", ["pending", "pending_date_extraction"])

  if (error || !data) {
    console.error("[Freshness] Failed to load queue", error?.message)
    return result
  }

  for (const row of data as FreshnessQueueRow[]) {
    result.processed++

    if (!row.published_source_at) {
      await supabaseAdmin
        .from("raw_news_queue")
        .update({
          freshness_status: "pending_date_extraction",
          freshness_reason: "missing_publish_date",
        })
        .eq("id", row.id)

      console.log(
        `[Freshness] ${row.raw_title || row.id} => pending_missing_date`
      )
      result.pendingDateExtraction++
      continue
    }

    const freshness = validateFreshness(row.published_source_at)

    await supabaseAdmin
      .from("raw_news_queue")
      .update({
        freshness_status: freshness.status,
        freshness_reason: freshness.reason,
      })
      .eq("id", row.id)

    console.log(`[Freshness] ${row.raw_title || row.id} => ${freshness.status}`)
    if (freshness.status === "accepted") {
      result.accepted++
    } else {
      result.rejected++
    }
  }

  return result
}
