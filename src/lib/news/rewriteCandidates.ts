import * as cheerio from "cheerio"
import { requireEnv } from "@/lib/env"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import {
  cleanupNonRewriteablePendingQueue,
  cleanupStalePendingRewriteQueue,
  getOpenClawCandidates,
  type OpenClawCandidate,
} from "./openClawCandidates"
import { normalizeTitle } from "./newsIdentity"

const AUTHOR_ID = "33333333-3333-3333-3333-333333333333"
const DEFAULT_REWRITE_LIMIT = 3
const MAX_REWRITE_LIMIT = 10
const DEFAULT_AI_ATTEMPTS = 2
const MAX_SOURCE_TEXT_LENGTH = 20000
const OPENAI_REWRITE_PROVIDER = "openai"
const DEFAULT_OPENAI_REWRITE_MODEL = "gpt-4o-mini"
const DEFAULT_OPENAI_CLASSIFIER_MODEL = "gpt-4o-mini"
const STALE_PROCESSING_MINUTES = 30
const MIN_REWRITE_TEXT_LENGTH = 1200
const MIN_REWRITE_PARAGRAPHS = 5
const MIN_REWRITE_H2 = 3
const DISALLOWED_FOREIGN_SCRIPT_PATTERN = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u

type ArticleCategory = "news" | "tips" | "review" | "tech" | "tournament" | "live"
type ClassificationDecision = "mobile_game" | "cross_platform_game" | "reject"

interface RewrittenArticle {
  title: string
  slug?: string
  excerpt: string
  content: string
  seo_title: string
  seo_description: string
  category?: ArticleCategory
}

interface ExistingArticleTitle {
  id: string
  title: string | null
  seo_title: string | null
  source_url: string | null
}

interface DuplicateCheckResult {
  articleId: string
  reason: string
  matchedField: "source_url" | "title" | "seo_title"
}

interface NewsClassification {
  decision: ClassificationDecision
  reason: string
  confidence: number
}

export interface RewriteCandidatesResult {
  dryRun: boolean
  provider: typeof OPENAI_REWRITE_PROVIDER
  model: string
  classifierModel: string
  processed: number
  published: number
  skippedDuplicate: number
  skippedIrrelevant: number
  failed: number
  recoveredStale: number
  cleanedStalePending: number
  cleanedNonRewriteablePending: number
  skippedClaimed: number
  articles: Array<{
    queueId: string
    articleId: string
    slug: string
    title: string
  }>
  failures: Array<{
    queueId: string
    sourceUrl: string
    reason: string
  }>
  duplicates: Array<{
    queueId: string
    sourceUrl: string
    reason: string
  }>
}

export interface RewriteCandidatesOptions {
  limit?: number
  dryRun?: boolean
  maxAttempts?: number
}

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]+/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)

  const suffix = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`

  return `${base || "news"}-${suffix}`
}

function normalizeSlug(value: string | null | undefined) {
  if (!value) return null

  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]+/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 90)
    .replace(/^-+|-+$/g, "")

  return slug || null
}

function buildArticleSlug(article: RewrittenArticle) {
  return slugify(
    normalizeSlug(article.slug) ||
      normalizeSlug(article.seo_title) ||
      normalizeSlug(article.title) ||
      "news"
  )
}

function estimateReadTime(content: string) {
  const text = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 220))
}

function resolveLimit(limit: number | undefined) {
  if (!Number.isFinite(limit)) return DEFAULT_REWRITE_LIMIT
  return Math.min(Math.max(Math.floor(limit || DEFAULT_REWRITE_LIMIT), 1), MAX_REWRITE_LIMIT)
}

function resolveAttempts(maxAttempts: number | undefined) {
  if (!Number.isFinite(maxAttempts)) return DEFAULT_AI_ATTEMPTS
  return Math.min(Math.max(Math.floor(maxAttempts || DEFAULT_AI_ATTEMPTS), 1), 3)
}

function extractSourceText(html: string) {
  const $ = cheerio.load(html)
  $("script,style,noscript,svg,iframe,form,nav,footer,header,aside").remove()

  const articleText =
    $("article").text() ||
    $("main").text() ||
    $("body").text() ||
    $.root().text()

  return articleText.replace(/\s+/g, " ").trim().slice(0, MAX_SOURCE_TEXT_LENGTH)
}

function extractHeroImage(html: string, fallbackTitle: string) {
  const $ = cheerio.load(html)
  const image =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content") ||
    $("article img").first().attr("src") ||
    $("main img").first().attr("src") ||
    $("img").first().attr("src")

  if (image) return image

  return `https://picsum.photos/seed/${encodeURIComponent(fallbackTitle)}/800/400`
}

