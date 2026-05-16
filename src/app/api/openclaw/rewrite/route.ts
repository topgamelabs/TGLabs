import { NextResponse, type NextRequest } from "next/server"
import { rewriteOpenClawCandidates } from "@/lib/news/rewriteCandidates"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export const runtime = "nodejs"

function isAuthorized(req: NextRequest) {
  const token = process.env.OPENCLAW_INGEST_TOKEN
  if (!token) return true

  const auth = req.headers.get("authorization")
  return auth === `Bearer ${token}`
}

async function countRewriteStatus(status: string) {
  const { count, error } = await supabaseAdmin
    .from("raw_news_queue")
    .select("id", { count: "exact", head: true })
    .eq("rewrite_status", status)

  if (error) {
    throw new Error(`COUNT_${status.toUpperCase()}_FAILED: ${error.message}`)
  }

  return count || 0
}

async function countEligiblePendingRewrite() {
  const { count, error } = await supabaseAdmin
    .from("raw_news_queue")
    .select("id", { count: "exact", head: true })
    .eq("fetch_status", "success")
    .eq("freshness_status", "accepted")
    .eq("extraction_status", "pending")
    .eq("rewrite_status", "pending")
    .not("raw_content", "is", null)
    .not("published_source_at", "is", null)

  if (error) {
    throw new Error(`COUNT_ELIGIBLE_PENDING_FAILED: ${error.message}`)
  }

  return count || 0
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 }
    )
  }

  try {
    const [
      pending,
      eligiblePending,
      processing,
      success,
      failed,
      duplicate,
      skipped,
    ] = await Promise.all([
      countRewriteStatus("pending"),
      countEligiblePendingRewrite(),
      countRewriteStatus("processing"),
      countRewriteStatus("success"),
      countRewriteStatus("failed"),
      countRewriteStatus("duplicate"),
      countRewriteStatus("skipped"),
    ])

    return NextResponse.json({
      success: true,
      rewriteQueue: {
        pending,
        eligiblePending,
        processing,
        success,
        failed,
        duplicate,
        skipped,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "REWRITE_STATUS_FAILED"

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 }
    )
  }

  try {
    const body = await req.json().catch(() => ({}))
    const limit = typeof body.limit === "number" ? body.limit : undefined
    const dryRun = body.dryRun === true
    const maxAttempts =
      typeof body.maxAttempts === "number" ? body.maxAttempts : undefined
    const result = await rewriteOpenClawCandidates({
      limit,
      dryRun,
      maxAttempts,
    })

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "REWRITE_FAILED"

    console.error("[OpenClaw] Rewrite route failed", message)

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    )
  }
}
