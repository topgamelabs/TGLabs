import { NextResponse } from "next/server"

import {
  collectRssNews
} from "@/lib/news/collectRssNews"

export async function GET() {

  await collectRssNews()

  return NextResponse.json({
    success: true
  })
}