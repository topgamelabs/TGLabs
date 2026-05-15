import * as cheerio from "cheerio"
import { requireEnv } from "@/lib/env"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getOpenClawCandidates, type OpenClawCandidate } from "./openClawCandidates"
import { normalizeTitle } from "./newsIdentity"

const AUTHOR_ID = "33333333-3333-3333-3333-333333333333"
const DEFAULT_REWRITE_LIMIT = 3
const MAX_REWRITE_LIMIT = 10
const DEFAULT_AI_ATTEMPTS = 2
const MAX_SOURCE_TEXT_LENGTH = 12000

type ArticleCategory = "news" | "tips" | "review" | "tech" | "tournament" | "live"

interface RewrittenArticle {
  title: string
  excerpt: string
  content: string
  seo_title: string
  seo_description: string
  category?: ArticleCategory
}

interface ExistingArticleTitle {
  id: string
  title: string | null
}

export interface RewriteCandidatesResult {
  dryRun: boolean
  processed: number
  published: number
  skippedDuplicate: number
  failed: number
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
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)

  const suffix = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`

  return `${base || "news"}-${suffix}`
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

  return image || `https://picsum.photos/seed/${encodeURIComponent(fallbackTitle)}/800/400`
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
  "excerpt": "1-2 sentence Thai summary",
  "content": "<p>...</p><h2>...</h2>",
  "seo_title": "SEO title",
  "seo_description": "SEO description",
  "category": "news"
}

Rules:
- Write in Thai.
- category must be one of: news, tips, review, tech, tournament, live.
- content must be HTML with paragraphs and at least 2 h2 sections.
- Add one blockquote summarizing the most important point.
- If the source includes redeem codes, include every code in <code> tags.
- Keep the article useful, concise, and not clickbait.

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

function parseJsonObject(text: string) {
  const trimmed = text.replace(/```json|```/g, "").trim()
  const start = trimmed.indexOf("{")
  const end = trimmed.lastIndexOf("}")

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI_JSON_NOT_FOUND")
  }

  return JSON.parse(trimmed.slice(start, end + 1))
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

  return {
    title: data.title.trim(),
    excerpt: data.excerpt.trim(),
    content: data.content.trim(),
    seo_title: (data.seo_title || data.title).trim(),
    seo_description: (data.seo_description || data.excerpt).trim(),
    category: allowedCategories.includes(category) ? category : "news",
  }
}

async function generateRewrite(candidate: OpenClawCandidate) {
  const apiKey = requireEnv("OPENAI_API_KEY")
  const sourceText = extractSourceText(candidate.raw_content)

  if (sourceText.length < 500) {
    throw new Error("SOURCE_TEXT_TOO_SHORT")
  }

  return requestRewrite(apiKey, buildPrompt(candidate, sourceText))
}

async function requestRewrite(apiKey: string, prompt: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 45000)

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_REWRITE_MODEL || "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`AI_HTTP_${response.status}: ${await response.text()}`)
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ""

    return validateRewrite(parseJsonObject(text))
  } finally {
    clearTimeout(timeout)
  }
}

async function generateRewriteWithRetry(
  candidate: OpenClawCandidate,
  maxAttempts: number
) {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return {
        article: await generateRewrite(candidate),
        attempts: attempt,
      }
    } catch (error) {
      lastError = error
      const message = error instanceof Error ? error.message : "AI_REWRITE_FAILED"
      console.warn(
        `[AI WRITER] Attempt ${attempt}/${maxAttempts} failed ${candidate.source_url}: ${message}`
      )
    }
  }

  throw lastError instanceof Error ? lastError : new Error("AI_REWRITE_FAILED")
}

async function hasPublishedDuplicate(candidate: OpenClawCandidate) {
  const { data: sameUrl, error: urlError } = await supabaseAdmin
    .from("articles")
    .select("id")
    .eq("source_url", candidate.source_url)
    .limit(1)

  if (urlError) {
    throw new Error(`DUPLICATE_URL_CHECK_FAILED: ${urlError.message}`)
  }

  if (sameUrl && sameUrl.length > 0) return true

  const normalizedTitle = normalizeTitle(candidate.raw_title)
  if (!normalizedTitle) return false

  const { data: recentTitles, error: titleError } = await supabaseAdmin
    .from("articles")
    .select("id,title")
    .not("title", "is", null)
    .limit(100)

  if (titleError) {
    throw new Error(`DUPLICATE_TITLE_CHECK_FAILED: ${titleError.message}`)
  }

  return ((recentTitles || []) as ExistingArticleTitle[]).some(
    (article) => normalizeTitle(article.title) === normalizedTitle
  )
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

async function insertArticle(candidate: OpenClawCandidate, article: RewrittenArticle) {
  const slug = slugify(article.title)
  const heroImage = extractHeroImage(candidate.raw_content, article.title)

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
    processed: 0,
    published: 0,
    skippedDuplicate: 0,
    failed: 0,
    articles: [],
    failures: [],
    duplicates: [],
  }

  const candidates = await getOpenClawCandidates(limit)

  for (const candidate of candidates) {
    result.processed++
    console.log(`[AI WRITER] Rewriting ${candidate.source_url}`)

    if (!dryRun) {
      await markQueue(candidate.id, {
        extraction_status: "processing",
        rewrite_status: "processing",
        rewrite_attempts: 0,
        rewrite_error: null,
        rewrite_started_at: new Date().toISOString(),
        rewrite_finished_at: null,
        rewritten_article_id: null,
      })
    }

    try {
      if (await hasPublishedDuplicate(candidate)) {
        if (!dryRun) {
          await markQueue(candidate.id, {
            extraction_status: "skipped",
            rewrite_status: "duplicate",
            rewrite_error: "duplicate_published_article",
            rewrite_finished_at: new Date().toISOString(),
          })
        }

        result.skippedDuplicate++
        result.duplicates.push({
          queueId: candidate.id,
          sourceUrl: candidate.source_url,
          reason: "duplicate_published_article",
        })
        continue
      }

      const rewritten = await generateRewriteWithRetry(candidate, maxAttempts)

      if (dryRun) {
        result.articles.push({
          queueId: candidate.id,
          articleId: "dry-run",
          slug: slugify(rewritten.article.title),
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
