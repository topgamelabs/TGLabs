import * as cheerio from "cheerio"

const META_SELECTORS = [
  'meta[property="article:published_time"]',
  'meta[property="og:published_time"]',
  'meta[name="pubdate"]',
  'meta[name="publishdate"]',
  'meta[name="publish_date"]',
  'meta[name="date"]',
  'meta[itemprop="datePublished"]',
]

export function extractPublishedDateFromHtml(html: string) {
  const $ = cheerio.load(html)

  for (const selector of META_SELECTORS) {
    const value = $(selector).attr("content")
    if (value) return value.trim()
  }

  const timeValue =
    $("time[datetime]").first().attr("datetime") ||
    $("time[pubdate]").first().attr("datetime")

  if (timeValue) return timeValue.trim()

  const scriptJson = $('script[type="application/ld+json"]')
    .map((_, element) => $(element).text())
    .get()

  for (const raw of scriptJson) {
    try {
      const parsed = JSON.parse(raw)
      const candidates = Array.isArray(parsed) ? parsed : [parsed]

      for (const item of candidates) {
        const date = findDatePublished(item)
        if (date) return date
      }
    } catch {
      continue
    }
  }

  return null
}

function findDatePublished(value: unknown): string | null {
  if (!value || typeof value !== "object") return null

  const record = value as Record<string, unknown>
  const direct = record.datePublished || record.dateCreated || record.dateModified

  if (typeof direct === "string") return direct

  for (const nested of Object.values(record)) {
    if (Array.isArray(nested)) {
      for (const item of nested) {
        const found = findDatePublished(item)
        if (found) return found
      }
    } else if (nested && typeof nested === "object") {
      const found = findDatePublished(nested)
      if (found) return found
    }
  }

  return null
}
