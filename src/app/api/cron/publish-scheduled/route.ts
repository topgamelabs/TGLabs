import { NextResponse, type NextRequest } from "next/server"
import { requireOperationalAuth } from "@/lib/apiAuth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export const runtime = "nodejs"

type DraftArticle = {
  id: string
  title: string
  slug: string
  created_at: string | null
}

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
    .select("id,title,slug,created_at")
    .eq("status", "draft")
    .eq("is_published", false)
    .eq("ai_generated", true)
    .not("source_url", "is", null)
    .order("created_at", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`PUBLISH_SELECT_FAILED: ${error.message}`)
  }

  return data as DraftArticle | null
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
    const article = await getNextDraftArticle()

    if (!article) {
      return NextResponse.json({
        success: true,
        published: false,
        message: "NO_READY_DRAFT_ARTICLE",
      })
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        published: false,
        dryRun: true,
        nextArticle: article,
      })
    }

    const publishedArticle = await publishArticle(article)

    if (!publishedArticle) {
      return NextResponse.json({
        success: true,
        published: false,
        message: "ARTICLE_ALREADY_CHANGED",
        skippedArticle: article,
      })
    }

    return NextResponse.json({
      success: true,
      published: true,
      article: publishedArticle,
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
