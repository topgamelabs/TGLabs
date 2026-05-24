import { supabaseAdmin } from "@/lib/supabaseAdmin"
import type { ArticleFacts } from "@/lib/ai/editorial"
import type { ArticleCategory } from "./saveArticle"
import type { OpenClawCandidate } from "./openClawCandidates"

export interface GameProfile {
  id: string
  name: string
  slug: string
  thumbnail?: string | null
  platform?: string | null
  platforms?: string[] | null
  genre?: string | null
  developer?: string | null
  publisher?: string | null
  official_website?: string | null
  official_x?: string | null
  official_facebook?: string | null
  official_youtube?: string | null
  app_store_url?: string | null
  google_play_url?: string | null
  steam_url?: string | null
  playstation_url?: string | null
  nintendo_url?: string | null
  xbox_url?: string | null
  description?: string | null
  needs_review?: boolean | null
}

interface ResolveGameProfileOptions {
  candidate: OpenClawCandidate
  facts: ArticleFacts
  sourceText: string
  classificationDecision: string
}

const UNKNOWN_GAME_NAMES = new Set([
  "",
  "unknown game",
  "game",
  "new game",
  "mobile game",
  "pc game",
])

function normalizeName(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function slugifyGameName(value: string) {
  return normalizeName(value).replace(/\s+/g, "-").slice(0, 80).replace(/^-+|-+$/g, "")
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.map((value) => (value || "").trim()).filter(Boolean))
  )
}

function getGameNameCandidates(facts: ArticleFacts, candidate: OpenClawCandidate) {
  return uniqueValues([
    facts.game_name,
    candidate.raw_title?.split(/[!:|-]/)[0],
  ]).filter((value) => !UNKNOWN_GAME_NAMES.has(normalizeName(value)))
}

function getProfileAliases(profile: GameProfile) {
  const aliases = Array.isArray((profile as { aliases?: unknown }).aliases)
    ? ((profile as { aliases?: string[] }).aliases || [])
    : []

  return uniqueValues([profile.name, profile.slug, ...aliases])
}

function textIncludesName(text: string, name: string) {
  const normalizedText = normalizeName(text)
  const normalizedName = normalizeName(name)
  if (!normalizedName || normalizedName.length < 3) return false
  return normalizedText.includes(normalizedName)
}

function platformList(profile: GameProfile) {
  return uniqueValues([profile.platform, ...(profile.platforms || [])])
}

export function categoryForGameProfile(
  profile: GameProfile | null | undefined
): ArticleCategory | null {
  if (!profile) return null

  const platforms = platformList(profile).map((platform) => platform.toLowerCase())
  const joined = platforms.join(" ")

  if (
    joined.includes("mobile") ||
    joined.includes("android") ||
    joined.includes("ios") ||
    joined.includes("cross-platform") ||
    joined.includes("cross platform")
  ) {
    return "mobile"
  }

  if (
    joined.includes("pc") ||
    joined.includes("steam") ||
    joined.includes("console") ||
    joined.includes("playstation") ||
    joined.includes("xbox") ||
    joined.includes("switch")
  ) {
    return "pc-console"
  }

  return null
}

function platformFromFacts(facts: ArticleFacts, decision: string) {
  const text = facts.platforms.join(" ").toLowerCase()

  if (
    text.includes("android") ||
    text.includes("ios") ||
    text.includes("app store") ||
    text.includes("google play")
  ) {
    if (
      text.includes("pc") ||
      text.includes("steam") ||
      text.includes("playstation") ||
      text.includes("xbox") ||
      text.includes("switch")
    ) {
      return "cross-platform"
    }

    return "mobile"
  }

  if (decision === "cross_platform_game") return "cross-platform"
  if (decision === "mobile_game") return "mobile"
  if (decision === "pc_console_game") return "pc-console"

  return "gaming"
}

function isSafeAutoCreateName(name: string, sourceText: string, candidate: OpenClawCandidate) {
  const normalized = normalizeName(name)
  if (normalized.length < 3 || normalized.length > 80) return false
  if (UNKNOWN_GAME_NAMES.has(normalized)) return false
  if (/^(the|a|an|this|that|update|patch|version|new|official)$/.test(normalized)) return false

  const evidenceText = `${candidate.raw_title || ""} ${candidate.raw_excerpt || ""} ${sourceText.slice(0, 3000)}`
  return textIncludesName(evidenceText, name)
}

