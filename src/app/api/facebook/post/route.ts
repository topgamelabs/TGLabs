import { NextResponse, type NextRequest } from "next/server"
import { requireOperationalAuth } from "@/lib/apiAuth"
import {
  findFacebookCreativeMapping,
  resolveWorkspaceCreativePath,
} from "@/lib/facebook/creativeMapping"
import { getReadyFacebookFinalImage } from "@/lib/facebook/creativeStorage"
import {
  publishFacebookPageComment,
  publishFacebookPagePhotoUpload,
  publishFacebookPagePhotoPost,
  publishFacebookPagePost,
} from "@/lib/facebook/pages"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export const runtime = "nodejs"

type ArticleForFacebook = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  hero_image: string | null
  status: string | null
  is_published: boolean
  published_at: string | null
  facebook_post_id: string | null
  facebook_posted_at: string | null
  facebook_first_comment_id: string | null
  facebook_post_error: string | null
}

function getSiteUrl() {
  return (
    process.env.FACEBOOK_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://www.tglabs.info"
  ).replace(/\/$/, "")
}

function articleUrl(slug: string) {
  return `${getSiteUrl()}/news/${slug}`
}

function buildArticleMessage(article: ArticleForFacebook) {
  const lines = [article.title.trim()]

  if (article.excerpt?.trim()) {
    lines.push("", article.excerpt.trim())
  }

  return lines.join("\n")
}

function buildArticleComment(article: ArticleForFacebook, link: string) {
  return `อ่านต่อ: ${link || articleUrl(article.slug)}`
}

function facebookObjectId(post: { id: string; post_id?: string }) {
  return post.post_id || post.id
}

async function getArticle(id: string) {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select(
      "id,title,slug,excerpt,hero_image,status,is_published,published_at,facebook_post_id,facebook_posted_at,facebook_first_comment_id,facebook_post_error"
    )
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw new Error(`ARTICLE_SELECT_FAILED: ${error.message}`)
  }

  return data as ArticleForFacebook | null
}

async function publishArticle(article: ArticleForFacebook) {
  const publishedAt = article.published_at || new Date().toISOString()
  const { data, error } = await supabaseAdmin
    .from("articles")
    .update({
      status: "published",
      is_published: true,
      published_at: publishedAt,
    })
    .eq("id", article.id)
    .select(
      "id,title,slug,excerpt,hero_image,status,is_published,published_at,facebook_post_id,facebook_posted_at,facebook_first_comment_id,facebook_post_error"
    )
    .single()

  if (error) {
    throw new Error(`ARTICLE_PUBLISH_FAILED: ${error.message}`)
  }

  return data as ArticleForFacebook
}

