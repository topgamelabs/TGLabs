import Parser from "rss-parser"
import crypto from "crypto"
import { supabase } from "@/lib/supabase"

const parser = new Parser()

export async function collectRssNews() {
  const { data: sources, error }
    = await supabase
      .from("news_sources")
      .select("*")
      .not("rss_url", "is", null)

  if (error || !sources) {
    console.error(error)
    return
  }

  console.log("ALL SOURCES:", sources)

  for (const source of sources) {

    if (!source.rss_url) continue

    try {
      console.log(
        `[RSS] Fetching ${source.name}`
      )
      console.log(
        `[RSS URL] ${source.rss_url}`
      )
      const feed = await parser.parseURL(
        source.rss_url
      )
      console.log(feed.items.length)

      for (const item of feed.items) {
        if (!item.link) continue

        const contentHash = crypto
          .createHash("md5")
          .update(item.link)
          .digest("hex")

        await supabase
          .from("raw_news_queue")
          .upsert({
            source_id: source.id,
            source_url: item.link,
            source_domain: source.domain,
            raw_title: item.title || null,
            raw_excerpt:
              item.contentSnippet || null,
            published_source_at:
              item.pubDate
                ? new Date(item.pubDate)
                : null,
            content_hash: contentHash,
            fetch_status: "pending",
            freshness_status: "pending",
            extraction_status: "pending",
            rewrite_status: "pending"
          }, {
            onConflict: "source_url"
          })

      }
      console.log(
        `[RSS] Success ${source.name}`
      )
    } catch (err: any) {
      console.error(
        `[RSS] Failed ${source.name}`,
        err.message
      )

      await supabase
        .from("news_sources")
        .update({
          blocked_count:
            (source.blocked_count || 0) + 1,
          last_failure_at: new Date()
        })
        .eq("id", source.id)
    }
  }
}