import { NextResponse } from "next/server"
import { processFreshnessValidation }
  from "@/lib/news/processFreshnessValidation"

export async function GET() {
  const result = await processFreshnessValidation()

  return NextResponse.json({
    success: true,
    result
  })
}
