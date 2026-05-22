import { NextResponse, type NextRequest } from "next/server"
import { requireOperationalAuth } from "@/lib/apiAuth"

import {
  testSingleRss
} from "@/lib/news/testSingleRss"

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const unauthorized = requireOperationalAuth(req)
  if (unauthorized) return unauthorized

  const result = await testSingleRss()

  return NextResponse.json(result)
}
