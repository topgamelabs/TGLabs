import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { discoverNewsLinks, type NewsSourceConfig } from "./discoverNewsLinks"
import { hashUrl, normalizeNewsUrl } from "./newsIdentity"

export type FocusedGameSourceType =
  | "official_site"
  | "news_page"
  | "manual_url"
  | "youtube"
  | "x"
  | "facebook"
  | "steam"
  | "app_store"
  | "google_play"

interface FocusedGame {
  id: string
  name: string
  slug: string
  category: string
  status: string
}

interface FocusedGameSource {
  id: string
  game_id: string
  source_type: FocusedGameSourceType
  source_name: string | null
  source_url: string
  trust_level: string
  enabled: boolean
}

function safeDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

function toSourceConfig(source: FocusedGameSource): NewsSourceConfig {
  const domain = safeDomain(source.source_url)

  if (source.source_type === "manual_url") {
    return {
      id: source.id,
      name: source.source_name,
      domain,
      homepage_url: source.source_url,
      supports_rss: false,
      supports_scraping: true,
    }
  }

  return {
    id: source.id,
    name: source.source_name,
    domain,
    homepage_url: source.source_url,
    site_url: source.source_url,
    supports_rss: false,
    supports_scraping: true,
  }
}

function detectUpdateType(title: string | null, url: string) {
  const text = `${title || ""} ${url}`.toLowerCase()

  if (text.includes("code") || text.includes("redeem")) return "code"
  if (text.includes("collab")) return "collaboration"
  if (text.includes("banner") || text.includes("summon")) return "banner"
  if (text.includes("event")) return "event"
  if (text.includes("maintenance")) return "maintenance"
  if (text.includes("shutdown") || text.includes("end of service")) return "shutdown"
  if (text.includes("launch") || text.includes("release")) return "launch"
  if (text.includes("update") || text.includes("patch") || text.includes("version")) return "patch"

  return "official_update"
}

async function isDuplicate(url: string) {
  const normalized = normalizeNewsUrl(url)

  const { data: queueRows, error: queueError } = await supabaseAdmin
    .from("raw_news_queue")
    .select("id")
    .eq("source_url", normalized)
    .limit(1)

  if (queueError) {
    throw new Error(`FOCUSED_DUPLICATE_QUEUE_CHECK_FAILED: ${queueError.message}`)
  }

  if (queueRows && queueRows.length > 0) return true

  const { data: articleRows, error: articleError } = await supabaseAdmin
    .from("articles")
    .select("id")
    .eq("source_url", normalized)
    .limit(1)

  if (articleError) {
    throw new Error(`FOCUSED_DUPLICATE_ARTICLE_CHECK_FAILED: ${articleError.message}`)
  }

  return Boolean(articleRows && articleRows.length > 0)
}

async function queueFocusedLink(
  game: FocusedGame,
  source: FocusedGameSource,
  link: {
    url: string
    title: string | null
    excerpt: string | null
    publishedAt: string | null
    freshnessStatus: "pending_date_extraction" | "accepted" | "rejected"
    freshnessReason: string | null
  }
) {
  const sourceUrl = normalizeNewsUrl(link.url)
  if (await isDuplicate(sourceUrl)) return "duplicate"

  if (link.freshnessStatus === "rejected") return "stale"

  const { error } = await supabaseAdmin.from("raw_news_queue").insert({
    source_id: null,
    source_url: sourceUrl,
    source_domain: safeDomain(sourceUrl),
    raw_title: link.title,
    raw_excerpt: link.excerpt,
    published_source_at: link.publishedAt,
    content_hash: hashUrl(sourceUrl),
    fetch_status: "pending",
    fetch_attempts: 0,
    freshness_status: link.freshnessStatus,
    freshness_reason: link.freshnessReason,
    extraction_status: "pending",
    rewrite_status: "pending",
    source_track: "focused",
    focused_game_id: game.id,
    focused_source_id: source.id,
    detected_update_type: detectUpdateType(link.title, sourceUrl),
    focused_confidence: source.trust_level === "official" ? 0.95 : 0.75,
  })

  if (error) {
    throw new Error(`FOCUSED_QUEUE_INSERT_FAILED: ${error.message}`)
  }

  return "queued"
}

export async function checkFocusedGameSources(gameId: string) {
  const { data: game, error: gameError } = await supabaseAdmin
    .from("focused_games")
    .select("id,name,slug,category,status")
    .eq("id", gameId)
    .single()

  if (gameError || !game) {
    throw new Error(`FOCUSED_GAME_NOT_FOUND: ${gameError?.message || gameId}`)
  }

  const { data: sources, error: sourceError } = await supabaseAdmin
    .from("focused_game_sources")
    .select("*")
    .eq("game_id", gameId)
    .eq("enabled", true)
    .in("source_type", ["official_site", "news_page", "manual_url"])
    .order("created_at", { ascending: true })

  if (sourceError) {
    throw new Error(`FOCUSED_SOURCES_LOAD_FAILED: ${sourceError.message}`)
  }

  const result = {
    gameId,
    sources: sources?.length || 0,
    discovered: 0,
    queued: 0,
    duplicate: 0,
    stale: 0,
    failed: 0,
    sourceResults: [] as Array<{
      sourceId: string
      sourceName: string | null
      discovered: number
      queued: number
      duplicate: number
      stale: number
      failed: number
      error?: string
    }>,
  }

  for (const source of (sources || []) as FocusedGameSource[]) {
    const sourceResult = {
      sourceId: source.id,
      sourceName: source.source_name,
      discovered: 0,
      queued: 0,
      duplicate: 0,
      stale: 0,
      failed: 0,
      error: undefined as string | undefined,
    }

    try {
      const discovered = await discoverNewsLinks(toSourceConfig(source))
      sourceResult.discovered = discovered.links.length
      result.discovered += discovered.links.length

      for (const link of discovered.links.slice(0, 20)) {
        try {
          const status = await queueFocusedLink(game as FocusedGame, source, link)
          sourceResult[status] += 1
          result[status] += 1
        } catch {
          sourceResult.failed += 1
          result.failed += 1
        }
      }

      const errorMessage = discovered.failures.join("; ").slice(0, 500) || null
      await supabaseAdmin
        .from("focused_game_sources")
        .update({
          last_checked_at: new Date().toISOString(),
          last_success_at: sourceResult.queued > 0 ? new Date().toISOString() : null,
          last_error: errorMessage,
        })
        .eq("id", source.id)

      if (errorMessage) sourceResult.error = errorMessage
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "FOCUSED_SOURCE_CHECK_FAILED"
      sourceResult.error = message
      sourceResult.failed += 1
      result.failed += 1

      await supabaseAdmin
        .from("focused_game_sources")
        .update({
          last_checked_at: new Date().toISOString(),
          last_error: message.slice(0, 500),
        })
        .eq("id", source.id)
    }

    result.sourceResults.push(sourceResult)
  }

  return result
}
