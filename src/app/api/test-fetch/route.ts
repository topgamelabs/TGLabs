import { NextResponse, type NextRequest } from "next/server"
import { requireOperationalAuth } from "@/lib/apiAuth"

import {
  processFetchQueue
} from "@/lib/news/processFetchQueue"

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const unauthorized = requireOperationalAuth(req)
  if (unauthorized) return unauthorized

  const result = await processFetchQueue()

  return NextResponse.json({
    success: true,
    result
  })
}