async function updateFacebookState(
  articleId: string,
  patch: {
    facebook_post_id?: string | null
    facebook_posted_at?: string | null
    facebook_first_comment_id?: string | null
    facebook_post_error?: string | null
    facebook_last_attempt_at?: string | null
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

export async function POST(req: NextRequest) {
  const unauthorized = requireOperationalAuth(req)
  if (unauthorized) return unauthorized

  try {
    const body = await req.json()
    const articleId =
      typeof body.articleId === "string" ? body.articleId.trim() : ""
    const dryRun = body.dryRun === true
    const mode = body.mode === "photo" ? "photo" : "feed"

    let message = typeof body.message === "string" ? body.message.trim() : ""
    let link = typeof body.link === "string" ? body.link.trim() : ""
    let article: ArticleForFacebook | null = null

    if (articleId) {
      article = await getArticle(articleId)

      if (!article) {
        return NextResponse.json(
          { success: false, error: "ARTICLE_NOT_FOUND" },
          { status: 404 }
        )
      }

      message ||= buildArticleMessage(article)
      link ||= articleUrl(article.slug)
    }

    if (!message) {
      return NextResponse.json(
        { success: false, error: "MESSAGE_REQUIRED" },
        { status: 400 }
      )
    }

    const scheduledPublishTime =
      typeof body.scheduledPublishTime === "string" ||
      typeof body.scheduledPublishTime === "number"
        ? body.scheduledPublishTime
        : undefined

    const payload = {
      message,
      link: link || undefined,
      published:
        typeof body.published === "boolean" ? body.published : undefined,
      scheduledPublishTime,
    }

    if (mode === "photo") {
      if (!article) {
        return NextResponse.json(
          { success: false, error: "ARTICLE_ID_REQUIRED_FOR_PHOTO_POST" },
          { status: 400 }
        )
      }

      const shouldPublishArticle =
        !article.is_published && body.publishArticle === true

      if (shouldPublishArticle && !dryRun) {
        article = await publishArticle(article)
      }

      if (!article.is_published && !shouldPublishArticle) {
        return NextResponse.json(
          { success: false, error: "ARTICLE_MUST_BE_PUBLISHED" },
          { status: 400 }
        )
      }

      if (article.facebook_post_id) {
        return NextResponse.json(
          {
            success: false,
            error: "FACEBOOK_POST_ALREADY_EXISTS",
            facebookPostId: article.facebook_post_id,
            facebookPostedAt: article.facebook_posted_at,
          },
          { status: 409 }
        )
      }

      const mappedCreative = await findFacebookCreativeMapping(article.id)
      const storedCreative = await getReadyFacebookFinalImage(article.id)
      const requestedImageFilePath =
        typeof body.imageFilePath === "string" && body.imageFilePath.trim()
          ? body.imageFilePath.trim()
          : ""
      const mappedImageFilePath = mappedCreative?.finalImagePath?.trim() || ""
      const imageFilePath = requestedImageFilePath || mappedImageFilePath
      const resolvedImageFilePath = imageFilePath
        ? resolveWorkspaceCreativePath(imageFilePath)
        : ""
      const requestedImageUrl =
        typeof body.imageUrl === "string" && body.imageUrl.trim()
          ? body.imageUrl.trim()
          : ""
      const imageUrl =
        requestedImageUrl ||
        storedCreative?.publicUrl ||
        mappedCreative?.finalImageUrl?.trim() ||
        article.hero_image?.trim() ||
        ""
      const caption = message
      const firstComment =
        typeof body.firstComment === "string" && body.firstComment.trim()
          ? body.firstComment.trim()
          : buildArticleComment(article, link)

      if (!resolvedImageFilePath && !imageUrl) {
        return NextResponse.json(
          { success: false, error: "FACEBOOK_IMAGE_REQUIRED" },
          { status: 400 }
        )
      }

      const photoPayload = {
        imageUrl: resolvedImageFilePath ? undefined : imageUrl,
        imageFilePath: resolvedImageFilePath || undefined,
        caption,
        published:
          typeof body.published === "boolean" ? body.published : undefined,
        scheduledPublishTime,
      }

      if (dryRun) {
        return NextResponse.json({
          success: true,
          dryRun: true,
          mode,
          article,
          willPublishArticle: shouldPublishArticle,
          mappedCreative,
          storedCreative,
          photoPost: photoPayload,
          firstComment,
        })
      }

      await updateFacebookState(article.id, {
        facebook_post_error: null,
      })

      let facebookPhotoPost: Awaited<
        ReturnType<typeof publishFacebookPagePhotoPost>
      >
      try {
        facebookPhotoPost = resolvedImageFilePath
          ? await publishFacebookPagePhotoUpload({
              imageFilePath: resolvedImageFilePath,
              caption,
              published:
                typeof body.published === "boolean"
                  ? body.published
                  : undefined,
              scheduledPublishTime,
            })
          : await publishFacebookPagePhotoPost({
              imageUrl,
              caption,
              published:
                typeof body.published === "boolean"
                  ? body.published
                  : undefined,
              scheduledPublishTime,
            })
      } catch (postError) {
        const postMessage =
          postError instanceof Error
            ? postError.message
            : "FACEBOOK_PHOTO_POST_FAILED"

        await updateFacebookState(article.id, {
          facebook_post_error: postMessage,
        })

        return NextResponse.json(
          {
            success: false,
            error: postMessage,
            article,
          },
          { status: 500 }
        )
      }
      const objectId = facebookObjectId(facebookPhotoPost)

      await updateFacebookState(article.id, {
        facebook_post_id: objectId,
        facebook_posted_at: new Date().toISOString(),
        facebook_post_error: null,
      })

      try {
        const facebookComment = await publishFacebookPageComment({
          objectId,
          message: firstComment,
        })

        await updateFacebookState(article.id, {
          facebook_first_comment_id: facebookComment.id,
          facebook_post_error: null,
        })

        return NextResponse.json({
          success: true,
          mode,
          facebookPhotoPost,
          facebookComment,
          article,
        })
      } catch (commentError) {
        const commentMessage =
          commentError instanceof Error
            ? commentError.message
            : "FACEBOOK_FIRST_COMMENT_FAILED"

        await updateFacebookState(article.id, {
          facebook_post_error: commentMessage,
        })

        return NextResponse.json({
          success: true,
          mode,
          warning: "FACEBOOK_PHOTO_POSTED_COMMENT_FAILED",
          facebookPhotoPost,
          commentError: commentMessage,
          article,
        })
      }
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        mode,
        article,
        post: payload,
      })
    }

    const facebookPost = await publishFacebookPagePost(payload)

    return NextResponse.json({
      success: true,
      facebookPost,
      article,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "FACEBOOK_POST_ROUTE_FAILED"

    console.error("FACEBOOK POST ERROR:", message)

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    )
  }
}
