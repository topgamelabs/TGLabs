import { NextResponse, type NextRequest } from "next/server"
import { requireOperationalAuth } from "@/lib/apiAuth"
import { collectNewsLinks } from "@/lib/news/collectRssNews"
import { getEditorialHealthReport } from "@/lib/news/editorialHealthReport"
import { cleanupRejectedPendingRewriteQueue } from "@/lib/news/openClawCandidates"
import { processFetchQueue } from "@/lib/news/processFetchQueue"
import { processFreshnessValidation } from "@/lib/news/processFreshnessValidation"
import { rewriteOpenClawCandidates } from "@/lib/news/rewriteCandidates"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export const runtime = "nodejs"
export const maxDuration = 300

const queueActions = ["rewrite", "retry", "approve", "skip", "delete"] as const

type QueueAction = (typeof queueActions)[number]

type BatchItem = {
  id: string
  action: QueueAction
}

type TranslationPreviewItem = {
  id: string
  title: string
  excerpt: string
}

type StageStatus = "success" | "partial" | "failed" | "skipped"

function stage(status: StageStatus, message: string) {
  return { status, message }
}

function normalizeLimit(value: string | null) {
  const limit = Number(value)
  if (!Number.isFinite(limit)) return 50
  return Math.min(Math.max(Math.floor(limit), 1), 100)
}

