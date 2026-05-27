import { supabaseAdmin } from "@/lib/supabaseAdmin"

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "brings",
  "bringing",
  "for",
  "from",
  "in",
  "is",
  "new",
  "of",
  "on",
  "the",
  "to",
  "update",
  "version",
  "with",
])

export interface DuplicateCheckInput {
  id: string
  raw_title: string | null
  raw_excerpt?: string | null
  source_url: string | null
  source_domain?: string | null
  published_source_at?: string | null
  discovered_at?: string | null
}

export interface PossibleDuplicateCandidate extends DuplicateCheckInput {
  raw_content?: string | null
  similarity: number
  reason: string
}

function normalizeText(value: string | null | undefined) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[`']/g, "'")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function titleTokens(value: string | null | undefined) {
  return normalizeText(value)
    .split(" ")
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word))
}

function tokenSet(value: string | null | undefined) {
  return new Set(titleTokens(value))
}

function jaccard(a: Set<string>, b: Set<string>) {
  if (a.size === 0 || b.size === 0) return 0

  let intersection = 0
  for (const item of a) {
    if (b.has(item)) intersection++
  }

  return intersection / (a.size + b.size - intersection)
}

function getHost(value: string | null | undefined) {
  if (!value) return ""

  try {
    return new URL(value).hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}

function sharedImportantTokens(a: Set<string>, b: Set<string>) {
  return [...a].filter((token) => b.has(token) && /[a-z]/.test(token))
}

export function getDuplicateSimilarity(
  primary: DuplicateCheckInput,
  candidate: DuplicateCheckInput
) {
  if (primary.id === candidate.id) {
    return { duplicate: false, similarity: 0, reason: "same_row" }
  }

  const primaryUrl = String(primary.source_url || "").replace(/[?#].*$/, "")
  const candidateUrl = String(candidate.source_url || "").replace(/[?#].*$/, "")
  if (primaryUrl && candidateUrl && primaryUrl === candidateUrl) {
    return { duplicate: true, similarity: 1, reason: "same_source_url" }
  }

  const primaryTokens = tokenSet(primary.raw_title)
  const candidateTokens = tokenSet(candidate.raw_title)
  const similarity = jaccard(primaryTokens, candidateTokens)
  const shared = sharedImportantTokens(primaryTokens, candidateTokens)
  const differentHost =
    getHost(primary.source_url) &&
    getHost(candidate.source_url) &&
    getHost(primary.source_url) !== getHost(candidate.source_url)

  const hasVersionDateSignal =
    shared.some((token) => /^\d+$/.test(token)) ||
    shared.some((token) => /june|july|august|may|launch|collaboration|pre|registration|shutdown/.test(token))

  const duplicate =
    similarity >= 0.5 ||
    (differentHost && similarity >= 0.35 && shared.length >= 4 && hasVersionDateSignal)

  return {
    duplicate,
    similarity,
    reason: duplicate
      ? `title_similarity:${similarity.toFixed(2)}:${shared.slice(0, 8).join("|")}`
      : `not_similar:${similarity.toFixed(2)}`,
  }
}

export function annotatePossibleDuplicates<T extends DuplicateCheckInput>(
  rows: T[]
) {
  return rows.map((row) => {
    const duplicates = rows
      .filter((candidate) => candidate.id !== row.id)
      .map((candidate) => ({
        ...candidate,
        ...getDuplicateSimilarity(row, candidate),
      }))
      .filter((candidate) => candidate.duplicate)
      .sort((a, b) => b.similarity - a.similarity)

    return {
      ...row,
      possible_duplicates: duplicates.map((candidate) => ({
        id: candidate.id,
        raw_title: candidate.raw_title,
        source_domain: candidate.source_domain,
        source_url: candidate.source_url,
        similarity: candidate.similarity,
        reason: candidate.reason,
      })),
    }
  })
}

export async function annotateRowsWithPossibleDuplicates<
  T extends DuplicateCheckInput,
>(rows: T[], options: { poolLimit?: number } = {}) {
  if (rows.length === 0) return rows

  const safeLimit = Math.min(Math.max(Math.floor(options.poolLimit || 200), 1), 500)
  const { data, error } = await supabaseAdmin
    .from("raw_news_queue")
    .select(
      "id,raw_title,raw_excerpt,source_domain,source_url,published_source_at,discovered_at"
    )
    .eq("fetch_status", "success")
    .eq("freshness_status", "accepted")
    .eq("extraction_status", "pending")
    .eq("rewrite_status", "pending")
    .not("raw_content", "is", null)
    .order("discovered_at", { ascending: false })
    .limit(safeLimit)

  if (error) {
    throw new Error(`ANNOTATE_POSSIBLE_DUPLICATES_FAILED: ${error.message}`)
  }

  const poolById = new Map<string, DuplicateCheckInput>()
  for (const row of rows) {
    poolById.set(row.id, row)
  }
  for (const candidate of (data || []) as unknown as DuplicateCheckInput[]) {
    poolById.set(candidate.id, candidate)
  }

  const pool = Array.from(poolById.values())

  return rows.map((row) => {
    const duplicates = pool
      .filter((candidate) => candidate.id !== row.id)
      .map((candidate) => ({
        ...candidate,
        ...getDuplicateSimilarity(row, candidate),
      }))
      .filter((candidate) => candidate.duplicate)
      .sort((a, b) => b.similarity - a.similarity)

    return {
      ...row,
      possible_duplicates: duplicates.map((candidate) => ({
        id: candidate.id,
        raw_title: candidate.raw_title,
        source_domain: candidate.source_domain,
        source_url: candidate.source_url,
        similarity: candidate.similarity,
        reason: candidate.reason,
      })),
    }
  })
}

export async function findPossibleDuplicateCandidates(
  primary: DuplicateCheckInput,
  options: { limit?: number; includeRawContent?: boolean } = {}
) {
  const safeLimit = Math.min(Math.max(Math.floor(options.limit || 4), 1), 8)
  const selectFields = options.includeRawContent
    ? "id,raw_title,raw_excerpt,source_domain,source_url,published_source_at,discovered_at,raw_content"
    : "id,raw_title,raw_excerpt,source_domain,source_url,published_source_at,discovered_at"

  const { data, error } = await supabaseAdmin
    .from("raw_news_queue")
    .select(selectFields)
    .eq("fetch_status", "success")
    .eq("freshness_status", "accepted")
    .eq("extraction_status", "pending")
    .eq("rewrite_status", "pending")
    .not("raw_content", "is", null)
    .neq("id", primary.id)
    .order("discovered_at", { ascending: false })
    .limit(200)

  if (error) {
    throw new Error(`FIND_POSSIBLE_DUPLICATES_FAILED: ${error.message}`)
  }

  return ((data || []) as unknown as PossibleDuplicateCandidate[])
    .map((candidate) => ({
      ...candidate,
      ...getDuplicateSimilarity(primary, candidate),
    }))
    .filter((candidate) => candidate.duplicate)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, safeLimit)
}
