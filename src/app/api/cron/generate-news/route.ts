import { NextResponse, type NextRequest } from "next/server"
import { requireOperationalAuth } from "@/lib/apiAuth"
import { collectNewsLinks } from "@/lib/news/collectRssNews"
import { processFetchQueue } from "@/lib/news/processFetchQueue"
import { processFreshnessValidation } from "@/lib/news/processFreshnessValidation"
import { rewriteOpenClawCandidates } from "@/lib/news/rewriteCandidates"

export const runtime = "nodejs"
export const maxDuration = 300

function shouldRunAiWriter(req: NextRequest) {
  const rewrite = req.nextUrl.searchParams.get("rewrite")

  return (
    rewrite === "1" ||
    rewrite === "dry-run" ||
    process.env.AI_WRITER_ENABLED === "true"
  )
}

function getOpenAiRewriteOptions(req: NextRequest) {
  const rewrite = req.nextUrl.searchParams.get("rewrite")
  const limit = Number(req.nextUrl.searchParams.get("rewriteLimit"))
  const publish = req.nextUrl.searchParams.get("publish")

  return {
    dryRun: rewrite === "dry-run",
    limit: Number.isFinite(limit) ? limit : 1,
    publish: publish === "1" || publish === "true",
    maxAttempts: 2,
  }
}

export async function GET(req: NextRequest) {
  const unauthorized = requireOperationalAuth(req)
  if (unauthorized) return unauthorized

  try {
    const collection = await collectNewsLinks()
    const fetchQueue = await processFetchQueue()
    const freshness = await processFreshnessValidation()
    const openAiRewrite = shouldRunAiWriter(req)
      ? await rewriteOpenClawCandidates(getOpenAiRewriteOptions(req))
      : "disabled"

    return NextResponse.json({
      success: true,
      stage: "rss_to_openai_rewrite",
      pipeline: [
        "RSS/source",
        "raw_news_queue",
        "fetch_full_content",
        "freshness_check",
        "openai_rewrite",
        "insert_articles",
      ],
      collection,
      fetchQueue,
      freshness,
      openAiRewrite,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "CRON_FAILED"

    console.error("INGESTION CRON ERROR:", message)

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    )
  }
}
