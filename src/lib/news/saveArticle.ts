import * as cheerio from "cheerio"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getArticleBlockMetrics, parseArticleBlocks } from "./articleBlocks"

const AUTHOR_ID = "33333333-3333-3333-3333-333333333333"

export type ArticleCategory =
  | "news"
  | "gaming"
  | "mobile"
  | "pc-console"
  | "tips"
  | "review"
  | "tech"
  | "tournament"
  | "live"

export interface ArticleDraft {
  title: string
  slug?: string
  excerpt: string
  content: string
  seo_title: string
  seo_description: string
  category?: ArticleCategory
}

export interface ArticleSourceContext {
  sourceUrl: string
  rawContent: string
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

export function normalizeArticleSlug(value: string | null | undefined) {
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

export function buildArticleSlug(article: ArticleDraft) {
  return slugify(
    normalizeArticleSlug(article.slug) ||
      normalizeArticleSlug(article.seo_title) ||
      normalizeArticleSlug(article.title) ||
      "news"
  )
}

function estimateReadTime(content: string) {
  let text = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()

  try {
    const parsed = JSON.parse(content)
    text = getArticleBlockMetrics(parseArticleBlocks(parsed)).text
  } catch {
    // Keep HTML/plain text fallback for legacy articles.
  }

  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 220))
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

export async function saveArticleDraft(
  source: ArticleSourceContext,
  article: ArticleDraft,
  options: { publish?: boolean } = {}
) {
  const publish = options.publish === true
  const slug = buildArticleSlug(article)
  const heroImage = resolveImageUrl(
    extractHeroImage(source.rawContent, article.title),
    source.sourceUrl
  )
  const articlePatch = {
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    slug,
    category: article.category || "gaming",
    author_id: AUTHOR_ID,
    status: publish ? "published" : "draft",
    is_published: publish,
    ai_generated: true,
    source_url: source.sourceUrl,
    hero_image: heroImage,
    seo_title: article.seo_title,
    seo_description: article.seo_description,
    read_time: estimateReadTime(article.content),
    published_at: publish ? new Date().toISOString() : null,
  }

  const { data: existingDraft, error: existingDraftError } = await supabaseAdmin
    .from("articles")
    .select("id")
    .eq("source_url", source.sourceUrl)
    .eq("is_published", false)
    .limit(1)
    .maybeSingle()

  if (existingDraftError) {
    throw new Error(`ARTICLE_DRAFT_LOOKUP_FAILED: ${existingDraftError.message}`)
  }

  if (existingDraft) {
    const { data, error } = await supabaseAdmin
      .from("articles")
      .update(articlePatch)
      .eq("id", existingDraft.id)
      .select("id,slug,title,status,is_published")
      .single()

    if (error) {
      throw new Error(`ARTICLE_UPDATE_FAILED: ${error.message}`)
    }

    return data as {
      id: string
      slug: string
      title: string
      status: string
      is_published: boolean
    }
  }

  const { data, error } = await supabaseAdmin
    .from("articles")
    .insert(articlePatch)
    .select("id,slug,title,status,is_published")
    .single()

  if (error) {
    if (error.code === "23505") {
      throw new Error("DUPLICATE_PUBLISHED_SOURCE_URL")
    }

    throw new Error(`ARTICLE_INSERT_FAILED: ${error.message}`)
  }

  return data as {
    id: string
    slug: string
    title: string
    status: string
    is_published: boolean
  }
}
