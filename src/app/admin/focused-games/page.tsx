"use client"

import { useEffect, useMemo, useState } from "react"
import { AdminShell } from "@/components/admin/AdminShell"

type FocusedGame = {
  id: string
  name: string
  slug: string
  category: string
  platforms: string[] | null
  official_website: string | null
  status: string
  priority: string
  notes: string | null
}

type FocusedSource = {
  id: string
  game_id: string
  source_type: string
  source_name: string | null
  source_url: string
  trust_level: string
  check_frequency: string
  enabled: boolean
  last_checked_at: string | null
  last_success_at: string | null
  last_error: string | null
}

type CheckResult = {
  gameId: string
  sources: number
  discovered: number
  queued: number
  duplicate: number
  stale: number
  failed: number
  sourceResults: Array<{
    sourceId: string
    sourceName: string | null
    discovered: number
    queued: number
    duplicate: number
    stale: number
    failed: number
    error?: string
  }>
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

function emptyGameForm() {
  return {
    name: "",
    slug: "",
    category: "mobile",
    platforms: "iOS, Android",
    official_website: "",
    priority: "normal",
    notes: "",
  }
}

function emptySourceForm(gameId = "") {
  return {
    game_id: gameId,
    source_type: "news_page",
    source_name: "",
    source_url: "",
    trust_level: "official",
    check_frequency: "manual",
  }
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string
  value: number | string
  tone?: "neutral" | "blue" | "green" | "red"
}) {
  const color =
    tone === "blue"
      ? "text-[#7EB8F0]"
      : tone === "green"
        ? "text-[#4DCC8A]"
        : tone === "red"
          ? "text-[#FF6B6B]"
          : "text-white"

  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#0D0D0D] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[1.4px] text-white/35">{label}</p>
      <p className={`mt-2 text-xl font-semibold ${color}`}>{value}</p>
    </div>
  )
}

