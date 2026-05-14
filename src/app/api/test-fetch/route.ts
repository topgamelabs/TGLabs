import { NextResponse } from "next/server"

import {
  processFetchQueue
} from "@/lib/news/processFetchQueue"

export const dynamic = 'force-dynamic'

export async function GET() {

  await processFetchQueue()

  return NextResponse.json({
    success: true
  })
}