import { supabase } from "@/lib/supabase"
import { validateFreshness } from "./validateFreshness"

export async function processFreshnessValidation() {
  const { data, error } = await supabase
    .from("raw_news_queue")
    .select("*")
    .eq("freshness_status", "pending")

  if (error) {
    console.error(error)
    return
  }

  for (const row of data) {
    const result = validateFreshness(
      row.published_source_at
    )

    await supabase
      .from("raw_news_queue")
      .update({
        freshness_status: result.status,
        freshness_reason: result.reason
      })
      .eq("id", row.id)

    console.log(
      `[Freshness] ${row.raw_title} => ${result.status}`
    )
  }
}