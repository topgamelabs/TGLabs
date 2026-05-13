import { NextResponse } from "next/server"
import { collectNewsLinks } from "@/lib/news/collectRssNews"
import { processFetchQueue } from "@/lib/news/processFetchQueue"
import { processFreshnessValidation } from "@/lib/news/processFreshnessValidation"

export const runtime = "nodejs"

export async function GET() {
  try {
    const collection = await collectNewsLinks()
    await processFreshnessValidation()
    await processFetchQueue()

    return NextResponse.json({
      success: true,
      stage: "ingestion",
      collection,
      aiWriter: "disabled",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "CRON_FAILED"

    console.error("INGESTION CRON ERROR:", message)

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    )
  }
}
