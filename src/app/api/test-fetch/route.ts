import { NextResponse } from "next/server"

import {
  processFetchQueue
} from "@/lib/news/processFetchQueue"

export async function GET() {

  await processFetchQueue()

  return NextResponse.json({
    success: true
  })
}