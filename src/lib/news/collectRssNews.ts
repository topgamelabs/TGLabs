import { supabaseAdmin } from "@/lib/supabaseAdmin"
import {
  discoverNewsLinks,
  type DiscoveredNewsLink,
  type NewsSourceConfig,
} from "./discoverNewsLinks"
import { hashTitle, hashUrl, normalizeTitle } from "./newsIdentity"
import { evaluateMobileGameNewsRelevance } from "./newsRelevance"
import { validateSourceQuality } from "./sourceQuality"

interface QueueInsertResult {
  queued: number
  skippedOld: number
  skippedIrrelevant: number
  failed: number
}

function toSourceConfig(source: Record<string, unknown>): NewsSourceConfig {
  return {
    id: String(source.id),
    name: typeof source.name === "string" ? source.name : null,
    domain: typeof source.domain === "string" ? source.domain : null,
    rss_url: typeof source.rss_url === "string" ? source.rss_url : null,
    sitemap_url: typeof source.sitemap_url === "string" ? source.sitemap_url : null,
    site_url: typeof source.site_url === "string" ? source.site_url : null,
    homepage_url:
      typeof source.homepage_url === "string" ? source.homepage_url : null,
    url: typeof source.url === "string" ? source.url : null,
    supports_rss:
      typeof source.supports_rss === "boolean" ? source.supports_rss : null,
    supports_scraping:
      typeof source.supports_scraping === "boolean"
        ? source.supports_scraping
        : null,
  }
}

async function updateSourceFailure(
  source: Record<string, unknown>,
  failures: string[],
  blocked: boolean
) {
  const blockedCount =
    typeof source.blocked_count === "number" ? source.blocked_count : 0

  const { error } = await supabaseAdmin
    .from("news_sources")
    .update({
      blocked_count: blocked ? blockedCount + 1 : blockedCount,
      last_failure_at: new Date().toISOString(),
    })
    .eq("id", source.id)

  if (error) {
    console.error("[COLLECT] Failed to update source failure", error.message)
  }
}

async function updateSourceSuccess(source: Record<string, unknown>) {
  const { error } = await supabaseAdmin
    .from("news_sources")
    .update({
      last_success_at: new Date().toISOString(),
    })
    .eq("id", source.id)

  if (error) {
    console.error("[COLLECT] Failed to update source success", error.message)
  }
}

async function queueLink(
  source: NewsSourceConfig,
  link: DiscoveredNewsLink
): Promise<boolean> {
  const duplicate = await isDuplicateQueuedOrPublished(link)
  if (duplicate) {
    console.log(`[COLLECT] Duplicate skipped ${link.url}: ${duplicate}`)
    return true
  }

  const { error } = await supabaseAdmin
    .from("raw_news_queue")
    .upsert(
      {
        source_id: source.id,
        source_url: link.url,
        source_domain: source.domain,
        raw_title: link.title,
        raw_excerpt: link.excerpt,
        published_source_at: link.publishedAt,
        content_hash: hashUrl(link.url),
        fetch_status: "pending",
        fetch_attempts: 0,
        freshness_status: link.freshnessStatus,
        freshness_reason: link.freshnessReason,
        extraction_status: "pending",
        rewrite_status: "pending",
      },
      {
        onConflict: "source_url",
      }
    )

  if (error) {
    console.error("[COLLECT] Queue upsert failed", link.url, error.message)
    return false
  }

  return true
}

