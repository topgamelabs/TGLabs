import { supabase } from "@/lib/supabase"

import {
  assertFetchSuccess
} from "./assertFetchSuccess"

export async function processFetchQueue() {

  const { data, error } = await supabase
    .from("raw_news_queue")
    .select("*")
    .eq("fetch_status", "pending")
    .limit(10)

  if (error || !data) {
    console.error(error)
    return
  }

  for (const row of data) {

    try {

      console.log(
        `[FETCH] ${row.source_url}`
      )

      const response = await fetch(
        row.source_url,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0"
          }
        }
      )

      const html = await response.text()

      assertFetchSuccess(
        html,
        response.status
      )

      await supabase
        .from("raw_news_queue")
        .update({
          fetch_status: "success",

          fetch_http_status:
            response.status,

          raw_content: html,

          fetched_at: new Date()
        })
        .eq("id", row.id)

      console.log(
        `[FETCH SUCCESS] ${row.source_url}`
      )

    } catch (error: any) {

      console.error(
        `[FETCH FAILED] ${row.source_url}`,
        error.message
      )

      await supabase
        .from("raw_news_queue")
        .update({
          fetch_status: "failed",

          fetch_error: error.message,

          fetch_attempts:
            (row.fetch_attempts || 0) + 1
        })
        .eq("id", row.id)
    }
  }
}