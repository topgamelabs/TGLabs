import { NextResponse, type NextRequest } from "next/server"
import { requireOperationalAuth } from "@/lib/apiAuth"
import { processFreshnessValidation }
  from "@/lib/news/processFreshnessValidation"

export async function GET(req: NextRequest) {
  const unauthorized = requireOperationalAuth(req)
  if (unauthorized) return unauthorized

  const result = await processFreshnessValidation()

  return NextResponse.json({
    success: true,
    result
  })
}
