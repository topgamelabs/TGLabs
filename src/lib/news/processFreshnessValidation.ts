import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { validateFreshness } from "./validateFreshness"

interface FreshnessQueueRow {
  id: string
  raw_title: string | null
  published_source_at: string | null
}

export async function processFreshnessValidation() {
  const result = {
    processed: 0,
    accepted: 0,
    rejected: 0,
    pendingDateExtraction: 0,
  }

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