function resolveImageUrl(image: string, sourceUrl: string) {
  try {
    return new URL(image, sourceUrl).toString()
  } catch {
    return image
  }
}

function buildPrompt(candidate: OpenClawCandidate, sourceText: string) {
  return `
You are a professional Thai gaming news editor for TopGame Thailand.

Rewrite the source into an original Thai news article. Do not copy sentences.
Keep factual claims conservative. If a detail is not present in the source,
do not invent it. Preserve names, dates, game titles, update versions, rewards,
codes, prices, platforms, and event windows exactly when present.

Return valid JSON only, no markdown fences.

Required JSON shape:
{
  "title": "Thai headline",
  "slug": "english-seo-url-slug",
  "excerpt": "1-2 sentence Thai summary",
  "content": "<p>...</p><h2>...</h2>",
  "seo_title": "SEO title",
  "seo_description": "SEO description",
  "category": "news"
}

Rules:
- Write in Thai.
- Use only Thai and English in the main article text.
- slug must be English only, lowercase, using a-z, 0-9, and hyphens.
- slug should describe the article clearly for SEO, for example: "monster-strike-sakamoto-days-collaboration".
- If the source has Chinese, Japanese, Korean, or other non-Thai/non-English text, translate or romanize it into English.
- Never output Chinese, Japanese, or Korean characters anywhere in title, excerpt, content, SEO fields, or slug.
- Use romanized English names for titles, characters, publishers, and events when a Thai translation is not established.
- Do not use foreign-language names as the primary title wording.
- Only rewrite mobile game or cross-platform game news.
- Reject anime, manga, movie, music, merchandise, and general entertainment news unless the source is clearly about a mobile/cross-platform game.
- category must be one of: news, tips, review, tech, tournament, live.
- Write a complete article, not a short summary.
- Use 5-8 paragraphs total, with short readable paragraphs. This is mandatory.
- Use 3-5 h2 sections when the source has enough details.
- Preserve important details from the source: developer, publisher, platform, release window, characters, systems, event details, rewards, codes, prices, and official links when present.
- content must be HTML with paragraphs and at least 2 h2 sections.
- Add one blockquote summarizing the most important point.
- If the source includes redeem codes, include every code in <code> tags.
- Keep each paragraph concise, but make the article detailed enough for readers who want the full news.
- Do not add a generic conclusion if the source does not need one.

Source title: ${candidate.raw_title || ""}
Source excerpt: ${candidate.raw_excerpt || ""}
Source URL: ${candidate.source_url}
Source published time: ${candidate.published_source_at}

Source text:
"""
${sourceText}
"""
`.trim()
}

