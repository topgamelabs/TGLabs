import { NextResponse, type NextRequest } from "next/server"
import { requireOperationalAuth } from "@/lib/apiAuth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import {
  getArticleBlockMetrics,
  parseArticleBlocks,
} from "@/lib/news/articleBlocks"

export const runtime = "nodejs"

type DraftArticle = {
  id: string
  title: string
  slug: string
  content: string
  created_at: string | null
}

const MIN_PUBLISH_TEXT_LENGTH = 1000
const MIN_PUBLISH_PARAGRAPHS = 4
const MIN_PUBLISH_CONTENT_BLOCKS = 5

function requireCronAuth(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get("authorization")

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return null
  }

  return requireOperationalAuth(req)
}

async function getNextDraftArticle() {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("id,title,slug,content,created_at")
    .eq("status", "draft")
    .eq("is_published", false)
    .eq("ai_generated", true)
    .not("source_url", "is", null)
    .order("created_at", { ascending: true, nullsFirst: false })
    .limit(25)

  if (error) {
    throw new Error(`PUBLISH_SELECT_FAILED: ${error.message}`)
  }

  const skipped: Array<{ id: string; title: string; reason: string }> = []

  for (const article of (data || []) as DraftArticle[]) {
    const quality = validateDraftQuality(article)

    if (quality.ok) {
      return { article, skipped }
    }

    skipped.push({
      id: article.id,
      title: article.title,
      reason: quality.reason || "AUTO_PUBLISH_QUALITY_CHECK_FAILED",
    })
  }

  return { article: null, skipped }
}

function validateDraftQuality(article: DraftArticle) {
  try {
    const parsed = JSON.parse(article.content)
    const blocks = parseArticleBlocks(parsed)
    const metrics = getArticleBlockMetrics(blocks)
    const contentBlocks = blocks.filter((block) =>
      ["paragraph", "heading", "bullet"].includes(block.type)
    )
    const firstContentBlock = blocks.find((block) => block.type !== "rule")

    if (metrics.textLength < MIN_PUBLISH_TEXT_LENGTH) {
      return { ok: false, reason: "ARTICLE_TOO_SHORT_FOR_AUTO_PUBLISH" }
    }

    if (metrics.paragraphs < MIN_PUBLISH_PARAGRAPHS) {
      return { ok: false, reason: "TOO_FEW_PARAGRAPHS_FOR_AUTO_PUBLISH" }
    }

    if (contentBlocks.length < MIN_PUBLISH_CONTENT_BLOCKS) {
      return { ok: false, reason: "TOO_FEW_CONTENT_BLOCKS_FOR_AUTO_PUBLISH" }
    }

    if (firstContentBlock?.type === "quote") {
      return { ok: false, reason: "QUOTE_FIRST_OR_QUOTE_ONLY_AUTO_PUBLISH_BLOCKED" }
    }

    return { ok: true, reason: null }
  } catch {
    return { ok: false, reason: "ARTICLE_CONTENT_NOT_VALID_JSON_BLOCKS" }
  }
}

async function publishArticle(article: DraftArticle) {
  const publishedAt = new Date().toISOString()
  const { data, error } = await supabaseAdmin
    .from("articles")
    .update({
      status: "published",
      is_published: true,
      published_at: publishedAt,
      updated_at: publishedAt,
    })
    .eq("id", article.id)
    .eq("status", "draft")
    .eq("is_published", false)
    .select("id,title,slug,status,is_published,published_at")
    .maybeSingle()

  if (error) {
    throw new Error(`PUBLISH_UPDATE_FAILED: ${error.message}`)
  }

  return data
}

export async function GET(req: NextRequest) {
  const unauthorized = requireCronAuth(req)
  if (unauthorized) return unauthorized

  try {
    const dryRun = req.nextUrl.searchParams.get("dryRun") === "1"
    const { article, skipped } = await getNextDraftArticle()

    if (!article) {
      return NextResponse.json({
        success: true,
        published: false,
        message: "NO_READY_DRAFT_ARTICLE",
        skipped,
      })
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        published: false,
        dryRun: true,
        nextArticle: article,
        skipped,
      })
    }

    const publishedArticle = await publishArticle(article)

    if (!publishedArticle) {
      return NextResponse.json({
        success: true,
        published: false,
        message: "ARTICLE_ALREADY_CHANGED",
        skippedArticle: article,
        skipped,
      })
    }

    return NextResponse.json({
      success: true,
      published: true,
      article: publishedArticle,
      skipped,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "PUBLISH_CRON_FAILED"

    console.error("PUBLISH CRON ERROR:", message)

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    )
  }
}
