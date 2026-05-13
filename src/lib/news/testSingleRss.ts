import Parser from "rss-parser"
import { fetchWithRetry } from "./fetchWithRetry"

const parser = new Parser()

export async function testSingleRss() {
  try {
    const fetched = await fetchWithRetry("https://www.gematsu.com/feed", {
      contentType: "rss",
      retries: 2,
      timeoutMs: 12000,
    })

    console.log("STATUS:", fetched.status)
    console.log("ATTEMPTS:", fetched.attempts)

    if (!fetched.ok) {
      throw new Error(fetched.error || `HTTP ${fetched.status}`)
    }

    const feed = await parser.parseString(fetched.body)

    console.log("TITLE:", feed.title)
    console.log("ITEMS:", feed.items.length)
    console.log("FIRST:", feed.items[0])

    return {
      success: true,
      status: fetched.status,
      items: feed.items.length,
      title: feed.title,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "RSS_TEST_FAILED"

    console.error("RSS TEST FAILED:", message)

    return {
      success: false,
      error: message,
    }
  }
}
