import { NextResponse, type NextRequest } from "next/server"
import { requireOperationalAuth } from "@/lib/apiAuth"
import { checkFocusedGameSources } from "@/lib/news/focusedGameMonitor"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export const runtime = "nodejs"
export const maxDuration = 300

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]+/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

function splitPlatforms(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean)
  }

  if (typeof value !== "string") return []

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

async function loadFocusedGames() {
  const { data: games, error: gamesError } = await supabaseAdmin
    .from("focused_games")
    .select("*")
    .order("created_at", { ascending: false })

  if (gamesError) {
    throw new Error(`LOAD_FOCUSED_GAMES_FAILED: ${gamesError.message}`)
  }

  const { data: sources, error: sourcesError } = await supabaseAdmin
    .from("focused_game_sources")
    .select("*")
    .order("created_at", { ascending: true })

  if (sourcesError) {
    throw new Error(`LOAD_FOCUSED_SOURCES_FAILED: ${sourcesError.message}`)
  }

  return {
    games: games || [],
    sources: sources || [],
  }
}

async function createGame(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : ""
  if (!name) throw new Error("FOCUSED_GAME_NAME_REQUIRED")

  const slug =
    (typeof body.slug === "string" && slugify(body.slug)) || slugify(name)
  if (!slug) throw new Error("FOCUSED_GAME_SLUG_REQUIRED")

  const { data, error } = await supabaseAdmin
    .from("focused_games")
    .insert({
      name,
      slug,
      category: typeof body.category === "string" ? body.category : "mobile",
      platforms: splitPlatforms(body.platforms),
      official_website:
        typeof body.official_website === "string"
          ? body.official_website.trim() || null
          : null,
      priority: typeof body.priority === "string" ? body.priority : "normal",
      status: typeof body.status === "string" ? body.status : "active",
      notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
    })
    .select("*")
    .single()

  if (error) throw new Error(`CREATE_FOCUSED_GAME_FAILED: ${error.message}`)

  return data
}

async function createSource(body: Record<string, unknown>) {
  const gameId = typeof body.game_id === "string" ? body.game_id : ""
  const sourceUrl = typeof body.source_url === "string" ? body.source_url.trim() : ""
  if (!gameId) throw new Error("FOCUSED_SOURCE_GAME_REQUIRED")
  if (!sourceUrl) throw new Error("FOCUSED_SOURCE_URL_REQUIRED")

  const { data, error } = await supabaseAdmin
    .from("focused_game_sources")
    .insert({
      game_id: gameId,
      source_type:
        typeof body.source_type === "string" ? body.source_type : "news_page",
      source_name:
        typeof body.source_name === "string"
          ? body.source_name.trim() || null
          : null,
      source_url: sourceUrl,
      trust_level:
        typeof body.trust_level === "string" ? body.trust_level : "official",
      check_frequency:
        typeof body.check_frequency === "string"
          ? body.check_frequency
          : "manual",
      enabled: body.enabled !== false,
    })
    .select("*")
    .single()

  if (error) throw new Error(`CREATE_FOCUSED_SOURCE_FAILED: ${error.message}`)

  return data
}

async function toggleSource(body: Record<string, unknown>) {
  const id = typeof body.id === "string" ? body.id : ""
  if (!id) throw new Error("FOCUSED_SOURCE_ID_REQUIRED")

  const { data, error } = await supabaseAdmin
    .from("focused_game_sources")
    .update({ enabled: body.enabled === true })
    .eq("id", id)
    .select("*")
    .single()

  if (error) throw new Error(`UPDATE_FOCUSED_SOURCE_FAILED: ${error.message}`)

  return data
}

export async function GET(req: NextRequest) {
  const unauthorized = requireOperationalAuth(req)
  if (unauthorized) return unauthorized

  try {
    const data = await loadFocusedGames()
    return NextResponse.json({ success: true, ...data })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "FOCUSED_GAMES_FAILED",
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = requireOperationalAuth(req)
  if (unauthorized) return unauthorized

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const action = body.action

    if (action === "create_game") {
      const game = await createGame(body)
      return NextResponse.json({ success: true, action, game })
    }

    if (action === "create_source") {
      const source = await createSource(body)
      return NextResponse.json({ success: true, action, source })
    }

    if (action === "toggle_source") {
      const source = await toggleSource(body)
      return NextResponse.json({ success: true, action, source })
    }

    if (action === "check_sources") {
      const gameId = typeof body.game_id === "string" ? body.game_id : ""
      if (!gameId) throw new Error("FOCUSED_GAME_ID_REQUIRED")

      const result = await checkFocusedGameSources(gameId)
      return NextResponse.json({ success: true, action, result })
    }

    return NextResponse.json(
      { success: false, error: "UNKNOWN_ACTION" },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "FOCUSED_GAMES_ACTION_FAILED",
      },
      { status: 500 }
    )
  }
}