function buildRepairPrompt(
  candidate: OpenClawCandidate,
  sourceText: string,
  previousError: string
) {
  return `
You are repairing a Thai gaming news rewrite that failed validation.

Previous validation error: ${previousError}

Return a fresh valid JSON object only, no markdown fences.

Required JSON shape:
{
  "title": "Thai headline",
  "slug": "english-seo-url-slug",
  "excerpt": "1-2 sentence Thai summary",
  "content": "<p>...</p><h2>...</h2>",
  "seo_title": "SEO title",
  "seo_description": "SEO description",
  "category": "news"
}

Repair rules:
- Write in Thai, with only Thai and English characters.
- Never output Chinese, Japanese, or Korean characters anywhere.
- Translate or romanize all non-Thai/non-English names.
- If the previous error says TOO_SHORT, write a fuller article with at least 1,400 Thai/English text characters.
- If the previous error says TOO_FEW_PARAGRAPHS, include 6-8 <p> paragraphs.
- If the previous error says TOO_FEW_H2, include 3-5 <h2> sections.
- Include exactly one useful <blockquote>.
- Keep factual claims conservative and do not invent missing details.
- Preserve source details such as platforms, release window, rewards, campaign details, official links, and developer/publisher when present.
- Do not add filler or a generic conclusion.

Source title: ${candidate.raw_title || ""}
Source excerpt: ${candidate.raw_excerpt || ""}
Source URL: ${candidate.source_url}
Source published time: ${candidate.published_source_at}

Source text:
"""
${sourceText}
"""
`.trim()
}

function buildClassificationPrompt(candidate: OpenClawCandidate, sourceText: string) {
  return `
You are a strict news classifier for TopGame Thailand.

Classify whether this source should be rewritten for a Thai gaming news site
that currently focuses only on mobile games and cross-platform games.

Return valid JSON only, no markdown fences.

Required JSON shape:
{
  "decision": "mobile_game | cross_platform_game | reject",
  "reason": "short reason",
  "confidence": 0.0
}

Decision rules:
- mobile_game: clearly about a mobile game, gacha game, mobile MMORPG, iOS/Android launch, mobile update, mobile event, mobile pre-registration, mobile redeem code, or mobile game service.
- cross_platform_game: clearly about a game available across mobile plus PC/console, or a game service where mobile support is explicitly present.
- reject: anime, manga, movie, music, merchandise, general entertainment, console-only, PC-only, hardware, or unclear topics.
- reject: game profile pages, category pages, tag pages, directory pages, sales chart pages, and pages that are not a specific news article.
- If the article only mentions a game platform in site chrome/navigation/ads, reject it.
- If mobile/cross-platform support is not clear from the actual article body, reject it.

Source title: ${candidate.raw_title || ""}
Source excerpt: ${candidate.raw_excerpt || ""}
Source URL: ${candidate.source_url}
Source published time: ${candidate.published_source_at}

Source text:
"""
${sourceText.slice(0, 8000)}
"""
`.trim()
}

function parseJsonObject(text: string) {
  const trimmed = text.replace(/```json|```/g, "").trim()
  const start = trimmed.indexOf("{")
  const end = trimmed.lastIndexOf("}")

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI_JSON_NOT_FOUND")
  }

  return JSON.parse(trimmed.slice(start, end + 1))
}

function validateClassification(value: unknown): NewsClassification {
  const data = value as Partial<NewsClassification>
  const decision = data.decision || "reject"

  if (!["mobile_game", "cross_platform_game", "reject"].includes(decision)) {
    throw new Error("AI_CLASSIFICATION_BAD_DECISION")
  }

  return {
    decision: decision as ClassificationDecision,
    reason: (data.reason || "classified_by_ai").trim().slice(0, 500),
    confidence:
      typeof data.confidence === "number" && Number.isFinite(data.confidence)
        ? Math.min(Math.max(data.confidence, 0), 1)
        : 0,
  }
}

function removeParenthesizedText(value: string) {
  return value.replace(/\([^)]*\)/g, " ")
}

function hasDisallowedForeignScriptOutsideParentheses(value: string) {
  return DISALLOWED_FOREIGN_SCRIPT_PATTERN.test(removeParenthesizedText(value))
}

