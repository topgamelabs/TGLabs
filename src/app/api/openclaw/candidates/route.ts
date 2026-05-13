import { NextResponse, type NextRequest } from "next/server"
import { getOpenClawCandidates } from "@/lib/news/openClawCandidates"

export const runtime = "nodejs"

function isAuthorized(req: NextRequest) {
  const token = process.env.OPENCLAW_INGEST_TOKEN
  if (!token) return true

  const auth = req.headers.get("authorization")
  return auth === `Bearer ${token}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 }
    )
  }

  const limitParam = req.nextUrl.searchParams.get("limit")
  const limit = limitParam ? Number(limitParam) : undefined
  const candidates = await getOpenClawCandidates(limit)

  return NextResponse.json({
    success: true,
    count: candidates.length,
    candidates,
  })
}
