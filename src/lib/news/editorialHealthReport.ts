import { supabaseAdmin } from "@/lib/supabaseAdmin"

async function countQueueByStatus(status: string) {
  const { count, error } = await supabaseAdmin
    .from("raw_news_queue")
    .select("id", { count: "exact", head: true })
    .eq("rewrite_status", status)

  if (error) {
    throw new Error(`COUNT_${status.toUpperCase()}_FAILED: ${error.message}`)
  }

  return count || 0
}

export async function getEditorialHealthReport() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const statuses = ["pending", "processing", "success", "failed", "duplicate", "skipped"]
  const rewriteQueue: Record<string, number> = {}

  for (const status of statuses) {
    rewriteQueue[status] = await countQueueByStatus(status)
  }

  const { count: eligiblePending, error: eligibleError } = await supabaseAdmin
    .from("raw_news_queue")
    .select("id", { count: "exact", head: true })
    .eq("fetch_status", "success")
    .eq("freshness_status", "accepted")
    .eq("extraction_status", "pending")
    .eq("rewrite_status", "pending")
    .not("raw_content", "is", null)

  if (eligibleError) {
    throw new Error(`COUNT_ELIGIBLE_PENDING_FAILED: ${eligibleError.message}`)
  }

  const { count: rejectedPending, error: rejectedPendingError } =
    await supabaseAdmin
      .from("raw_news_queue")
      .select("id", { count: "exact", head: true })
      .eq("freshness_status", "rejected")
      .eq("extraction_status", "pending")
      .eq("rewrite_status", "pending")

  if (rejectedPendingError) {
    throw new Error(
      `COUNT_REJECTED_PENDING_FAILED: ${rejectedPendingError.message}`
    )
  }

  const { count: published24h, error: publishedError } = await supabaseAdmin
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("ai_generated", true)
    .gte("published_at", since)

  if (publishedError) {
    throw new Error(`COUNT_PUBLISHED_24H_FAILED: ${publishedError.message}`)
  }

  const { data: failures, error: failuresError } = await supabaseAdmin
    .from("raw_news_queue")
    .select("rewrite_error,source_domain")
    .not("rewrite_error", "is", null)
    .order("rewrite_finished_at", { ascending: false })
    .limit(100)

  if (failuresError) {
    throw new Error(`LOAD_FAILURE_REASONS_FAILED: ${failuresError.message}`)
  }

  const failureReasons = new Map<string, number>()
  const sourcePerformance = new Map<string, { failed: number; skipped: number }>()

  for (const row of (failures || []) as Array<{
    rewrite_error: string | null
    source_domain: string | null
  }>) {
    const reason = (row.rewrite_error || "unknown").split(":")[0].slice(0, 80)
    failureReasons.set(reason, (failureReasons.get(reason) || 0) + 1)

    const source = row.source_domain || "unknown"
    const current = sourcePerformance.get(source) || { failed: 0, skipped: 0 }
    if (reason.includes("CLASSIFIED_REJECT") || reason.includes("not_")) {
      current.skipped++
    } else {
      current.failed++
    }
    sourcePerformance.set(source, current)
  }

  const success = rewriteQueue.success || 0
  const failed = rewriteQueue.failed || 0
  const skipped = rewriteQueue.skipped || 0
  const totalTerminal = success + failed + skipped + (rewriteQueue.duplicate || 0)

  return {
    generatedAt: new Date().toISOString(),
    rewriteQueue: {
      ...rewriteQueue,
      eligiblePending: eligiblePending || 0,
      rejectedPending: rejectedPending || 0,
    },
    published24h: published24h || 0,
    publishRate: totalTerminal > 0 ? Number((success / totalTerminal).toFixed(3)) : 0,
    topFailureReasons: Array.from(failureReasons.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([reason, count]) => ({ reason, count })),
    sourcePerformance: Array.from(sourcePerformance.entries())
      .sort((a, b) => b[1].failed + b[1].skipped - (a[1].failed + a[1].skipped))
      .slice(0, 10)
      .map(([source, metrics]) => ({ source, ...metrics })),
  }
}