function validateRewrite(value: unknown): RewrittenArticle {
  const data = value as Partial<RewrittenArticle>
  const category = data.category || "news"
  const allowedCategories: ArticleCategory[] = [
    "news",
    "tips",
    "review",
    "tech",
    "tournament",
    "live",
  ]

  if (!data.title || !data.excerpt || !data.content) {
    throw new Error("AI_REWRITE_INCOMPLETE")
  }

  if (!data.content.includes("<p") || !data.content.includes("<h2")) {
    throw new Error("AI_REWRITE_BAD_HTML")
  }

  const languageCheckFields = [
    data.title,
    data.excerpt,
    data.content,
    data.seo_title,
    data.seo_description,
  ]

  if (
    languageCheckFields.some(
      (field) => field && hasDisallowedForeignScriptOutsideParentheses(field)
    )
  ) {
    throw new Error("AI_REWRITE_UNTRANSLATED_FOREIGN_TEXT")
  }

  const text = data.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  const paragraphCount = (data.content.match(/<p\b/gi) || []).length
  const h2Count = (data.content.match(/<h2\b/gi) || []).length

  if (text.length < MIN_REWRITE_TEXT_LENGTH) {
    throw new Error("AI_REWRITE_TOO_SHORT")
  }

  if (paragraphCount < MIN_REWRITE_PARAGRAPHS) {
    throw new Error("AI_REWRITE_TOO_FEW_PARAGRAPHS")
  }

  if (h2Count < MIN_REWRITE_H2) {
    throw new Error("AI_REWRITE_TOO_FEW_H2")
  }

  return {
    title: data.title.trim(),
    slug: normalizeSlug(data.slug || data.seo_title || data.title) || undefined,
    excerpt: data.excerpt.trim(),
    content: data.content.trim(),
    seo_title: (data.seo_title || data.title).trim(),
    seo_description: (data.seo_description || data.excerpt).trim(),
    category: allowedCategories.includes(category) ? category : "news",
  }
}

async function requestOpenAiJson(
  apiKey: string,
  prompt: string,
  options: {
    model: string
    temperature: number
    timeoutMs: number
    errorPrefix: string
  }
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs)

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        temperature: options.temperature,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`${options.errorPrefix}_HTTP_${response.status}: ${await response.text()}`)
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ""

    return parseJsonObject(text)
  } finally {
    clearTimeout(timeout)
  }
}

async function classifyCandidate(
  apiKey: string,
  candidate: OpenClawCandidate,
  sourceText: string
) {
  const model =
    process.env.OPENAI_CLASSIFIER_MODEL || DEFAULT_OPENAI_CLASSIFIER_MODEL
  const raw = await requestOpenAiJson(
    apiKey,
    buildClassificationPrompt(candidate, sourceText),
    {
      model,
      temperature: 0,
      timeoutMs: 30000,
      errorPrefix: "AI_CLASSIFIER",
    }
  )

  return validateClassification(raw)
}

async function generateRewrite(
  apiKey: string,
  candidate: OpenClawCandidate,
  sourceText: string,
  repairReason?: string
) {
  const prompt = repairReason
    ? buildRepairPrompt(candidate, sourceText, repairReason)
    : buildPrompt(candidate, sourceText)

  return requestRewrite(apiKey, prompt)
}

function getRewriteSourceText(candidate: OpenClawCandidate) {
  const apiKey = requireEnv("OPENAI_API_KEY")
  const sourceText = extractSourceText(candidate.raw_content)

  if (sourceText.length < 500) {
    throw new Error("SOURCE_TEXT_TOO_SHORT")
  }

  return { apiKey, sourceText }
}

async function requestRewrite(apiKey: string, prompt: string) {
  const raw = await requestOpenAiJson(apiKey, prompt, {
    model: process.env.OPENAI_REWRITE_MODEL || DEFAULT_OPENAI_REWRITE_MODEL,
    temperature: 0.4,
    timeoutMs: 45000,
    errorPrefix: "AI",
  })

  return validateRewrite(raw)
}

