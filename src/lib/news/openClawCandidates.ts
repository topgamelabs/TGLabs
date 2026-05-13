import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { validateSourceQuality } from "./sourceQuality"

const MIN_RAW_CONTENT_LENGTH = 800
const DEFAULT_LIMIT = 10

export interface OpenClawCandidate {
  id: string
  source_url: string
  source_domain: string | null
  raw_title: string | null
  raw_excerpt: string | null
  published_source_at: string
  raw_content: string
  content_hash: string | null
}

interface RawCandidateRow extends OpenClawCandidate {
  source_id: string | null
  raw_content: string
}

export async function getOpenClawCandidates(limit = DEFAULT_LIMIT) {
  const requestedLimit = Number.isFinite(limit) ? limit : DEFAULT_LIMIT
  const safeLimit = Math.min(Math.max(requestedLimit, 1), 25)

  const { data, error } = await supabaseAdmin
    .from("raw_news_queue")
    .select(
      "id,source_id,source_url,source_domain,raw_title,raw_excerpt,published_source_at,raw_content,content_hash"
    )
    .eq("fetch_status", "success")
    .eq("freshness_status", "accepted")
    .eq("extraction_status", "pending")
    .eq("rewrite_status", "pending")
    .not("raw_content", "is", null)
    .not("published_source_at", "is", null)
    .order("published_source_at", { ascending: false })
    .limit(safeLimit * 3)

  if (error || !data) {
    console.error("[OpenClaw] Candidate query failed", error?.message)
    return []
  }

  const rows = (data as RawCandidateRow[]).filter(
    (row) => row.raw_content && row.raw_content.length >= MIN_RAW_CONTENT_LENGTH
  )

  const sourceIds = Array.from(
    new Set(rows.map((row) => row.source_id).filter(Boolean))
  ) as string[]

  const sourcesById = new Map<string, Record<string, unknown>>()

  if (sourceIds.length > 0) {
    const { data: sources, error: sourceError } = await supabaseAdmin
      .from("news_sources")
      .select("*")
      .in("id", sourceIds)

    if (sourceError) {
      console.error("[OpenClaw] Source quality query failed", sourceError.message)
      return []
    }

    for (const source of (sources || []) as Record<string, unknown>[]) {
      if (typeof source.id === "string") {
        sourcesById.set(source.id, source)
      }
    }
  }

  const candidates: OpenClawCandidate[] = []

  for (const row of rows) {
    if (row.source_id) {
      const source = sourcesById.get(row.source_id)
      if (!source) continue

      const quality = validateSourceQuality(source)
      if (!quality.allowed) {
        console.log(
          `[OpenClaw] Candidate skipped ${row.source_url}: ${quality.reason}`
        )
        continue
      }
    }

    candidates.push({
      id: row.id,
      source_url: row.source_url,
      source_domain: row.source_domain,
      raw_title: row.raw_title,
      raw_excerpt: row.raw_excerpt,
      published_source_at: row.published_source_at,
      raw_content: row.raw_content,
      content_hash: row.content_hash,
    })

    if (candidates.length >= safeLimit) break
  }

  return candidates
}