export default function FocusedGamesPage() {
  const [games, setGames] = useState<FocusedGame[]>([])
  const [sources, setSources] = useState<FocusedSource[]>([])
  const [selectedGameId, setSelectedGameId] = useState("")
  const [gameForm, setGameForm] = useState(emptyGameForm())
  const [sourceForm, setSourceForm] = useState(emptySourceForm())
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null)

  const selectedGame = games.find((game) => game.id === selectedGameId) || games[0]
  const selectedSources = useMemo(
    () => sources.filter((source) => source.game_id === selectedGame?.id),
    [sources, selectedGame?.id]
  )

  async function load() {
    setLoading(true)
    const res = await fetch("/api/admin/focused-games")
    const json = await res.json().catch(() => null)

    if (json?.success) {
      setGames(json.games || [])
      setSources(json.sources || [])

      if (!selectedGameId && json.games?.[0]?.id) {
        setSelectedGameId(json.games[0].id)
        setSourceForm(emptySourceForm(json.games[0].id))
      }
    } else {
      setMessage(json?.error || "Failed to load focused games")
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedGame?.id) {
      setSourceForm((current) => ({ ...current, game_id: selectedGame.id }))
    }
  }, [selectedGame?.id])

  async function post(body: Record<string, unknown>) {
    const res = await fetch("/api/admin/focused-games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    return res.json().catch(() => null)
  }

  async function createGame() {
    setBusy("create_game")
    setMessage(null)
    const json = await post({ action: "create_game", ...gameForm })
    setBusy(null)

    if (!json?.success) {
      setMessage(json?.error || "Create game failed")
      return
    }

    setGameForm(emptyGameForm())
    setSelectedGameId(json.game.id)
    setMessage(`Focused game added: ${json.game.name}`)
    await load()
  }

  async function createSource() {
    if (!selectedGame?.id) {
      setMessage("Create a focused game first.")
      return
    }

    setBusy("create_source")
    setMessage(null)
    const json = await post({
      action: "create_source",
      ...sourceForm,
      game_id: selectedGame.id,
    })
    setBusy(null)

    if (!json?.success) {
      setMessage(json?.error || "Create source failed")
      return
    }

    setSourceForm(emptySourceForm(selectedGame.id))
    setMessage(`Source added: ${json.source.source_name || json.source.source_url}`)
    await load()
  }

  async function toggleSource(source: FocusedSource) {
    setBusy(source.id)
    const json = await post({
      action: "toggle_source",
      id: source.id,
      enabled: !source.enabled,
    })
    setBusy(null)

    if (!json?.success) {
      setMessage(json?.error || "Update source failed")
      return
    }

    await load()
  }

  async function checkSourcesNow() {
    if (!selectedGame?.id) return

    setBusy("check_sources")
    setCheckResult(null)
    setMessage(`Checking official sources for ${selectedGame.name}...`)
    const json = await post({ action: "check_sources", game_id: selectedGame.id })
    setBusy(null)

    if (!json?.success) {
      setMessage(json?.error || "Check sources failed")
      await load()
      return
    }

    setCheckResult(json.result)
    setMessage(
      `Check completed: discovered ${json.result.discovered}, queued ${json.result.queued}, duplicate ${json.result.duplicate}.`
    )
    await load()
  }

  return (
    <AdminShell active="focused-games">
      <header className="border-b border-white/[0.06] bg-black/80 px-5 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[2px] text-white/35">Official Source Monitor</p>
            <h1 className="mt-2 font-['Kanit'] text-2xl font-semibold text-white">
              Focused Games
            </h1>
            <p className="mt-1 text-sm text-white/45">
              Track important games through official sources and send reliable updates into the rewrite queue.
            </p>
          </div>
          <button
            onClick={load}
            className="h-10 rounded-md bg-[#FF1A1A] px-4 text-sm font-semibold text-white"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      <main className="px-5 py-6">
        {message && (
          <div className="mb-5 rounded-lg border border-[#4A90D9]/25 bg-[#4A90D9]/10 px-4 py-3 text-sm text-[#B7D9FF]">
            {message}
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Metric label="Focused Games" value={games.length} tone="blue" />
          <Metric label="Sources" value={sources.length} />
          <Metric label="Enabled" value={sources.filter((item) => item.enabled).length} tone="green" />
          <Metric label="Queued Last Run" value={checkResult?.queued || 0} tone="green" />
          <Metric label="Failed Last Run" value={checkResult?.failed || 0} tone="red" />
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-[360px_1fr]">
          <div className="space-y-5">
            <div className="rounded-lg border border-white/[0.08] bg-[#0D0D0D] p-5">
              <h2 className="text-sm font-semibold text-white">Add Focused Game</h2>
              <div className="mt-4 space-y-3">
                <input
                  value={gameForm.name}
                  onChange={(event) => setGameForm({ ...gameForm, name: event.target.value })}
                  placeholder="Game name"
                  className="h-10 w-full rounded-md border border-white/[0.08] bg-black/30 px-3 text-sm text-white outline-none focus:border-[#FF1A1A]/50"
                />
                <input
                  value={gameForm.slug}
                  onChange={(event) => setGameForm({ ...gameForm, slug: event.target.value })}
                  placeholder="Slug (optional)"
                  className="h-10 w-full rounded-md border border-white/[0.08] bg-black/30 px-3 text-sm text-white outline-none focus:border-[#FF1A1A]/50"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={gameForm.category}
                    onChange={(event) => setGameForm({ ...gameForm, category: event.target.value })}
                    className="h-10 rounded-md border border-white/[0.08] bg-black/30 px-3 text-sm text-white"
                  >
                    <option value="mobile">mobile</option>
                    <option value="pc-console">pc-console</option>
                    <option value="gaming">gaming</option>
                  </select>
                  <select
                    value={gameForm.priority}
                    onChange={(event) => setGameForm({ ...gameForm, priority: event.target.value })}
                    className="h-10 rounded-md border border-white/[0.08] bg-black/30 px-3 text-sm text-white"
                  >
                    <option value="high">high</option>
                    <option value="normal">normal</option>
                    <option value="low">low</option>
                  </select>
                </div>
                <input
                  value={gameForm.platforms}
                  onChange={(event) => setGameForm({ ...gameForm, platforms: event.target.value })}
                  placeholder="Platforms: iOS, Android, PC"
                  className="h-10 w-full rounded-md border border-white/[0.08] bg-black/30 px-3 text-sm text-white outline-none focus:border-[#FF1A1A]/50"
                />
                <input
                  value={gameForm.official_website}
                  onChange={(event) => setGameForm({ ...gameForm, official_website: event.target.value })}
                  placeholder="Official website"
                  className="h-10 w-full rounded-md border border-white/[0.08] bg-black/30 px-3 text-sm text-white outline-none focus:border-[#FF1A1A]/50"
                />
                <textarea
                  value={gameForm.notes}
                  onChange={(event) => setGameForm({ ...gameForm, notes: event.target.value })}
                  placeholder="Notes"
                  rows={3}
                  className="w-full rounded-md border border-white/[0.08] bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#FF1A1A]/50"
                />
                <button
                  onClick={createGame}
                  disabled={busy === "create_game"}
                  className="h-10 w-full rounded-md bg-[#FF1A1A] text-sm font-semibold text-white disabled:opacity-40"
                >
                  Add game
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-white/[0.08] bg-[#0D0D0D] p-5">
              <h2 className="text-sm font-semibold text-white">Focused Game List</h2>
              <div className="mt-4 space-y-2">
                {games.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGameId(game.id)}
                    className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                      selectedGame?.id === game.id
                        ? "border-[#FF1A1A]/35 bg-[#FF1A1A]/10"
                        : "border-white/[0.06] bg-black/20 hover:border-white/[0.12]"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-white">{game.name}</span>
                    <span className="mt-1 block text-xs text-white/40">
                      {game.category} · {game.priority} · {game.status}
                    </span>
                  </button>
                ))}
                {!loading && games.length === 0 && (
                  <p className="text-sm text-white/40">No focused games yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <section className="rounded-lg border border-white/[0.08] bg-[#0D0D0D] p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[1.6px] text-[#FF1A1A]">Selected Game</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    {selectedGame?.name || "Select a game"}
                  </h2>
                  <p className="mt-1 text-sm text-white/45">
                    {(selectedGame?.platforms || []).join(", ") || "No platforms set"}
                  </p>
                </div>
                <button
                  onClick={checkSourcesNow}
                  disabled={!selectedGame || busy === "check_sources"}
                  className="h-10 rounded-md border border-[#4DCC8A]/30 px-4 text-sm font-semibold text-[#7BE0A5] disabled:opacity-40"
                >
                  {busy === "check_sources" ? "Checking..." : "Check sources now"}
                </button>
              </div>

              {checkResult && (
                <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
                  <Metric label="Discovered" value={checkResult.discovered} tone="blue" />
                  <Metric label="Queued" value={checkResult.queued} tone="green" />
                  <Metric label="Duplicate" value={checkResult.duplicate} />
                  <Metric label="Stale" value={checkResult.stale} tone="red" />
                  <Metric label="Failed" value={checkResult.failed} tone="red" />
                </div>
              )}
            </section>

            <section className="rounded-lg border border-white/[0.08] bg-[#0D0D0D] p-5">
              <h2 className="text-sm font-semibold text-white">Add Official Source</h2>
              <div className="mt-4 grid gap-3 lg:grid-cols-[160px_1fr_1fr_130px_auto]">
                <select
                  value={sourceForm.source_type}
                  onChange={(event) => setSourceForm({ ...sourceForm, source_type: event.target.value })}
                  className="h-10 rounded-md border border-white/[0.08] bg-black/30 px-3 text-sm text-white"
                >
                  <option value="official_site">official_site</option>
                  <option value="news_page">news_page</option>
                  <option value="manual_url">manual_url</option>
                </select>
                <input
                  value={sourceForm.source_name}
                  onChange={(event) => setSourceForm({ ...sourceForm, source_name: event.target.value })}
                  placeholder="Source name"
                  className="h-10 rounded-md border border-white/[0.08] bg-black/30 px-3 text-sm text-white outline-none focus:border-[#FF1A1A]/50"
                />
                <input
                  value={sourceForm.source_url}
                  onChange={(event) => setSourceForm({ ...sourceForm, source_url: event.target.value })}
                  placeholder="https://..."
                  className="h-10 rounded-md border border-white/[0.08] bg-black/30 px-3 text-sm text-white outline-none focus:border-[#FF1A1A]/50"
                />
                <select
                  value={sourceForm.trust_level}
                  onChange={(event) => setSourceForm({ ...sourceForm, trust_level: event.target.value })}
                  className="h-10 rounded-md border border-white/[0.08] bg-black/30 px-3 text-sm text-white"
                >
                  <option value="official">official</option>
                  <option value="semi_official">semi</option>
                  <option value="community">community</option>
                </select>
                <button
                  onClick={createSource}
                  disabled={busy === "create_source" || !selectedGame}
                  className="h-10 rounded-md bg-[#FF1A1A] px-4 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </section>

            <section className="overflow-hidden rounded-lg border border-white/[0.08]">
              <div className="grid grid-cols-[1.2fr_130px_130px_130px_120px] gap-3 bg-white/[0.03] px-4 py-3 text-[11px] uppercase tracking-[1.4px] text-white/35">
                <span>Source</span>
                <span>Type</span>
                <span>Trust</span>
                <span>Last Check</span>
                <span>Actions</span>
              </div>
              {selectedSources.map((source) => (
                <div key={source.id} className="grid grid-cols-1 gap-3 border-t border-white/[0.06] bg-[#090909] px-4 py-4 lg:grid-cols-[1.2fr_130px_130px_130px_120px]">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-medium text-white">
                      {source.source_name || source.source_url}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs text-white/35">{source.source_url}</p>
                    {source.last_error && (
                      <p className="mt-2 line-clamp-2 text-xs text-[#FF9A74]">{source.last_error}</p>
                    )}
                  </div>
                  <span className="text-xs text-white/55">{source.source_type}</span>
                  <span className="text-xs text-white/55">{source.trust_level}</span>
                  <span className="text-xs text-white/45">{formatDate(source.last_checked_at)}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleSource(source)}
                      disabled={busy === source.id}
                      className={`rounded border px-3 py-1.5 text-xs ${
                        source.enabled
                          ? "border-[#4DCC8A]/30 text-[#7BE0A5]"
                          : "border-white/[0.12] text-white/45"
                      }`}
                    >
                      {source.enabled ? "Enabled" : "Paused"}
                    </button>
                  </div>
                </div>
              ))}
              {!loading && selectedSources.length === 0 && (
                <div className="border-t border-white/[0.06] px-4 py-10 text-center text-sm text-white/40">
                  Add an official website, news page, or manual URL for this game.
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    </AdminShell>
  )
}
