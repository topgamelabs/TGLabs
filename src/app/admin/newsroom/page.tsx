"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { AdminShell } from "@/components/admin/AdminShell"

type QueueRow = {
  id: string
  source_url: string | null
  source_domain: string | null
  raw_title: string | null
  raw_excerpt: string | null
  published_source_at: string | null
  discovered_at: string | null
  fetch_status: string | null
  freshness_status: string | null
  freshness_reason: string | null
  extraction_status: string | null
  rewrite_status: string | null
  rewrite_error: string | null
  rewrite_attempts: number | null
  rewrite_finished_at: string | null
  rewritten_article_id: string | null
  rewritten_article?: {
    id: string
    title: string | null
    slug: string | null
    status: string | null
    is_published: boolean | null
    updated_at: string | null
    published_at: string | null
  } | null
}

type ArticleRow = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  category: string | null
  status: string | null
  is_published: boolean
  source_url: string | null
  published_at: string | null
  updated_at: string | null
}

type HealthReport = {
  rewriteQueue: Record<string, number>
  published24h: number
  publishRate: number
  topFailureReasons: Array<{ reason: string; count: number }>
  sourcePerformance: Array<{ source: string; failed: number; skipped: number }>
}

type NewsroomData = {
  health: HealthReport
  queue: QueueRow[]
  articles: ArticleRow[]
  sources: string[]
}

type RewriteResult = {
  processed?: number
  skippedClaimed?: number
  articles?: Array<{
    queueId?: string
    articleId?: string
    slug?: string
    title: string
    status?: string
    isPublished?: boolean
  }>
  failures?: Array<{ reason: string }>
  duplicates?: Array<{ reason: string }>
}

type BatchAction = "none" | "rewrite" | "retry" | "approve" | "skip" | "delete"

type BatchResult = {
  id: string
  action: Exclude<BatchAction, "none">
  success: boolean
  warning?: string
  error?: string
  output?: {
    result?: RewriteResult
  }
}

type FetchFilterResult = {
  collection?: {
    sources?: number
    queued?: number
    skippedOld?: number
    skippedIrrelevant?: number
    failed?: number
  }
  fetchQueue?: {
    processed?: number
    fetched?: number
    rejectedDuplicate?: number
    failed?: number
  }
  freshness?: {
    processed?: number
    accepted?: number
    rejected?: number
    pendingDateExtraction?: number
    cleanedStaleUnfiltered?: number
  }
  readyBefore?: number
  readyAfter?: number
  readyAdded?: number
}

type TranslationPreview = {
  title: string
  excerpt: string
  status: "translated" | "fallback"
  model: string
  error?: string
}

type TranslationPreviewResult = {
  total?: number
  translated?: number
  fallback?: number
  translations?: Array<TranslationPreview & { id: string }>
}

const statusOptions = [
  "all",
  "eligible",
  "pending",
  "processing",
  "success",
  "failed",
  "duplicate",
  "skipped",
]

const statusLabels: Record<string, string> = {
  all: "all",
  eligible: "Ready to Rewrite",
  pending: "pending",
  processing: "processing",
  success: "success",
  failed: "failed",
  duplicate: "duplicate",
  skipped: "skipped",
}

const typeOptions = [
  "all",
  "mobile",
  "pc-console",
  "gaming",
  "gacha",
  "mmorpg",
  "rewards",
  "pre-registration",
  "shutdown",
  "collaboration",
]

const batchActionOptions: Array<{ value: BatchAction; label: string }> = [
  { value: "none", label: "Do nothing" },
  { value: "rewrite", label: "Rewrite as draft" },
  { value: "approve", label: "Approve" },
  { value: "retry", label: "Retry" },
  { value: "skip", label: "Skip" },
  { value: "delete", label: "Delete" },
]

function formatDate(value: string | null | undefined) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

function statusClass(status: string | null | undefined) {
  switch (status) {
    case "success":
      return "border-[#4DCC8A]/30 bg-[#4DCC8A]/10 text-[#4DCC8A]"
    case "failed":
      return "border-[#FF6B35]/30 bg-[#FF6B35]/10 text-[#FF9A74]"
    case "skipped":
      return "border-white/10 bg-white/[0.04] text-white/50"
    case "processing":
      return "border-[#4A90D9]/30 bg-[#4A90D9]/10 text-[#7EB8F0]"
    case "duplicate":
      return "border-[#A855F7]/30 bg-[#A855F7]/10 text-[#C084FC]"
    default:
      return "border-[#FF1A1A]/25 bg-[#FF1A1A]/10 text-[#FF6B6B]"
  }
}