async function isDuplicateQueuedOrPublished(link: DiscoveredNewsLink) {
  const { data: existingQueue, error: queueError } = await supabaseAdmin
    .from("raw_news_queue")
    .select("id")
    .eq("source_url", link.url)
    .limit(1)

  if (queueError) {
    console.error("[COLLECT] Duplicate queue URL check failed", queueError.message)
  }

  if (existingQueue && existingQueue.length > 0) {
    return "duplicate_source_url"
  }

  const { data: existingArticle, error: articleError } = await supabaseAdmin
    .from("articles")
    .select("id")
    .eq("source_url", link.url)
    .limit(1)

  if (articleError) {
    console.error("[COLLECT] Duplicate article URL check failed", articleError.message)
  }

  if (existingArticle && existingArticle.length > 0) {
    return "duplicate_published_source_url"
  }

  const titleHash = hashTitle(link.title)
  const normalizedTitle = normalizeTitle(link.title)
  if (!titleHash || !normalizedTitle || !link.title) return null

  const { data: sameTitleQueue, error: titleQueueError } = await supabaseAdmin
    .from("raw_news_queue")
    .select("id,raw_title")
    .eq("raw_title", link.title)
    .limit(1)

  if (titleQueueError) {
    console.error("[COLLECT] Duplicate queue title check failed", titleQueueError.message)
  }

  if (sameTitleQueue && sameTitleQueue.length > 0) {
    return "duplicate_raw_title"
  }

  const { data: recentQueueTitles, error: normalizedQueueError } =
    await supabaseAdmin
      .from("raw_news_queue")
      .select("id,raw_title")
      .not("raw_title", "is", null)
      .limit(100)

  if (normalizedQueueError) {
    console.error(
      "[COLLECT] Normalized queue title check failed",
      normalizedQueueError.message
    )
  }

  if (
    recentQueueTitles?.some(
      (row) => normalizeTitle(row.raw_title) === normalizedTitle
    )
  ) {
    return "duplicate_normalized_raw_title"
  }

  const { data: sameTitleArticle, error: titleArticleError } = await supabaseAdmin
    .from("articles")
    .select("id,title")
    .eq("title", link.title)
    .limit(1)

  if (titleArticleError) {
    console.error("[COLLECT] Duplicate article title check failed", titleArticleError.message)
  }

  if (sameTitleArticle && sameTitleArticle.length > 0) {
    return "duplicate_published_title"
  }

  const { data: recentArticleTitles, error: normalizedArticleError } =
    await supabaseAdmin
      .from("articles")
      .select("id,title")
      .not("title", "is", null)
      .limit(100)

  if (normalizedArticleError) {
    console.error(
      "[COLLECT] Normalized article title check failed",
      normalizedArticleError.message
    )
  }

  if (
    recentArticleTitles?.some(
      (row) => normalizeTitle(row.title) === normalizedTitle
    )
  ) {
    return "duplicate_normalized_published_title"
  }

  return null
}

async function queueDiscoveredLinks(
  source: NewsSourceConfig,
  links: DiscoveredNewsLink[]
): Promise<QueueInsertResult> {
  const result: QueueInsertResult = {
    queued: 0,
    skippedOld: 0,
    skippedIrrelevant: 0,
    failed: 0,
  }

  for (const link of links) {
    if (link.freshnessStatus === "rejected") {
      result.skippedOld++
      console.log(
        `[COLLECT] Skip stale link ${link.url}: ${link.freshnessReason}`
      )
      continue
    }

    const relevance = evaluateMobileGameNewsRelevance({
      title: link.title,
      excerpt: link.excerpt,
      url: link.url,
    })

    if (!relevance.allowed && relevance.reason === "non_game_entertainment") {
      result.skippedIrrelevant++
      console.log(
        `[COLLECT] Skip irrelevant link ${link.url}: ${relevance.reason}`
      )
      continue
    }

    const queued = await queueLink(source, link)
    if (queued) {
      result.queued++
    } else {
      result.failed++
    }
  }

  return result
}

export async function collectNewsLinks() {
  const { data: sources, error } = await supabaseAdmin
    .from("news_sources")
    .select("*")

  if (error || !sources) {
    console.error("[COLLECT] Failed to load sources", error?.message)
    return {
      success: false,
      sources: 0,
      queued: 0,
      skippedOld: 0,
      skippedIrrelevant: 0,
      failed: 0,
    }
  }

  let queued = 0
  let skippedOld = 0
  let skippedIrrelevant = 0
  let failed = 0

  for (const rawSource of sources as Record<string, unknown>[]) {
    const sourceQuality = validateSourceQuality(rawSource)
    if (!sourceQuality.allowed) {
      console.log(
        `[COLLECT] Source skipped ${String(rawSource.name || rawSource.domain || rawSource.id)}: ${sourceQuality.reason}`
      )
      continue
    }

    const source = toSourceConfig(rawSource)

    console.log(`[COLLECT] Discovering ${source.name || source.domain}`)

    const discovered = await discoverNewsLinks(source)

    if (discovered.failures.length > 0 && discovered.links.length === 0) {
      console.error(
        `[COLLECT] Source failed ${source.name || source.domain}:`,
        discovered.failures.join("; ")
      )
      await updateSourceFailure(rawSource, discovered.failures, discovered.blocked)
      failed++
      continue
    }

    const inserted = await queueDiscoveredLinks(source, discovered.links)
    queued += inserted.queued
    skippedOld += inserted.skippedOld
    skippedIrrelevant += inserted.skippedIrrelevant
    failed += inserted.failed

    if (inserted.queued > 0) {
      await updateSourceSuccess(rawSource)
    } else if (discovered.failures.length > 0) {
      await updateSourceFailure(rawSource, discovered.failures, discovered.blocked)
    }

    console.log(
      `[COLLECT] ${source.name || source.domain}: queued=${inserted.queued}, stale=${inserted.skippedOld}, irrelevant=${inserted.skippedIrrelevant}, failed=${inserted.failed}`
    )
  }

  return {
    success: true,
    sources: sources.length,
    queued,
    skippedOld,
    skippedIrrelevant,
    failed,
  }
}

export async function collectRssNews() {
  return collectNewsLinks()
}
