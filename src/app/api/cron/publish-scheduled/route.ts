import { NextResponse, type NextRequest } from "next/server"
import { requireOperationalAuth } from "@/lib/apiAuth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import {
  getArticleBlockMetrics,
  parseArticleBlocks,
} from "@/lib/news/articleBlocks"
import { getReadyFacebookFinalImage } from "@/lib/facebook/creativeStorage"
import {
  publishFacebookPageComment,
  publishFacebookPagePhotoPost,
} from "@/lib/facebook/pages"

export const runtime = "nodejs"

type DraftArticle = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  created_at: string | null
  facebook_post_id: string | null
}

type ReadyDraftArticle = DraftArticle & {
  facebookFinalImageUrl: string
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
    .select("id,title,slug,excerpt,content,created_at,facebook_post_id")
    .eq("status", "draft")
    .eq("is_published", false)
    .eq("ai_generated", true)
    .not("source_url", "is", null)
    .is("facebook_post_id", null)
    .order("created_at", { ascending: true, nullsFirst: false })
    .limit(25)

  if (error) {
    throw new Error(`PUBLISH_SELECT_FAILED: ${error.message}`)
  }

  const skipped: Array<{ id: string; title: string; reason: string }> = []

  for (const article of (data || []) as DraftArticle[]) {
    const quality = validateDraftQuality(article)

    if (quality.ok) {
      const finalImage = await getReadyFacebookFinalImage(article.id)

      if (finalImage) {
        return {
          article: {
            ...article,
            facebookFinalImageUrl: finalImage.publicUrl,
          },
          skipped,
        }
      }

      skipped.push({
        id: article.id,
        title: article.title,
        reason: "FACEBOOK_FINAL_IMAGE_NOT_READY",
      })
      continue
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

async function publishArticle(article: ReadyDraftArticle) {
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
    .select("id,title,slug,excerpt,status,is_published,published_at,facebook_post_id,facebook_posted_at,facebook_first_comment_id")
    .maybeSingle()

  if (error) {
    throw new Error(`PUBLISH_UPDATE_FAILED: ${error.message}`)
  }

  return data
}

function getSiteUrl() {
  return (
    process.env.FACEBOOK_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.tglabs.info"
  ).replace(/\/$/, "")
}

function articleUrl(slug: string) {
  return `${getSiteUrl()}/news/${slug}`
}

function buildArticleMessage(article: Pick<DraftArticle, "title" | "excerpt">) {
  const lines = [article.title.trim()]

  if (article.excerpt?.trim()) {
    lines.push("", article.excerpt.trim())
  }

  return lines.join("\n")
}

function facebookObjectId(post: { id: string; post_id?: string }) {
  return post.post_id || post.id
}

async function updateFacebookState(
  articleId: string,
  patch: {
    facebook_post_id?: string | null
    facebook_posted_at?: string | null
    facebook_first_comment_id?: string | null
    facebook_post_error?: string | null
  }
) {
  const { error } = await supabaseAdmin
    .from("articles")
    .update({
      ...patch,
      facebook_last_attempt_at: new Date().toISOString(),
    })
    .eq("id", articleId)

  if (error) {
    throw new Error(`FACEBOOK_STATE_UPDATE_FAILED: ${error.message}`)
  }
}

async function postPublishedArticleToFacebook(article: ReadyDraftArticle) {
  const caption = buildArticleMessage(article)
  const link = articleUrl(article.slug)
  const firstComment = `อ่านต่อ: ${link}`

  await updateFacebookState(article.id, {
    facebook_post_error: null,
  })

  const facebookPhotoPost = await publishFacebookPagePhotoPost({
    imageUrl: article.facebookFinalImageUrl,
    caption,
  })
  const objectId = facebookObjectId(facebookPhotoPost)

  await updateFacebookState(article.id, {
    facebook_post_id: objectId,
    facebook_posted_at: new Date().toISOString(),
    facebook_post_error: null,
  })

  const facebookComment = await publishFacebookPageComment({
    objectId,
    message: firstComment,
  })

  await updateFacebookState(article.id, {
    facebook_first_comment_id: facebookComment.id,
    facebook_post_error: null,
  })

  return {
    facebookPhotoPost,
    facebookComment,
  }
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

    try {
      const facebook = await postPublishedArticleToFacebook({
        ...article,
        ...publishedArticle,
      })

      return NextResponse.json({
        success: true,
        published: true,
        facebookPosted: true,
        article: publishedArticle,
        facebook,
        skipped,
      })
    } catch (facebookError) {
      const facebookMessage =
        facebookError instanceof Error
          ? facebookError.message
          : "FACEBOOK_CRON_POST_FAILED"

      await updateFacebookState(article.id, {
        facebook_post_error: facebookMessage,
      })

      return NextResponse.json({
        success: true,
        published: true,
        facebookPosted: false,
        facebookError: facebookMessage,
        article: publishedArticle,
        skipped,
      })
    }
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
