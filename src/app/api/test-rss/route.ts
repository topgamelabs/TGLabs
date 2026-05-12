import { NextResponse } from "next/server"

import { supabase }
from "@/lib/supabase"

export async function GET() {

  const result = await supabase
    .from("news_sources")
    .select("*")

  return NextResponse.json(result)
}