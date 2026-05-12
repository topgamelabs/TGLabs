import Parser from "rss-parser"

const parser = new Parser()

export async function testSingleRss() {

  try {

    const response = await fetch(
      "https://www.gematsu.com/feed",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",

          "Accept":
            "application/rss+xml, application/xml"
        }
      }
    )

    console.log(
      "STATUS:",
      response.status
    )

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      )
    }

    const xml = await response.text()

    const feed =
      await parser.parseString(xml)

    console.log(
      "TITLE:",
      feed.title
    )

    console.log(
      "ITEMS:",
      feed.items.length
    )

    console.log(
      "FIRST:",
      feed.items[0]
    )

  } catch (error: any) {

    console.error(
      "RSS TEST FAILED:",
      error.message
    )
  }
}