function getRewriteResultMessage(result: RewriteResult | undefined) {
  const article = result?.articles?.[0]
  if (article) {
    const status = article.isPublished ? "published" : article.status || "draft"
    return `Article created (${status}): ${article.title}`
  }

  const failure = result?.failures?.[0]
  if (failure?.reason) return `Rewrite finished without article: ${failure.reason}`

  const duplicate = result?.duplicates?.[0]
  if (duplicate?.reason) return `Duplicate article skipped: ${duplicate.reason}`

  if (result?.skippedClaimed) {
    return "Rewrite skipped: this queue item is no longer pending. Refresh and use Ready to Rewrite."
  }

  if (result?.processed === 0) {
    return "Rewrite skipped: no eligible queue item was found for this row."
  }

  return "Rewrite finished, but no article was created. Check row status and reason."
}

function getBatchResultMessage(result: BatchResult) {
  if (!result.success) return result.error || "Action failed"
  if (result.action === "rewrite") {
    return getRewriteResultMessage(result.output?.result)
  }
  return `${result.action} completed`
}

function getBatchResultArticle(result: BatchResult) {
  return result.output?.result?.articles?.[0] || null
}

function getArticleStateLabel(row: QueueRow) {
  const article = row.rewritten_article
  if (!article) return null
  if (article.is_published) return "Published article"
  if (article.status === "published") return "Published article"
  return "Draft article"
}

function getArticleViewHref(row: QueueRow) {
  const article = row.rewritten_article
  if (!article?.slug) return null
  return `/news/${article.slug}`
}

function inferType(row: QueueRow) {
  const text = `${row.raw_title || ""} ${row.raw_excerpt || ""} ${row.source_url || ""}`.toLowerCase()
  if (text.includes("pre-register") || text.includes("pre-registration")) return "pre-registration"
  if (text.includes("collab") || text.includes("collaboration")) return "collaboration"
  if (text.includes("reward") || text.includes("code") || text.includes("redeem")) return "rewards"
  if (text.includes("gacha") || text.includes("banner") || text.includes("summon")) return "gacha"
  if (text.includes("mmorpg")) return "mmorpg"
  if (text.includes("shutdown")) return "shutdown"
  if (text.includes("mobile") || text.includes("ios") || text.includes("android")) return "mobile"
  if (text.includes("pc") || text.includes("steam") || text.includes("playstation") || text.includes("ps5") || text.includes("xbox") || text.includes("switch")) return "pc-console"
  if (text.includes("publisher") || text.includes("studio") || text.includes("industry") || text.includes("gaming")) return "gaming"
  return "unclassified"
}

function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string
  value: number | string
  tone?: "neutral" | "red" | "green" | "blue"
}) {
  const toneClass =
    tone === "red"
      ? "text-[#FF6B6B]"
      : tone === "green"
        ? "text-[#4DCC8A]"
        : tone === "blue"
          ? "text-[#7EB8F0]"
          : "text-white"

  return (
    <div className="border border-white/[0.08] bg-[#0D0D0D] rounded-lg px-4 py-3">
      <p className="text-[11px] uppercase tracking-[1.5px] text-white/35">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  )
}