async function generateRewriteWithRetry(
  candidate: OpenClawCandidate,
  maxAttempts: number
) {
  let lastError: unknown
  let repairReason: string | undefined
  const { apiKey, sourceText } = getRewriteSourceText(candidate)
  const classification = await classifyCandidate(apiKey, candidate, sourceText)

  if (classification.decision === "reject") {
    throw new Error(`AI_CLASSIFIED_REJECT: ${classification.reason}`)
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return {
        article: await generateRewrite(
          apiKey,
          candidate,
          sourceText,
          repairReason
        ),
        attempts: attempt,
        classification,
      }
    } catch (error) {
      lastError = error
      const message = error instanceof Error ? error.message : "AI_REWRITE_FAILED"
      repairReason = message
      console.warn(
        `[AI WRITER] Attempt ${attempt}/${maxAttempts} failed ${candidate.source_url}: ${message}`
      )
    }
  }

  throw lastError instanceof Error ? lastError : new Error("AI_REWRITE_FAILED")
}

async function findPublishedDuplicate(
  candidate: OpenClawCandidate
): Promise<DuplicateCheckResult | null> {
  const { data: sameUrl, error: urlError } = await supabaseAdmin
    .from("articles")
    .select("id")
    .eq("source_url", candidate.source_url)
    .limit(1)

  if (urlError) {
    throw new Error(`DUPLICATE_URL_CHECK_FAILED: ${urlError.message}`)
  }

  if (sameUrl && sameUrl.length > 0) {
    return {
      articleId: sameUrl[0].id,
      reason: "duplicate_published_source_url",
      matchedField: "source_url",
    }
  }

  const normalizedTitle = normalizeTitle(candidate.raw_title)
  if (!normalizedTitle) return null

  const { data: recentTitles, error: titleError } = await supabaseAdmin
    .from("articles")
    .select("id,title,seo_title,source_url")
    .not("title", "is", null)
    .order("published_at", { ascending: false })
    .limit(100)

  if (titleError) {
    throw new Error(`DUPLICATE_TITLE_CHECK_FAILED: ${titleError.message}`)
  }

  for (const article of (recentTitles || []) as ExistingArticleTitle[]) {
    if (normalizeTitle(article.title) === normalizedTitle) {
      return {
        articleId: article.id,
        reason: "duplicate_published_title",
        matchedField: "title",
      }
    }

    if (normalizeTitle(article.seo_title) === normalizedTitle) {
      return {
        articleId: article.id,
        reason: "duplicate_published_seo_title",
        matchedField: "seo_title",
      }
    }
  }

  return null
}

async function markQueue(
  queueId: string,
  patch: {
    extraction_status?: string
    rewrite_status?: string
    rewrite_attempts?: number
    rewrite_error?: string | null
    rewrite_started_at?: string | null
    rewrite_finished_at?: string | null
    rewritten_article_id?: string | null
  }
) {
  const { error } = await supabaseAdmin
    .from("raw_news_queue")
    .update(patch)
    .eq("id", queueId)

  if (error) {
    const fallbackPatch = {
      extraction_status: patch.extraction_status,
      rewrite_status: patch.rewrite_status,
    }

    const { error: fallbackError } = await supabaseAdmin
      .from("raw_news_queue")
      .update(fallbackPatch)
      .eq("id", queueId)

    if (fallbackError) {
      console.error(
        "[AI WRITER] Failed to update queue",
        queueId,
        fallbackError.message
      )
    }
  }
}

