import { NextResponse, type NextRequest } from "next/server"
import { requireOperationalAuth } from "@/lib/apiAuth"
import { getOpenClawCandidates } from "@/lib/news/openClawCandidates"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const unauthorized = requireOperationalAuth(req)
  if (unauthorized) return unauthorized

  const limitParam = req.nextUrl.searchParams.get("limit")
  const limit = limitParam ? Number(limitParam) : undefined
  const candidates = await getOpenClawCandidates(limit)

  return NextResponse.json({
    success: true,
    count: candidates.length,
    candidates,
  })
}