export default function NewsroomPage() {
  const [tab, setTab] = useState<"queue" | "articles" | "health" | "rules">("queue")
  const [data, setData] = useState<NewsroomData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [status, setStatus] = useState("all")
  const [source, setSource] = useState("all")
  const [type, setType] = useState("all")
  const [search, setSearch] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [batchActions, setBatchActions] = useState<Record<string, BatchAction>>({})
  const [batchResults, setBatchResults] = useState<BatchResult[]>([])
  const [fetchFilterRunning, setFetchFilterRunning] = useState(false)
  const [fetchFilterResult, setFetchFilterResult] = useState<FetchFilterResult | null>(null)
  const [translationRunning, setTranslationRunning] = useState(false)
  const [translationResult, setTranslationResult] = useState<TranslationPreviewResult | null>(null)
  const [translationPreviews, setTranslationPreviews] = useState<Record<string, TranslationPreview>>({})

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    params.set("limit", "75")
    params.set("articleLimit", "50")
    if (status !== "all") params.set("status", status)
    if (source !== "all") params.set("source", source)
    if (search.trim()) params.set("q", search.trim())
    const res = await fetch(`/api/admin/newsroom?${params.toString()}`)
    const json = await res.json()
    if (json.success) setData(json)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, source])

  const filteredQueue = useMemo(() => {
    const rows = data?.queue || []
    if (type === "all") return rows
    return rows.filter((row) => inferType(row) === type)
  }, [data, type])

  const selectedBatchItems = useMemo(
    () =>
      Object.entries(batchActions)
        .filter(([, action]) => action !== "none")
        .map(([id, action]) => ({
          id,
          action: action as Exclude<BatchAction, "none">,
        })),
    [batchActions]
  )

  function setRowBatchAction(id: string, action: BatchAction) {
    setBatchActions((current) => {
      const next = { ...current }
      if (action === "none") {
        delete next[id]
      } else {
        next[id] = action
      }
      return next
    })
  }

  function clearBatchActions() {
    setBatchActions({})
    setBatchResults([])
  }

  function clearTranslations() {
    setTranslationPreviews({})
    setTranslationResult(null)
  }

  async function runAction(action: string, id: string) {
    if (action === "delete" && !confirm("Delete this raw queue item?")) return
    if (action === "approve" && !confirm("Manual approve this item for rewrite?")) return
    setBusyId(id)
    setMessage(null)
    const res = await fetch("/api/admin/newsroom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id }),
    })
    const json = await res.json().catch(() => null)
    setBusyId(null)
    if (!json?.success) {
      setMessage(json?.error || "Action failed")
      await load()
      return
    }

    if (action === "rewrite") {
      const article = json.result?.articles?.[0]
      setMessage(getRewriteResultMessage(json.result))
      if (article) setTab("articles")
    } else {
      setMessage(`${action} completed`)
    }
    await load()
  }

  async function executeBatch() {
    if (selectedBatchItems.length === 0) {
      setMessage("Select at least one queue action first.")
      return
    }

    const deleteCount = selectedBatchItems.filter((item) => item.action === "delete").length
    const rewriteCount = selectedBatchItems.filter((item) => item.action === "rewrite").length
    const confirmText = `Execute ${selectedBatchItems.length} queued actions?${rewriteCount ? ` This includes ${rewriteCount} rewrite job(s).` : ""}${deleteCount ? ` This includes ${deleteCount} delete action(s).` : ""}`
    if (!confirm(confirmText)) return

    setBusyId("batch")
    setMessage(`Running ${selectedBatchItems.length} queued actions...`)
    setBatchResults([])

    const res = await fetch("/api/admin/newsroom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "batch", items: selectedBatchItems }),
    })
    const json = await res.json().catch(() => null)
    setBusyId(null)

    if (!json?.success) {
      setMessage(json?.error || "Batch action failed")
      await load()
      return
    }

    const results = (json.results || []) as BatchResult[]
    const success = results.filter((item) => item.success).length
    const failed = results.length - success
    setBatchResults(results)
    setBatchActions({})
    setMessage(`Batch completed: ${success} succeeded, ${failed} failed.`)
    await load()
  }

  async function runFetchAndFilter() {
    if (!confirm("Fetch news and filter freshness now? This may take a few minutes.")) return

    setFetchFilterRunning(true)
    setFetchFilterResult(null)
    setMessage(null)

    const res = await fetch("/api/admin/newsroom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "fetch_filter" }),
    })
    const json = await res.json().catch(() => null)
    setFetchFilterRunning(false)

    if (!json?.success) {
      setMessage(json?.error || "Fetch and filter failed")
      await load()
      return
    }

    setFetchFilterResult(json.result)
    setMessage(
      `Fetch & filter completed: ready to rewrite ${json.result?.readyAfter || 0} news (${json.result?.readyAdded || 0} new).`
    )
    setStatus("eligible")
    await load()
  }

  async function translateVisibleQueue() {
    const visibleItems = filteredQueue
      .filter((row) => row.raw_title || row.raw_excerpt)
      .slice(0, 25)
      .map((row) => ({
        id: row.id,
        title: row.raw_title || "",
        excerpt: row.raw_excerpt || "",
      }))

    if (visibleItems.length === 0) {
      setMessage("No visible queue items to translate.")
      return
    }

    setTranslationRunning(true)
    setTranslationResult(null)
    setMessage(`Translating ${visibleItems.length} visible queue items with local Ollama...`)

    const res = await fetch("/api/admin/newsroom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "translate_preview", items: visibleItems }),
    })
    const json = await res.json().catch(() => null)
    setTranslationRunning(false)

    if (!json?.success) {
      setMessage(json?.error || "Translation preview failed")
      return
    }

    const result = json.result as TranslationPreviewResult
    const nextTranslations: Record<string, TranslationPreview> = {}

    for (const item of result.translations || []) {
      nextTranslations[item.id] = {
        title: item.title,
        excerpt: item.excerpt,
        status: item.status,
        model: item.model,
        error: item.error,
      }
    }

    setTranslationPreviews((current) => ({ ...current, ...nextTranslations }))
    setTranslationResult(result)
    setMessage(
      `Translation preview completed: ${result.translated || 0} translated, ${result.fallback || 0} fallback.`
    )
  }

  async function cleanupRejected() {
    if (!confirm("Mark all freshness-rejected pending items as skipped?")) return
    setBusyId("cleanup_rejected")
    await fetch("/api/admin/newsroom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cleanup_rejected" }),
    })
    setBusyId(null)
    await load()
  }

  const health = data?.health
  const queue = health?.rewriteQueue || {}

  return (
    <AdminShell active="newsroom">
    <div className="min-h-screen bg-[#050505] text-[#E8E8E8]">
      <header className="border-b border-white/[0.06] bg-black/80 backdrop-blur px-5 py-5">
        <div className="max-w-[1280px] mx-auto flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[2px] text-white/40 hover:text-white/70">
              TGLabs Admin
            </Link>
            <h1 className="mt-2 font-['Kanit'] text-2xl font-semibold text-white">
              Newsroom Control
            </h1>
            <p className="mt-1 text-sm text-white/45">
              Monitor AI news intake, control rewrite queue, and review published articles.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={runFetchAndFilter}
              disabled={fetchFilterRunning}
              className="h-10 px-4 rounded-md border border-[#4A90D9]/35 bg-[#4A90D9]/10 text-sm font-semibold text-[#B7D9FF] hover:bg-[#4A90D9]/20 disabled:opacity-40"
            >
              {fetchFilterRunning ? "Working..." : "Fetch & Filter"}
            </button>
            <button
              onClick={load}
              className="h-10 px-4 rounded-md bg-[#FF1A1A] text-sm font-semibold text-white hover:bg-[#B30000] transition-colors"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      {fetchFilterRunning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-white/[0.1] bg-[#0D0D0D] p-6 shadow-2xl">
            <div className="h-1 overflow-hidden rounded-full bg-white/[0.08]">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-[#FF1A1A]" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-white">Fetching and filtering news</h2>
            <p className="mt-2 text-sm leading-6 text-white/50">
              ระบบกำลังค้นหาข่าวใหม่ ดึงเนื้อหาจริง และตรวจ freshness เพื่อเตรียมข่าวที่พร้อม rewrite ขั้นตอนนี้อาจใช้เวลาสักครู่
            </p>
            <div className="mt-4 rounded-md border border-white/[0.08] bg-black/30 px-3 py-2 text-xs text-white/35">
              Please keep this page open until the report appears.
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1280px] mx-auto px-5 py-6">
        <section className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <MetricCard label="Pending Raw" value={queue.pending || 0} tone="red" />
          <MetricCard label="Ready to Rewrite" value={queue.eligiblePending || 0} tone="blue" />
          <MetricCard label="Processing" value={queue.processing || 0} tone="blue" />
          <MetricCard label="Success" value={queue.success || 0} tone="green" />
          <MetricCard label="Failed" value={queue.failed || 0} tone="red" />
          <MetricCard label="Rejected Pending" value={queue.rejectedPending || 0} tone="red" />
        </section>

        <div className="mt-6 flex flex-wrap gap-2 border-b border-white/[0.08]">
          {(["queue", "articles", "health", "rules"] as const).map((name) => (
            <button
              key={name}
              onClick={() => setTab(name)}
              className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === name
                  ? "border-[#FF1A1A] text-white"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {message && (
          <div className="mt-4 rounded-lg border border-[#4A90D9]/25 bg-[#4A90D9]/10 px-4 py-3 text-sm text-[#B7D9FF]">
            {message}
          </div>
        )}

        {fetchFilterResult && (
          <section className="mt-4 rounded-lg border border-white/[0.08] bg-[#0D0D0D] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Fetch & Filter Report</p>
                <p className="mt-1 text-xs text-white/40">
                  Ready to rewrite: {fetchFilterResult.readyBefore || 0} to {fetchFilterResult.readyAfter || 0}
                </p>
              </div>
              <button
                onClick={() => setFetchFilterResult(null)}
                className="h-8 rounded-md border border-white/[0.12] px-3 text-xs text-white/55"
              >
                Dismiss
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
              <MetricCard label="Queued" value={fetchFilterResult.collection?.queued || 0} tone="blue" />
              <MetricCard label="Old" value={fetchFilterResult.collection?.skippedOld || 0} tone="red" />
              <MetricCard label="Irrelevant" value={fetchFilterResult.collection?.skippedIrrelevant || 0} tone="red" />
              <MetricCard label="Fetch OK" value={fetchFilterResult.fetchQueue?.fetched || 0} tone="green" />
              <MetricCard label="Duplicate" value={fetchFilterResult.fetchQueue?.rejectedDuplicate || 0} />
              <MetricCard label="Accepted" value={fetchFilterResult.freshness?.accepted || 0} tone="green" />
              <MetricCard label="Rejected" value={fetchFilterResult.freshness?.rejected || 0} tone="red" />
              <MetricCard label="Ready +" value={fetchFilterResult.readyAdded || 0} tone="blue" />
            </div>
          </section>
        )}

        {tab === "queue" && (
          <section className="mt-5">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_160px_180px_180px_auto] gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") load()
                }}
                placeholder="Search title or source URL"
                className="h-10 rounded-md border border-white/[0.08] bg-[#0D0D0D] px-3 text-sm text-white outline-none focus:border-[#FF1A1A]/50"
              />
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-md border border-white/[0.08] bg-[#0D0D0D] px-3 text-sm text-white">
                {statusOptions.map((option) => (
                  <option key={option} value={option}>{statusLabels[option] || option}</option>
                ))}
              </select>
              <select value={type} onChange={(e) => setType(e.target.value)} className="h-10 rounded-md border border-white/[0.08] bg-[#0D0D0D] px-3 text-sm text-white">
                {typeOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <select value={source} onChange={(e) => setSource(e.target.value)} className="h-10 rounded-md border border-white/[0.08] bg-[#0D0D0D] px-3 text-sm text-white">
                <option>all</option>
                {(data?.sources || []).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <button onClick={load} className="h-10 rounded-md border border-white/[0.1] px-4 text-sm text-white/70 hover:text-white">
                Apply
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-[#0D0D0D] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-white">Batch workflow</p>
                <p className="mt-1 text-xs text-white/40">
                  Choose actions per row, translate visible previews, then execute selected actions sequentially.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={translateVisibleQueue}
                  disabled={translationRunning || filteredQueue.length === 0}
                  className="h-9 rounded-md border border-[#4A90D9]/35 px-3 text-xs font-semibold text-[#B7D9FF] disabled:opacity-40"
                >
                  {translationRunning ? "Translating..." : "Translate visible"}
                </button>
                <button
                  onClick={clearTranslations}
                  disabled={translationRunning || Object.keys(translationPreviews).length === 0}
                  className="h-9 rounded-md border border-white/[0.12] px-3 text-xs font-semibold text-white/60 disabled:opacity-40"
                >
                  Clear translations
                </button>
                <button
                  onClick={clearBatchActions}
                  disabled={busyId === "batch" || selectedBatchItems.length === 0}
                  className="h-9 rounded-md border border-white/[0.12] px-3 text-xs font-semibold text-white/60 disabled:opacity-40"
                >
                  Clear selection
                </button>
                <button
                  onClick={executeBatch}
                  disabled={busyId === "batch" || selectedBatchItems.length === 0}
                  className="h-9 rounded-md bg-[#FF1A1A] px-4 text-xs font-semibold text-white disabled:opacity-40"
                >
                  {busyId === "batch" ? "Executing..." : `Execute ${selectedBatchItems.length}`}
                </button>
                <button
                  onClick={cleanupRejected}
                  disabled={busyId === "cleanup_rejected" || busyId === "batch"}
                  className="h-9 rounded-md border border-[#FF6B35]/30 px-3 text-xs font-semibold text-[#FF9A74] disabled:opacity-40"
                >
                  Cleanup rejected pending
                </button>
              </div>
            </div>

            {batchResults.length > 0 && (
              <div className="mt-3 rounded-lg border border-white/[0.08] bg-[#0D0D0D] p-4">
                <p className="text-sm font-medium text-white">Batch results</p>
                <div className="mt-3 space-y-2">
                  {batchResults.slice(0, 12).map((result) => {
                    const article = getBatchResultArticle(result)

                    return (
                      <div key={`${result.id}-${result.action}`} className="flex flex-col gap-2 rounded-md border border-white/[0.06] bg-black/20 px-3 py-2 text-xs md:flex-row md:items-center md:justify-between">
                        <span className={result.success ? "text-[#7BE0A5]" : "text-[#FF9A74]"}>
                          {result.action} - {result.success ? "success" : "failed"}
                        </span>
                        <span className="line-clamp-2 flex-1 text-white/45">{getBatchResultMessage(result)}</span>
                        {article?.articleId && article.articleId !== "dry-run" && (
                          <Link
                            href={`/admin/newsroom/articles/${article.articleId}`}
                            className="w-fit rounded border border-[#4DCC8A]/30 px-2 py-1 text-[#7BE0A5]"
                          >
                            Open article
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {translationResult && (
              <div className="mt-3 rounded-lg border border-[#4A90D9]/20 bg-[#0D0D0D] px-4 py-3 text-xs text-[#B7D9FF]">
                Local translation preview: {translationResult.translated || 0} translated, {translationResult.fallback || 0} fallback. Preview text is for admin selection only.
              </div>
            )}

            <div className="mt-4 overflow-hidden rounded-lg border border-white/[0.08]">
              <div className="grid grid-cols-[1.5fr_120px_160px_120px_280px] gap-3 bg-white/[0.03] px-4 py-3 text-[11px] uppercase tracking-[1.4px] text-white/35">
                <span>News</span>
                <span>Type</span>
                <span>Status</span>
                <span>Published</span>
                <span>Actions</span>
              </div>
              {filteredQueue.map((row) => (
                <div key={row.id} className="grid grid-cols-1 lg:grid-cols-[1.5fr_120px_160px_120px_280px] gap-3 border-t border-white/[0.06] px-4 py-4 bg-[#090909] hover:bg-[#0D0D0D]">
                  <div className="min-w-0">
                    {translationPreviews[row.id]?.title ? (
                      <>
                        <div className="mb-2 flex w-fit rounded border border-[#4A90D9]/25 bg-[#4A90D9]/10 px-2 py-1 text-[10px] uppercase tracking-[1px] text-[#B7D9FF]">
                          AI translated preview - {translationPreviews[row.id].model}
                        </div>
                        <p className="line-clamp-3 text-sm font-medium text-white">
                          {translationPreviews[row.id].title}
                        </p>
                        {translationPreviews[row.id].excerpt && (
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/60">
                            {translationPreviews[row.id].excerpt}
                          </p>
                        )}
                        <p className="mt-2 line-clamp-2 text-xs text-white/30">
                          Original: {row.raw_title || "Untitled"}
                        </p>
                      </>
                    ) : (
                      <p className="line-clamp-2 text-sm font-medium text-white">{row.raw_title || "Untitled"}</p>
                    )}
                    <p className="mt-1 text-xs text-white/35">{row.source_domain || "unknown"} - {row.freshness_status || "-"}</p>
                    {row.rewrite_error && (
                      <p className="mt-2 line-clamp-2 text-xs text-[#FF9A74]">{row.rewrite_error}</p>
                    )}
                  </div>
                  <span className="h-fit w-fit rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-xs text-white/55">
                    {inferType(row)}
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className={`h-fit w-fit rounded border px-2 py-1 text-xs ${statusClass(row.rewrite_status)}`}>
                      rewrite: {row.rewrite_status || "pending"}
                    </span>
                    <span className="w-fit rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-xs text-white/45">
                      extract: {row.extraction_status || "-"}
                    </span>
                  </div>
                  <span className="text-xs text-white/45">{formatDate(row.published_source_at)}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={batchActions[row.id] || "none"}
                      onChange={(event) => setRowBatchAction(row.id, event.target.value as BatchAction)}
                      disabled={busyId === "batch"}
                      className="h-8 min-w-[150px] rounded-md border border-white/[0.08] bg-[#0D0D0D] px-2 text-xs text-white disabled:opacity-40"
                    >
                      {batchActionOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button disabled={busyId === row.id || busyId === "batch"} onClick={() => runAction("rewrite", row.id)} className="rounded border border-[#FF1A1A]/35 px-3 py-1.5 text-xs font-semibold text-[#FF8A8A] disabled:opacity-40">
                      Run now
                    </button>
                    {row.source_url && (
                      <a href={row.source_url} target="_blank" className="rounded border border-white/[0.12] px-3 py-1.5 text-xs text-white/50">
                        Source
                      </a>
                    )}
                    {row.rewritten_article_id && (
                      <Link href={`/admin/newsroom/articles/${row.rewritten_article_id}`} className="rounded border border-[#4DCC8A]/30 px-3 py-1.5 text-xs text-[#7BE0A5]">
                        {getArticleStateLabel(row) || "Article"}
                      </Link>
                    )}
                    {getArticleViewHref(row) && row.rewritten_article?.is_published && (
                      <Link href={getArticleViewHref(row) || "#"} className="rounded border border-white/[0.12] px-3 py-1.5 text-xs text-white/50">
                        View live
                      </Link>
                    )}
                  </div>
                </div>
              ))}
              {!loading && filteredQueue.length === 0 && (
                <div className="border-t border-white/[0.06] px-4 py-10 text-center text-sm text-white/40">
                  No queue items match the current filters.
                </div>
              )}
            </div>
          </section>
        )}

        {tab === "articles" && (
          <section className="mt-5 overflow-hidden rounded-lg border border-white/[0.08]">
            <div className="grid grid-cols-[1.5fr_120px_120px_180px] gap-3 bg-white/[0.03] px-4 py-3 text-[11px] uppercase tracking-[1.4px] text-white/35">
              <span>Article</span>
              <span>Category</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {(data?.articles || []).map((article) => (
              <div key={article.id} className="grid grid-cols-1 lg:grid-cols-[1.5fr_120px_120px_180px] gap-3 border-t border-white/[0.06] px-4 py-4">
                <div>
                  <p className="line-clamp-2 text-sm font-medium text-white">{article.title}</p>
                  <p className="mt-1 text-xs text-white/35">{article.slug} · {formatDate(article.updated_at || article.published_at)}</p>
                </div>
                <span className="text-xs text-white/55">{article.category || "news"}</span>
                <span className={`h-fit w-fit rounded border px-2 py-1 text-xs ${article.is_published ? "border-[#4DCC8A]/30 bg-[#4DCC8A]/10 text-[#4DCC8A]" : "border-white/10 bg-white/[0.04] text-white/50"}`}>
                  {article.is_published ? "published" : "draft"}
                </span>
                <div className="flex gap-2">
                  <Link href={`/admin/newsroom/articles/${article.id}`} className="rounded bg-[#FF1A1A] px-3 py-1.5 text-xs font-semibold text-white">
                    Edit
                  </Link>
                  {article.is_published && (
                    <Link href={`/news/${article.slug}`} className="rounded border border-white/[0.12] px-3 py-1.5 text-xs text-white/60">
                      View
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {tab === "health" && (
          <section className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg border border-white/[0.08] bg-[#0D0D0D] p-5">
              <h2 className="text-sm font-semibold text-white">Top Failure Reasons</h2>
              <div className="mt-4 space-y-3">
                {(health?.topFailureReasons || []).map((item) => (
                  <div key={item.reason} className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-white/60">{item.reason}</span>
                    <span className="text-white">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-white/[0.08] bg-[#0D0D0D] p-5">
              <h2 className="text-sm font-semibold text-white">Source Performance</h2>
              <div className="mt-4 space-y-3">
                {(health?.sourcePerformance || []).map((item) => (
                  <div key={item.source} className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-white/60">{item.source}</span>
                    <span className="text-white/45">failed {item.failed} · skipped {item.skipped}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {tab === "rules" && (
          <section className="mt-5 rounded-lg border border-white/[0.08] bg-[#0D0D0D] p-6">
            <p className="text-[11px] uppercase tracking-[1.6px] text-[#FF1A1A]">Prepared for future filters</p>
            <h2 className="mt-2 text-lg font-semibold text-white">Editorial Rules</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
              This area is reserved for source allow/block lists, keyword boosts, category priorities, and score thresholds. The first version keeps rules in code to avoid accidental production behavior changes.
            </p>
          </section>
        )}
      </main>
    </div>
    </AdminShell>
  )
}