async function recoverStaleRewriteJobs() {
  const cutoff = new Date(
    Date.now() - STALE_PROCESSING_MINUTES * 60 * 1000
  ).toISOString()

  const patch = {
    extraction_status: "failed",
    rewrite_status: "failed",
    rewrite_error: "stale_processing_recovered",
    rewrite_finished_at: new Date().toISOString(),
  }

  const { data: staleRows, error: staleError } = await supabaseAdmin
    .from("raw_news_queue")
    .update(patch)
    .eq("rewrite_status", "processing")
    .lt("rewrite_started_at", cutoff)
    .select("id")

  if (staleError) {
    console.error("[AI WRITER] Failed to recover stale rewrite jobs", staleError.message)
    return 0
  }

  const { data: missingStartedRows, error: missingStartedError } = await supabaseAdmin
    .from("raw_news_queue")
    .update(patch)
    .eq("rewrite_status", "processing")
    .is("rewrite_started_at", null)
    .select("id")

  if (missingStartedError) {
    console.error(
      "[AI WRITER] Failed to recover rewrite jobs with missing start time",
      missingStartedError.message
    )
  }

  return (staleRows?.length || 0) + (missingStartedRows?.length || 0)
}

async function claimCandidate(queueId: string) {
  const patch = {
    extraction_status: "processing",
    rewrite_status: "processing",
    rewrite_attempts: 0,
    rewrite_error: null,
    rewrite_started_at: new Date().toISOString(),
    rewrite_finished_at: null,
    rewritten_article_id: null,
  }

  const { data, error } = await supabaseAdmin
    .from("raw_news_queue")
    .update(patch)
    .eq("id", queueId)
    .eq("extraction_status", "pending")
    .eq("rewrite_status", "pending")
    .select("id")
    .maybeSingle()

  if (!error) {
    return Boolean(data)
  }

  const { data: fallbackData, error: fallbackError } = await supabaseAdmin
    .from("raw_news_queue")
    .update({
      extraction_status: "processing",
      rewrite_status: "processing",
    })
    .eq("id", queueId)
    .eq("extraction_status", "pending")
    .eq("rewrite_status", "pending")
    .select("id")
    .maybeSingle()

  if (fallbackError) {
    throw new Error(`CLAIM_REWRITE_JOB_FAILED: ${fallbackError.message}`)
  }

  return Boolean(fallbackData)
}

async function insertArticle(candidate: OpenClawCandidate, article: RewrittenArticle) {
  const slug = buildArticleSlug(article)
  const heroImage = resolveImageUrl(
    extractHeroImage(candidate.raw_content, article.title),
    candidate.source_url
  )

  const { data, error } = await supabaseAdmin
    .from("articles")
    .insert({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      slug,
      category: article.category || "news",
      author_id: AUTHOR_ID,
      status: "published",
      is_published: true,
      ai_generated: true,
      source_url: candidate.source_url,
      hero_image: heroImage,
      seo_title: article.seo_title,
      seo_description: article.seo_description,
      read_time: estimateReadTime(article.content),
      published_at: new Date().toISOString(),
    })
    .select("id,slug,title")
    .single()

  if (error) {
    if (error.code === "23505") {
      throw new Error("DUPLICATE_PUBLISHED_SOURCE_URL")
    }

    throw new Error(`ARTICLE_INSERT_FAILED: ${error.message}`)
  }

  return data as { id: string; slug: string; title: string }
}

