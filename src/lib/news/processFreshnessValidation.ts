import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { validateFreshness } from "./validateFreshness"

const STALE_UNFILTERED_DAYS = 30
const MAX_MISSING_DATE_DISCOVERY_AGE_HOURS = 72

interface FreshnessQueueRow {
  id: string
  raw_title: string | null
  published_source_at: string | null
  discovered_at: string | null
}

function buildFreshnessPatch(freshness: {
  status: "accepted" | "rejected" | "pending_date_extraction"
  reason: string | null
}) {
  const patch: {
    freshness_status: typeof freshness.status
    freshness_reason: string | null
    extraction_status?: "skipped"
    rewrite_status?: "skipped"
    rewrite_error?: string
    rewrite_finished_at?: string
  } = {
    freshness_status: freshness.status,
    freshness_reason: freshness.reason,
  }

  if (freshness.status === "rejected") {
    const reason = freshness.reason || "freshness_rejected"
    patch.extraction_status = "skipped"
    patch.rewrite_status = "skipped"
    patch.rewrite_error = reason
    patch.rewrite_finished_at = new Date().toISOString()
  }

  return patch
}

function validateRecentDiscovery(discoveredAt?: string | null) {
  if (!discoveredAt) {
    return {
      status: "pending_date_extraction" as const,
      reason: "missing_publish_date_and_discovery_date",
    }
  }

  const discoveredDate = new Date(discoveredAt)
  if (Number.isNaN(discoveredDate.getTime())) {
    return {
      status: "pending_date_extraction" as const,
      reason: "missing_publish_date_invalid_discovery_date",
    }
  }

  const diffHours =
    (Date.now() - discoveredDate.getTime()) / (1000 * 60 * 60)

  if (diffHours < -2) {
    return {
      status: "pending_date_extraction" as const,
      reason: "missing_publish_date_discovery_in_future",
    }
  }

  if (diffHours <= MAX_MISSING_DATE_DISCOVERY_AGE_HOURS) {
    return {
      status: "accepted" as const,
      reason: "fresh_by_recent_discovery_missing_publish_date",
    }
  }

  return {
    status: "rejected" as const,
    reason: "missing_publish_date_old_discovery",
  }
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
      const fallbackFreshness = validateRecentDiscovery(row.discovered_at)

      await supabaseAdmin
        .from("raw_news_queue")
        .update(buildFreshnessPatch(fallbackFreshness))
        .eq("id", row.id)

      console.log(
        `[Freshness] ${row.raw_title || row.id} => ${fallbackFreshness.status}:${fallbackFreshness.reason}`
      )
      if (fallbackFreshness.status === "accepted") {
        result.accepted++
      } else if (fallbackFreshness.status === "rejected") {
        result.rejected++
      } else {
        result.pendingDateExtraction++
      }
      continue
    }

    const freshness = validateFreshness(row.published_source_at)

    await supabaseAdmin
      .from("raw_news_queue")
      .update(buildFreshnessPatch(freshness))
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