async function loadGameProfiles() {
  const { data, error } = await supabaseAdmin
    .from("games")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    console.warn("[GAME PROFILE] Failed to load games", error.message)
    return []
  }

  return (data || []) as GameProfile[]
}

function findMatchingProfile(
  profiles: GameProfile[],
  names: string[],
  candidate: OpenClawCandidate,
  sourceText: string
) {
  const evidenceText = `${candidate.raw_title || ""} ${candidate.raw_excerpt || ""} ${sourceText.slice(0, 3000)}`
  const normalizedNames = names.map(normalizeName).filter(Boolean)

  const directMatch = profiles.find((profile) =>
    getProfileAliases(profile).some((alias) =>
      normalizedNames.includes(normalizeName(alias))
    )
  )
  if (directMatch) return directMatch

  return profiles
    .slice()
    .sort((a, b) => normalizeName(b.name).length - normalizeName(a.name).length)
    .find((profile) =>
      getProfileAliases(profile).some((alias) => textIncludesName(evidenceText, alias))
    )
}

async function touchGameProfile(profile: GameProfile, sourceUrl: string) {
  const { error } = await supabaseAdmin
    .from("games")
    .update({
      last_seen_at: new Date().toISOString(),
      metadata_source_url: sourceUrl,
    })
    .eq("id", profile.id)

  if (error && error.code !== "PGRST204") {
    console.warn("[GAME PROFILE] Failed to update last_seen_at", error.message)
  }
}

async function createReviewGameProfile(
  name: string,
  facts: ArticleFacts,
  candidate: OpenClawCandidate,
  decision: string
) {
  const slug = slugifyGameName(name)
  if (!slug) return null

  const baseProfile = {
    name,
    slug,
    thumbnail: null,
    platform: platformFromFacts(facts, decision),
  }
  const extendedProfile = {
    ...baseProfile,
    platforms: facts.platforms,
    metadata_source_url: candidate.source_url,
    last_seen_at: new Date().toISOString(),
    confidence: 0.45,
    needs_review: true,
  }

  const { data, error } = await supabaseAdmin
    .from("games")
    .insert(extendedProfile)
    .select("*")
    .single()

  if (!error) return data as GameProfile

  if (error.code === "23505") return null

  const { data: fallbackData, error: fallbackError } = await supabaseAdmin
    .from("games")
    .insert(baseProfile)
    .select("*")
    .single()

  if (fallbackError) {
    if (fallbackError.code !== "23505") {
      console.warn("[GAME PROFILE] Failed to create review game", fallbackError.message)
    }
    return null
  }

  return fallbackData as GameProfile
}

export async function resolveGameProfile({
  candidate,
  facts,
  sourceText,
  classificationDecision,
}: ResolveGameProfileOptions) {
  const profiles = await loadGameProfiles()
  const names = getGameNameCandidates(facts, candidate)
  const matched = findMatchingProfile(profiles, names, candidate, sourceText)

  if (matched) {
    await touchGameProfile(matched, candidate.source_url)
    return { profile: matched, created: false }
  }

  const primaryName = names[0]
  if (!primaryName || !isSafeAutoCreateName(primaryName, sourceText, candidate)) {
    return { profile: null, created: false }
  }

  const created = await createReviewGameProfile(
    primaryName,
    facts,
    candidate,
    classificationDecision
  )

  return { profile: created, created: Boolean(created) }
}

export function formatGameProfileContext(profile: GameProfile | null | undefined) {
  if (!profile) return "not available"

  const rows = [
    ["Game title", profile.name],
    ["Known platform", platformList(profile).join(", ")],
    ["Genre", profile.genre],
    ["Developer", profile.developer],
    ["Publisher", profile.publisher],
    ["Official website", profile.official_website],
    ["Official X", profile.official_x],
    ["Official Facebook", profile.official_facebook],
    ["Official YouTube", profile.official_youtube],
    ["App Store", profile.app_store_url],
    ["Google Play", profile.google_play_url],
    ["Steam", profile.steam_url],
    ["PlayStation", profile.playstation_url],
    ["Nintendo", profile.nintendo_url],
    ["Xbox", profile.xbox_url],
    ["Description", profile.description],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `- ${label}: ${value}`)

  return rows.length > 0 ? rows.join("\n") : `- Game title: ${profile.name}`
}
