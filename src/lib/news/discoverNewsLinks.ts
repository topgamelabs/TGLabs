import Parser from "rss-parser"
import * as cheerio from "cheerio"
import { fetchWithRetry } from "./fetchWithRetry"
import { validateFreshness } from "./validateFreshness"
import { normalizeNewsUrl } from "./newsIdentity"

const parser = new Parser()

const NEWS_PATH_HINTS = [
  "/news",
  "/article",
  "/articles",
  "/post",
  "/posts",
  "/202",
  "/gaming",
  "/games",
]

const BLOCKED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".css",
  ".js",
  ".pdf",
  ".zip",
]

export interface NewsSourceConfig {
  id: string
  name?: string | null
  domain?: string | null
  rss_url?: string | null
  sitemap_url?: string | null
  site_url?: string | null
  homepage_url?: string | null
  url?: string | null
  supports_rss?: boolean | null
  supports_scraping?: boolean | null
}

export interface DiscoveredNewsLink {
  url: string
  title: string | null
  excerpt: string | null
  publishedAt: string | null
  discoveryMethod: "rss" | "html" | "sitemap"
  freshnessStatus: "pending_date_extraction" | "accepted" | "rejected"
  freshnessReason: string | null
}

export interface DiscoveryResult {
  source: NewsSourceConfig
  links: DiscoveredNewsLink[]
  failures: string[]
  blocked: boolean
}

function cleanUrl(url: string) {
  try {
    return normalizeNewsUrl(url)
  } catch {
    return null
  }
}

function getSourceHome(source: NewsSourceConfig) {
  const explicit =
    source.site_url ||
    source.homepage_url ||
    source.url ||
    (source.domain ? `https://${source.domain}` : null)

  if (!explicit) return null

  try {
    const withProtocol = /^https?:\/\//i.test(explicit)
      ? explicit
      : `https://${explicit}`
    return new URL(withProtocol).toString()
  } catch {
    return null
  }
}

function getSourceHost(source: NewsSourceConfig) {
  const home = getSourceHome(source)
  if (home) return new URL(home).hostname.replace(/^www\./, "")
  if (source.domain) return source.domain.replace(/^www\./, "")
  if (source.rss_url) return new URL(source.rss_url).hostname.replace(/^www\./, "")
  return null
}

function isLikelyNewsUrl(url: string) {
  const parsed = new URL(url)
  const path = parsed.pathname.toLowerCase()

  if (path === "/" || path.length < 8) return false
  if (BLOCKED_EXTENSIONS.some((ext) => path.endsWith(ext))) return false

  return NEWS_PATH_HINTS.some((hint) => path.includes(hint))
}

function toAbsoluteUrl(href: string, baseUrl: string) {
  try {
    return new URL(href, baseUrl).toString()
  } catch {
    return null
  }
}

function uniqueLinks(links: DiscoveredNewsLink[]) {
  const seen = new Set<string>()
  const result: DiscoveredNewsLink[] = []

  for (const link of links) {
    const cleaned = cleanUrl(link.url)
    if (!cleaned || seen.has(cleaned)) continue
    seen.add(cleaned)
    result.push({ ...link, url: cleaned })
  }

  return result
}

function freshnessFromDate(
  publishedAt: string | null,
  options: { requireDate: boolean }
) {
  if (!publishedAt) {
    return {
      freshnessStatus: options.requireDate
        ? "rejected" as const
        : "pending_date_extraction" as const,
      freshnessReason: "missing_publish_date",
    }
  }

  const result = validateFreshness(publishedAt)

  return {
    freshnessStatus: result.status as "accepted" | "rejected",
    freshnessReason: result.reason,
  }
}