async function loadQueue(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const limit = normalizeLimit(searchParams.get("limit"))
  const status = searchParams.get("status")
  const source = searchParams.get("source")
  const queryText = searchParams.get("q")

  let query = supabaseAdmin
    .from("raw_news_queue")
    .select(
      "id,source_url,source_domain,raw_title,raw_excerpt,published_source_at,discovered_at,fetch_status,freshness_status,freshness_reason,extraction_status,rewrite_status,rewrite_error,rewrite_attempts,rewrite_started_at,rewrite_finished_at,rewritten_article_id"
    )
    .order("discovered_at", { ascending: false })
    .limit(limit)

  if (status === "eligible") {
    query = query
      .eq("fetch_status", "success")
      .eq("freshness_status", "accepted")
      .eq("extraction_status", "pending")
      .eq("rewrite_status", "pending")
      .not("raw_content", "is", null)
  } else if (status === "approved") {
    query = query
      .eq("freshness_status", "accepted")
      .eq("freshness_reason", "manual_admin_approved")
      .eq("extraction_status", "pending")
      .eq("rewrite_status", "pending")
  } else if (status && status !== "all") {
    query = query.eq("rewrite_status", status)
  }

  if (source && source !== "all") {
    query = query.eq("source_domain", source)
  }

  if (queryText) {
    query = query.or(
      `raw_title.ilike.%${queryText}%,source_url.ilike.%${queryText}%`
    )
  }

  const { data, error } = await query
  if (error) {
    throw new Error(`LOAD_QUEUE_FAILED: ${error.message}`)
  }

  const rows = data || []
  const articleIds = Array.from(
    new Set(
      rows
        .map((row) => row.rewritten_article_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  )

  if (articleIds.length === 0) {
    return rows
  }

  const { data: articles, error: articleError } = await supabaseAdmin
    .from("articles")
    .select("id,title,slug,status,is_published,updated_at,published_at")
    .in("id", articleIds)

  if (articleError) {
    throw new Error(`LOAD_QUEUE_ARTICLES_FAILED: ${articleError.message}`)
  }

  const articleById = new Map((articles || []).map((article) => [article.id, article]))

  return rows.map((row) => ({
    ...row,
    rewritten_article: row.rewritten_article_id
      ? articleById.get(row.rewritten_article_id) || null
      : null,
  }))
}

async function loadArticles(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const limit = normalizeLimit(
    searchParams.get("articleLimit") || searchParams.get("limit")
  )

  const { data, error } = await supabaseAdmin
    .from("articles")
    .select(
      "id,title,slug,excerpt,category,hero_image,status,is_published,ai_generated,source_url,seo_title,seo_description,published_at,created_at,updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`LOAD_ARTICLES_FAILED: ${error.message}`)
  }

  return data || []
}

async function loadSources() {
  const { data, error } = await supabaseAdmin
    .from("news_sources")
    .select("domain")
    .not("domain", "is", null)
    .order("domain", { ascending: true })

  if (error) {
    throw new Error(`LOAD_SOURCES_FAILED: ${error.message}`)
  }

  return Array.from(
    new Set((data || []).map((row) => row.domain).filter(Boolean))
  ).sort()
}

async function countReadyToRewrite() {
  const { count, error } = await supabaseAdmin
    .from("raw_news_queue")
    .select("id", { count: "exact", head: true })
    .eq("fetch_status", "success")
    .eq("freshness_status", "accepted")
    .eq("extraction_status", "pending")
    .eq("rewrite_status", "pending")
    .not("raw_content", "is", null)

  if (error) {
    throw new Error(`COUNT_READY_REWRITE_FAILED: ${error.message}`)
  }

  return count || 0
}

async function runFetchAndFilter() {
  const readyBefore = await countReadyToRewrite()
  const stages = {
    discover: stage("skipped", "Discover not started"),
    fetch: stage("skipped", "Fetch not started"),
    freshness: stage("skipped", "Freshness not started"),
  }
  let collection: Awaited<ReturnType<typeof collectNewsLinks>> | null = null
  let freshness: Awaited<ReturnType<typeof processFreshnessValidation>> | null =
    null
  const fetchRounds = []
  const fetchDeadlineMs = Date.now() + 110000
  const maxFetchItems = 24
  const fetchBatchSize = 8
  let fetchProcessed = 0

  try {
    collection = await collectNewsLinks()
    stages.discover = collection.success
      ? stage("success", `Queued ${collection.queued} new links`)
      : stage("failed", "Source discovery failed")
  } catch (error) {
    const message = error instanceof Error ? error.message : "DISCOVER_FAILED"
    stages.discover = stage("failed", message)
  }

  try {
    for (let round = 0; round < 3; round++) {
      if (Date.now() >= fetchDeadlineMs || fetchProcessed >= maxFetchItems) {
        break
      }

      const remaining = maxFetchItems - fetchProcessed
      const fetchQueue = await processFetchQueue({
        limit: Math.min(fetchBatchSize, remaining),
        deadlineMs: fetchDeadlineMs,
      })
      fetchRounds.push(fetchQueue)
      fetchProcessed += fetchQueue.processed

      if (fetchQueue.processed === 0 || fetchQueue.stoppedReason) {
        break
      }
    }

    const stoppedReason = fetchRounds.find((round) => round.stoppedReason)
      ?.stoppedReason
    const status: StageStatus = stoppedReason
      ? "partial"
      : fetchProcessed >= maxFetchItems
        ? "partial"
        : "success"
    const message = stoppedReason
      ? stoppedReason
      : fetchProcessed >= maxFetchItems
        ? `Fetched batch limit reached (${maxFetchItems})`
        : `Processed ${fetchProcessed} queued links`

    stages.fetch = stage(status, message)
  } catch (error) {
    const message = error instanceof Error ? error.message : "FETCH_STAGE_FAILED"
    stages.fetch = stage("failed", message)
  }

  try {
    freshness = await processFreshnessValidation()
    stages.freshness = stage(
      "success",
      `Processed ${freshness.processed} pending freshness rows`
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "FRESHNESS_FAILED"
    stages.freshness = stage("failed", message)
  }

  const readyAfter = await countReadyToRewrite()
  const fetchQueue = fetchRounds.reduce(
    (total, round) => ({
      processed: total.processed + round.processed,
      fetched: total.fetched + round.fetched,
      rejectedDuplicate: total.rejectedDuplicate + round.rejectedDuplicate,
      failed: total.failed + round.failed,
      stoppedReason: total.stoppedReason || round.stoppedReason,
    }),
    {
      processed: 0,
      fetched: 0,
      rejectedDuplicate: 0,
      failed: 0,
      stoppedReason: null as string | null,
    }
  )

  if (fetchQueue.failed > 0 && stages.fetch.status === "success") {
    stages.fetch = stage(
      "partial",
      `Processed ${fetchQueue.processed} links with ${fetchQueue.failed} fetch failures`
    )
  }

  return {
    stages,
    collection:
      collection || {
        success: false,
        sources: 0,
        sourcesChecked: 0,
        skippedSources: [],
        queued: 0,
        skippedOld: 0,
        skippedIrrelevant: 0,
        failed: 0,
      },
    fetchRounds,
    fetchQueue,
    freshness:
      freshness || {
        processed: 0,
        accepted: 0,
        rejected: 0,
        pendingDateExtraction: 0,
        cleanedStaleUnfiltered: 0,
      },
    readyBefore,
    readyAfter,
    readyAdded: Math.max(readyAfter - readyBefore, 0),
  }
}

function parseTranslationPreviewItem(item: unknown): TranslationPreviewItem {
  if (!item || typeof item !== "object") {
    return { id: "", title: "", excerpt: "" }
  }

  const record = item as Record<string, unknown>

  return {
    id: typeof record.id === "string" ? record.id : "",
    title: typeof record.title === "string" ? record.title : "",
    excerpt: typeof record.excerpt === "string" ? record.excerpt : "",
  }
}

function buildTranslationPrompt(item: TranslationPreviewItem) {
  return `
Translate this gaming news preview into natural Thai for an admin newsroom.

Return valid JSON only, no markdown fences:
{
  "title": "Thai title",
  "excerpt": "Thai excerpt"
}

Rules:
- Translate only. Do not add facts, opinions, dates, platforms, or details that are not present.
- Keep game names, company names, character names, and official English titles in English unless there is a widely known Thai name.
- Use concise Thai that helps an editor decide whether the news is worth rewriting.
- If excerpt is empty, return an empty excerpt.

Title:
${item.title}

Excerpt:
${item.excerpt}
`.trim()
}

function parseJsonObject(text: string) {
  const trimmed = text.replace(/```json|```/g, "").trim()
  const start = trimmed.indexOf("{")
  const end = trimmed.lastIndexOf("}")

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("OLLAMA_JSON_NOT_FOUND")
  }

  return JSON.parse(trimmed.slice(start, end + 1))
}

async function translatePreviewItem(item: TranslationPreviewItem) {
  const endpoint =
    process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"
  const model = process.env.OLLAMA_TRANSLATION_MODEL || "gemma2:2b"
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(`${endpoint}/api/generate`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        stream: false,
        prompt: buildTranslationPrompt(item),
        options: {
          temperature: 0.1,
          num_predict: 300,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`OLLAMA_HTTP_${response.status}: ${await response.text()}`)
    }

    const data = await response.json()
    const parsed = parseJsonObject(String(data.response || ""))

    return {
      id: item.id,
      model,
      status: "translated",
      title:
        typeof parsed.title === "string" && parsed.title.trim()
          ? parsed.title.trim()
          : item.title,
      excerpt:
        typeof parsed.excerpt === "string" ? parsed.excerpt.trim() : item.excerpt,
    }
  } catch (error) {
    return {
      id: item.id,
      model,
      status: "fallback",
      title: item.title,
      excerpt: item.excerpt,
      error: error instanceof Error ? error.message : "OLLAMA_TRANSLATION_FAILED",
    }
  } finally {
    clearTimeout(timeout)
  }
}

async function runTranslationPreview(items: TranslationPreviewItem[]) {
  const limitedItems = items
    .filter((item) => item.id && (item.title || item.excerpt))
    .slice(0, 25)

  const translations = []

  for (const item of limitedItems) {
    translations.push(await translatePreviewItem(item))
  }

  return {
    total: limitedItems.length,
    translated: translations.filter((item) => item.status === "translated").length,
    fallback: translations.filter((item) => item.status !== "translated").length,
    translations,
  }
}

function isQueueAction(value: unknown): value is QueueAction {
  return typeof value === "string" && queueActions.includes(value as QueueAction)
}

function parseBatchItem(item: unknown) {
  if (!item || typeof item !== "object") {
    return { id: "", action: undefined }
  }

  const record = item as Record<string, unknown>

  return {
    id: typeof record.id === "string" ? record.id : "",
    action: record.action,
  }
}

async function runQueueAction(action: QueueAction, id: string, reason?: string) {
  if (action === "rewrite") {
    const result = await rewriteOpenClawCandidates({
      queueId: id,
      limit: 1,
      publish: false,
      maxAttempts: 3,
      manual: true,
    })

    return { action, result }
  }

  if (action === "retry") {
    const { error } = await supabaseAdmin
      .from("raw_news_queue")
      .update({
        extraction_status: "pending",
        rewrite_status: "pending",
        rewrite_attempts: 0,
        rewrite_error: null,
        rewrite_started_at: null,
        rewrite_finished_at: null,
        rewritten_article_id: null,
      })
      .eq("id", id)

    if (error) {
      throw new Error(`RETRY_QUEUE_FAILED: ${error.message}`)
    }

    return { action }
  }

  if (action === "approve") {
    const { error } = await supabaseAdmin
      .from("raw_news_queue")
      .update({
        freshness_status: "accepted",
        freshness_reason: "manual_admin_approved",
        extraction_status: "pending",
        rewrite_status: "pending",
        rewrite_attempts: 0,
        rewrite_error: null,
        rewrite_started_at: null,
        rewrite_finished_at: null,
        rewritten_article_id: null,
      })
      .eq("id", id)

    if (error) {
      throw new Error(`APPROVE_QUEUE_FAILED: ${error.message}`)
    }

    return { action }
  }

  if (action === "skip") {
    const { error } = await supabaseAdmin
      .from("raw_news_queue")
      .update({
        extraction_status: "skipped",
        rewrite_status: "skipped",
        rewrite_error: reason || "manual_admin_skip",
        rewrite_finished_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      throw new Error(`SKIP_QUEUE_FAILED: ${error.message}`)
    }

    return { action }
  }

  const { error } = await supabaseAdmin.from("raw_news_queue").delete().eq("id", id)

  if (error) {
    throw new Error(`DELETE_QUEUE_FAILED: ${error.message}`)
  }

  return { action }
}

async function loadApprovedRewriteIds(limit = 5) {
  const { data, error } = await supabaseAdmin
    .from("raw_news_queue")
    .select("id")
    .eq("freshness_status", "accepted")
    .eq("freshness_reason", "manual_admin_approved")
    .eq("extraction_status", "pending")
    .eq("rewrite_status", "pending")
    .not("raw_content", "is", null)
    .order("discovered_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`LOAD_APPROVED_REWRITE_IDS_FAILED: ${error.message}`)
  }

  return (data || []).map((row) => row.id as string).filter(Boolean)
}

async function runRewriteApproved() {
  const ids = await loadApprovedRewriteIds(5)
  const results = []

  for (const id of ids) {
    try {
      const output = await runQueueAction("rewrite", id)
      const success = didQueueActionCreateExpectedOutput(output)

      results.push({
        id,
        success,
        warning: success ? undefined : "REWRITE_COMPLETED_WITHOUT_ARTICLE",
        output,
      })
    } catch (error) {
      results.push({
        id,
        success: false,
        error:
          error instanceof Error ? error.message : "REWRITE_APPROVED_ITEM_FAILED",
      })
    }
  }

  return {
    total: ids.length,
    success: results.filter((item) => item.success).length,
    failed: results.filter((item) => !item.success).length,
    results,
  }
}

function didQueueActionCreateExpectedOutput(output: Awaited<ReturnType<typeof runQueueAction>>) {
  if (output.action !== "rewrite") return true
  return Boolean(output.result.articles.length > 0)
}

export async function GET(req: NextRequest) {
  const unauthorized = requireOperationalAuth(req)
  if (unauthorized) return unauthorized

  try {
    const [health, queue, articles, sources] = await Promise.all([
      getEditorialHealthReport(),
      loadQueue(req),
      loadArticles(req),
      loadSources(),
    ])

    return NextResponse.json({
      success: true,
      health,
      queue,
      articles,
      sources,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "NEWSROOM_FAILED"

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = requireOperationalAuth(req)
  if (unauthorized) return unauthorized

  try {
    const body = await req.json().catch(() => ({}))
    const action = body.action
    const id = typeof body.id === "string" ? body.id : ""

    if (action === "cleanup_rejected") {
      const cleaned = await cleanupRejectedPendingRewriteQueue()
      return NextResponse.json({ success: true, action, cleaned })
    }

    if (action === "fetch_filter") {
      const result = await runFetchAndFilter()
      return NextResponse.json({ success: true, action, result })
    }

    if (action === "translate_preview") {
      const rawItems: unknown[] = Array.isArray(body.items) ? body.items : []
      const result = await runTranslationPreview(
        rawItems.map(parseTranslationPreviewItem)
      )

      return NextResponse.json({ success: true, action, result })
    }

    if (action === "rewrite_approved") {
      const result = await runRewriteApproved()
      return NextResponse.json({ success: true, action, result })
    }

    if (action === "batch") {
      const rawItems: unknown[] = Array.isArray(body.items) ? body.items : []
      const items: BatchItem[] = rawItems
        .map(parseBatchItem)
        .filter((item) => item.id && isQueueAction(item.action))
        .map((item) => ({ id: item.id, action: item.action as QueueAction }))
        .slice(0, 25)

      if (items.length === 0) {
        return NextResponse.json(
          { success: false, error: "BATCH_ITEMS_EMPTY" },
          { status: 400 }
        )
      }

      const results = []

      for (const item of items) {
        try {
          const output = await runQueueAction(item.action, item.id)
          const actionSucceeded = didQueueActionCreateExpectedOutput(output)

          results.push({
            id: item.id,
            action: item.action,
            success: actionSucceeded,
            warning: actionSucceeded
              ? undefined
              : "REWRITE_COMPLETED_WITHOUT_ARTICLE",
            output,
          })
        } catch (error) {
          results.push({
            id: item.id,
            action: item.action,
            success: false,
            error:
              error instanceof Error ? error.message : "NEWSROOM_BATCH_ITEM_FAILED",
          })
        }
      }

      return NextResponse.json({
        success: true,
        action,
        results,
        summary: {
          total: results.length,
          success: results.filter((item) => item.success).length,
          failed: results.filter((item) => !item.success).length,
        },
      })
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "MISSING_ID" },
        { status: 400 }
      )
    }

    if (isQueueAction(action)) {
      const output = await runQueueAction(
        action,
        id,
        typeof body.reason === "string" ? body.reason : undefined
      )
      return NextResponse.json({ success: true, ...output })
    }

    return NextResponse.json(
      { success: false, error: "UNKNOWN_ACTION" },
      { status: 400 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "NEWSROOM_ACTION_FAILED"

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