export async function rewriteOpenClawCandidates(
  options: RewriteCandidatesOptions | number = {}
) {
  const normalizedOptions =
    typeof options === "number" ? { limit: options } : options
  const limit = resolveLimit(normalizedOptions.limit)
  const dryRun = normalizedOptions.dryRun === true
  const maxAttempts = resolveAttempts(normalizedOptions.maxAttempts)

  const result: RewriteCandidatesResult = {
    dryRun,
    provider: OPENAI_REWRITE_PROVIDER,
    model: process.env.OPENAI_REWRITE_MODEL || DEFAULT_OPENAI_REWRITE_MODEL,
    classifierModel:
      process.env.OPENAI_CLASSIFIER_MODEL || DEFAULT_OPENAI_CLASSIFIER_MODEL,
    processed: 0,
    published: 0,
    skippedDuplicate: 0,
    skippedIrrelevant: 0,
    failed: 0,
    recoveredStale: 0,
    cleanedStalePending: 0,
    cleanedNonRewriteablePending: 0,
    skippedClaimed: 0,
    articles: [],
    failures: [],
    duplicates: [],
  }

  if (!dryRun) {
    result.recoveredStale = await recoverStaleRewriteJobs()
    result.cleanedStalePending = await cleanupStalePendingRewriteQueue()
    result.cleanedNonRewriteablePending = await cleanupNonRewriteablePendingQueue()
  }

  const candidates = await getOpenClawCandidates(limit, {
    markSkipped: !dryRun,
  })

  for (const candidate of candidates) {
    result.processed++
    console.log(`[AI WRITER] Rewriting ${candidate.source_url}`)

    if (!dryRun && !(await claimCandidate(candidate.id))) {
      result.skippedClaimed++
      continue
    }

    try {
      const duplicate = await findPublishedDuplicate(candidate)
      if (duplicate) {
        if (!dryRun) {
          await markQueue(candidate.id, {
            extraction_status: "skipped",
            rewrite_status: "duplicate",
            rewrite_error: duplicate.reason,
            rewrite_finished_at: new Date().toISOString(),
          })
        }

        result.skippedDuplicate++
        result.duplicates.push({
          queueId: candidate.id,
          sourceUrl: candidate.source_url,
          reason: `${duplicate.reason}:${duplicate.articleId}:${duplicate.matchedField}`,
        })
        continue
      }

      const rewritten = await generateRewriteWithRetry(candidate, maxAttempts)

      if (dryRun) {
        result.articles.push({
          queueId: candidate.id,
          articleId: "dry-run",
          slug: buildArticleSlug(rewritten.article),
          title: rewritten.article.title,
        })
        continue
      }

      const inserted = await insertArticle(candidate, rewritten.article)

      await markQueue(candidate.id, {
        extraction_status: "success",
        rewrite_status: "success",
        rewrite_attempts: rewritten.attempts,
        rewrite_error: null,
        rewrite_finished_at: new Date().toISOString(),
        rewritten_article_id: inserted.id,
      })

      result.published++
      result.articles.push({
        queueId: candidate.id,
        articleId: inserted.id,
        slug: inserted.slug,
        title: inserted.title,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI_REWRITE_FAILED"

      console.error(`[AI WRITER] Failed ${candidate.source_url}`, message)

      if (message === "DUPLICATE_PUBLISHED_SOURCE_URL") {
        result.skippedDuplicate++
        result.duplicates.push({
          queueId: candidate.id,
          sourceUrl: candidate.source_url,
          reason: message,
        })

        if (!dryRun) {
          await markQueue(candidate.id, {
            extraction_status: "skipped",
            rewrite_status: "duplicate",
            rewrite_error: message,
            rewrite_finished_at: new Date().toISOString(),
          })
        }

        continue
      }

      if (message.startsWith("AI_CLASSIFIED_REJECT:")) {
        result.skippedIrrelevant++
        result.failures.push({
          queueId: candidate.id,
          sourceUrl: candidate.source_url,
          reason: message,
        })

        if (!dryRun) {
          await markQueue(candidate.id, {
            extraction_status: "skipped",
            rewrite_status: "skipped",
            rewrite_error: message.slice(0, 2000),
            rewrite_finished_at: new Date().toISOString(),
          })
        }

        continue
      }

      result.failed++
      result.failures.push({
        queueId: candidate.id,
        sourceUrl: candidate.source_url,
        reason: message,
      })

      if (!dryRun) {
        await markQueue(candidate.id, {
          extraction_status: "failed",
          rewrite_status: "failed",
          rewrite_attempts: maxAttempts,
          rewrite_error: message.slice(0, 2000),
          rewrite_finished_at: new Date().toISOString(),
        })
      }
    }
  }

  return result
}