export async function discoverRssLinks(
  source: NewsSourceConfig
): Promise<DiscoveryResult> {
  const failures: string[] = []
  if (!source.rss_url) {
    return { source, links: [], failures: ["RSS_URL_MISSING"], blocked: false }
  }

  const fetched = await fetchWithRetry(source.rss_url, {
    contentType: "rss",
    referer: getSourceHome(source) || undefined,
  })

  if (!fetched.ok) {
    return {
      source,
      links: [],
      failures: [fetched.error || `RSS_HTTP_${fetched.status}`],
      blocked: fetched.blocked,
    }
  }

  try {
    const feed = await parser.parseString(fetched.body)
    if (!feed.items || feed.items.length === 0) {
      return {
        source,
        links: [],
        failures: ["RSS_EMPTY_FEED"],
        blocked: false,
      }
    }

    const links = feed.items
      .filter((item) => Boolean(item.link))
      .map((item) => {
        const publishedAt = item.isoDate || item.pubDate || null
        const freshness = freshnessFromDate(publishedAt, { requireDate: true })

        return {
          url: item.link || "",
          title: item.title || null,
          excerpt: item.contentSnippet || item.summary || null,
          publishedAt,
          discoveryMethod: "rss" as const,
          ...freshness,
        }
      })

    return {
      source,
      links: uniqueLinks(links),
      failures,
      blocked: false,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "RSS_PARSE_FAILED"
    return { source, links: [], failures: [message], blocked: false }
  }
}

export async function discoverHtmlLinks(
  source: NewsSourceConfig
): Promise<DiscoveryResult> {
  const home = getSourceHome(source)
  const host = getSourceHost(source)

  if (!home || !host) {
    return { source, links: [], failures: ["SOURCE_HOME_MISSING"], blocked: false }
  }

  const fetched = await fetchWithRetry(home, { contentType: "html" })

  if (!fetched.ok) {
    return {
      source,
      links: [],
      failures: [fetched.error || `HTML_HTTP_${fetched.status}`],
      blocked: fetched.blocked,
    }
  }

  const $ = cheerio.load(fetched.body)
  const links: DiscoveredNewsLink[] = []

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href")
    if (!href) return

    const absolute = toAbsoluteUrl(href, fetched.finalUrl)
    const cleaned = absolute ? cleanUrl(absolute) : null
    if (!cleaned) return

    const parsed = new URL(cleaned)
    if (parsed.hostname.replace(/^www\./, "") !== host) return
    if (!isLikelyNewsUrl(cleaned)) return

    const title = $(element).text().replace(/\s+/g, " ").trim()
    if (title.length < 8) return

    links.push({
      url: cleaned,
      title,
      excerpt: null,
      publishedAt: null,
      discoveryMethod: "html",
      freshnessStatus: "pending_date_extraction",
      freshnessReason: "missing_publish_date",
    })
  })

  return {
    source,
    links: uniqueLinks(links).slice(0, 30),
    failures: [],
    blocked: false,
  }
}

export async function discoverSitemapLinks(
  source: NewsSourceConfig
): Promise<DiscoveryResult> {
  const home = getSourceHome(source)
  if (!home && !source.sitemap_url) {
    return { source, links: [], failures: ["SITEMAP_URL_MISSING"], blocked: false }
  }

  const sitemapUrl = source.sitemap_url || new URL("/sitemap.xml", home || "").toString()
  const fetched = await fetchWithRetry(sitemapUrl, { contentType: "sitemap" })

  if (!fetched.ok) {
    return {
      source,
      links: [],
      failures: [fetched.error || `SITEMAP_HTTP_${fetched.status}`],
      blocked: fetched.blocked,
    }
  }

  const root = cheerio.load(fetched.body, { xmlMode: true })
  const childSitemaps = root("sitemap loc")
    .map((_, element) => root(element).text().trim())
    .get()
    .filter(Boolean)
    .slice(0, 5)

  if (childSitemaps.length > 0) {
    const childResults = await Promise.all(
      childSitemaps.map(async (childUrl) => {
        const childFetch = await fetchWithRetry(childUrl, {
          contentType: "sitemap",
          referer: sitemapUrl,
        })

        if (!childFetch.ok) {
          return {
            links: [] as DiscoveredNewsLink[],
            failure: childFetch.error || `SITEMAP_CHILD_HTTP_${childFetch.status}`,
            blocked: childFetch.blocked,
          }
        }

        return {
          links: extractLinksFromSitemapXml(childFetch.body),
          failure: null,
          blocked: false,
        }
      })
    )

    return {
      source,
      links: uniqueLinks(childResults.flatMap((result) => result.links)).slice(
        0,
        50
      ),
      failures: childResults
        .map((result) => result.failure)
        .filter((failure): failure is string => Boolean(failure)),
      blocked: childResults.some((result) => result.blocked),
    }
  }

  return {
    source,
    links: uniqueLinks(extractLinksFromSitemapXml(fetched.body)).slice(0, 50),
    failures: [],
    blocked: false,
  }
}

function extractLinksFromSitemapXml(xml: string) {
  const $ = cheerio.load(xml, { xmlMode: true })
  const links: DiscoveredNewsLink[] = []

  $("url").each((_, element) => {
    const loc = $(element).find("loc").first().text().trim()
    if (!loc) return

    const cleaned = cleanUrl(loc)
    if (!cleaned || !isLikelyNewsUrl(cleaned)) return

    const lastmod = $(element).find("lastmod").first().text().trim() || null
    const freshness = freshnessFromDate(lastmod, { requireDate: false })

    links.push({
      url: cleaned,
      title: null,
      excerpt: null,
      publishedAt: lastmod,
      discoveryMethod: "sitemap",
      ...freshness,
    })
  })

  return links
}

export async function discoverNewsLinks(
  source: NewsSourceConfig
): Promise<DiscoveryResult> {
  const results: DiscoveryResult[] = []

  if (source.rss_url && source.supports_rss !== false) {
    results.push(await discoverRssLinks(source))
  }

  if (source.supports_scraping !== false) {
    results.push(await discoverHtmlLinks(source))
    results.push(await discoverSitemapLinks(source))
  }

  return {
    source,
    links: uniqueLinks(results.flatMap((result) => result.links)),
    failures: results.flatMap((result) => result.failures),
    blocked: results.some((result) => result.blocked),
  }
}
