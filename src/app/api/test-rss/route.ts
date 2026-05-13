import { NextResponse } from "next/server"

import {
  testSingleRss
} from "@/lib/news/testSingleRss"

export async function GET() {

  const result = await testSingleRss()

  return NextResponse.json(result)
}
