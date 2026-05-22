interface NewsRelevanceInput {
  title?: string | null
  excerpt?: string | null
  content?: string | null
  url?: string | null
}

export interface NewsRelevanceResult {
  allowed: boolean
  reason: string | null
  score: number
  action?: "allow" | "skip" | "defer"
}

const MOBILE_GAME_TERMS = [
  "android",
  "app store",
  "apk",
  "banner",
  "closed beta",
  "code",
  "collab",
  "collaboration",
  "cross-platform",
  "cross platform",
  "crossplay",
  "cross-play",
  "gacha",
  "global launch",
  "google play",
  "ios",
  "limited banner",
  "mobile",
  "mobile game",
  "mmorpg",
  "pre-register",
  "pre-registration",
  "redeem",
  "smartphone",
  "summon",
]

const GAME_SERVICE_TERMS = [
  "anniversary",
  "battle pass",
  "beta test",
  "character",
  "collaboration",
  "controversy",
  "event",
  "gameplay",
  "global launch",
  "launch",
  "maintenance",
  "major update",
  "patch",
  "player",
  "pre-registration",
  "pvp",
  "release",
  "reward",
  "roadmap",
  "rpg",
  "server",
  "shutdown",
  "tier list",
  "update",
]

const CROSS_PLATFORM_TERMS = [
  "android",
  "app store",
  "console",
  "cross-platform",
  "cross platform",
  "crossplay",
  "cross-play",
  "epic games",
  "google play",
  "ios",
  "mobile",
  "pc",
  "playstation",
  "ps5",
  "steam",
  "switch",
  "windows",
  "xbox",
]

const FUTURE_PLATFORM_TERMS = [
  "console",
  "nintendo",
  "nintendo switch",
  "pc",
  "playstation",
  "ps4",
  "ps5",
  "steam",
  "switch",
  "windows",
  "xbox",
]

const NON_ARTICLE_TERMS = [
  "all news",
  "awards",
  "category",
  "directory",
  "games database",
  "profile",
  "tag",
  "view all",
  "wiki",
]

const LOW_NEWS_VALUE_TERMS = [
  "best builds",
  "best progression",
  "beginner guide",
  "beginners guide",
  "build guide",
  "guide and tips",
  "how to",
  "reroll guide",
  "tier list",
  "tips and tricks",
  "walkthrough",
]

const PLAYER_IMPACT_TERMS = [
  "anniversary",
  "collab",
  "collaboration",
  "controversy",
  "free pull",
  "free reward",
  "global launch",
  "launch",
  "limited banner",
  "major update",
  "pre-register",
  "pre-registration",
  "redeem",
  "reward",
  "shutdown",
]

const NON_GAME_TERMS = [
  "anime",
  "animation",
  "comic",
  "episode",
  "manga",
  "movie",
  "novel",
  "season",
]

const NON_ARTICLE_URL_PATTERN =
  /\/(category|tag|tags|profiles?|awards?|database|wiki)(\/|$)/i

const DIRECTORY_GAME_URL_PATTERN = /\/games?\/[^/]+\/?$/i

const MOBILE_FIRST_SOURCE_DOMAINS = [
  "mobilegamer.biz",
  "gamingonphone.com",
  "droidgamers.com",
  "pocketgamer.com",
  "qoo-app.com",
]

const PC_CONSOLE_FIRST_SOURCE_DOMAINS = [
  "gematsu.com",
  "pcgamer.com",
  "ign.com",
  "gamespot.com",
  "eurogamer.net",
  "videogameschronicle.com",
]

function normalizeText(input: NewsRelevanceInput) {
  return [input.title, input.excerpt, input.url, input.content]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeHeadlineText(input: NewsRelevanceInput) {
  return [input.title, input.excerpt, input.url]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

function countMatches(text: string, terms: string[]) {
  return terms.reduce((count, term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const pattern = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i")
    return pattern.test(text) ? count + 1 : count
  }, 0)
}

function isMobileFirstSource(url?: string | null) {
  if (!url) return false

  try {
    const host = new URL(url).hostname.replace(/^www\./, "")
    return MOBILE_FIRST_SOURCE_DOMAINS.some(
      (domain) => host === domain || host.endsWith(`.${domain}`)
    )
  } catch {
    return MOBILE_FIRST_SOURCE_DOMAINS.some((domain) =>
      url.toLowerCase().includes(domain)
    )
  }
}

function isPcConsoleFirstSource(url?: string | null) {
  if (!url) return false

  try {
    const host = new URL(url).hostname.replace(/^www\./, "")
    return PC_CONSOLE_FIRST_SOURCE_DOMAINS.some(
      (domain) => host === domain || host.endsWith(`.${domain}`)
    )
  } catch {
    return PC_CONSOLE_FIRST_SOURCE_DOMAINS.some((domain) =>
      url.toLowerCase().includes(domain)
    )
  }
}

function getUrlHostAndPath(url?: string | null) {
  if (!url) return null

  try {
    const parsed = new URL(url)
    return {
      host: parsed.hostname.replace(/^www\./, ""),
      path: parsed.pathname,
    }
  } catch {
    return null
  }
}

function isLikelyArticleUrl(url?: string | null) {
  const parsed = getUrlHostAndPath(url)
  if (!parsed) return false

  const { host, path } = parsed

  if (host === "4gamer.net" || host.endsWith(".4gamer.net")) {
    return /\/games\/\d+\/G\d+\/\d+\/?$/i.test(path)
  }

  if (host === "gematsu.com" || host.endsWith(".gematsu.com")) {
    return /^\/\d{4}\/\d{2}\//.test(path)
  }

  return /\/(news|article|articles|webzine)\//i.test(path)
}

function isLikelyDirectoryUrl(url?: string | null) {
  const parsed = getUrlHostAndPath(url)
  if (!parsed) return Boolean(url && NON_ARTICLE_URL_PATTERN.test(url))

  const { host, path } = parsed

  if (NON_ARTICLE_URL_PATTERN.test(path)) return true

  if ((host === "gematsu.com" || host.endsWith(".gematsu.com")) && DIRECTORY_GAME_URL_PATTERN.test(path)) {
    return true
  }

  if (DIRECTORY_GAME_URL_PATTERN.test(path) && !isLikelyArticleUrl(url)) {
    return true
  }

  return false
}

export function evaluateGameNewsRelevance(
  input: NewsRelevanceInput
): NewsRelevanceResult {
  const text = normalizeText(input)
  const headlineText = normalizeHeadlineText(input)
  if (!text) {
    return {
      allowed: false,
      reason: "missing_relevance_text",
      score: 0,
      action: "skip",
    }
  }

  const mobileMatches = countMatches(text, MOBILE_GAME_TERMS)
  const gameMatches = countMatches(text, GAME_SERVICE_TERMS)
  const crossPlatformMatches = countMatches(text, CROSS_PLATFORM_TERMS)
  const futurePlatformMatches = countMatches(text, FUTURE_PLATFORM_TERMS)
  const nonArticleMatches = countMatches(headlineText, NON_ARTICLE_TERMS)
  const lowNewsValueMatches = countMatches(headlineText, LOW_NEWS_VALUE_TERMS)
  const playerImpactMatches = countMatches(text, PLAYER_IMPACT_TERMS)
  const nonGameMatches = countMatches(text, NON_GAME_TERMS)
  const headlineMobileMatches = countMatches(headlineText, MOBILE_GAME_TERMS)
  const headlineGameMatches = countMatches(headlineText, GAME_SERVICE_TERMS)
  const headlineCrossPlatformMatches = countMatches(headlineText, CROSS_PLATFORM_TERMS)
  const headlineNonGameMatches = countMatches(headlineText, NON_GAME_TERMS)
  const sourceMobileBoost = isMobileFirstSource(input.url) ? 1 : 0
  const sourcePcConsoleBoost = isPcConsoleFirstSource(input.url) ? 1 : 0
  const score =
    (mobileMatches + sourceMobileBoost) * 3 +
    (futurePlatformMatches + sourcePcConsoleBoost) * 2 +
    gameMatches +
    crossPlatformMatches

  const likelyArticleUrl = isLikelyArticleUrl(input.url)
  const likelyDirectoryUrl = isLikelyDirectoryUrl(input.url)

  if (!likelyArticleUrl && (nonArticleMatches > 0 || likelyDirectoryUrl)) {
    return { allowed: false, reason: "non_article_page", score, action: "skip" }
  }

  if (lowNewsValueMatches > 0 && playerImpactMatches === 0) {
    return {
      allowed: false,
      reason: "low_news_value_guide_content",
      score,
      action: "skip",
    }
  }

  if (
    headlineNonGameMatches > 0 &&
    headlineMobileMatches === 0 &&
    headlineGameMatches === 0 &&
    headlineCrossPlatformMatches < 2
  ) {
    return {
      allowed: false,
      reason: "non_game_entertainment",
      score,
      action: "skip",
    }
  }

  if ((mobileMatches > 0 || sourceMobileBoost > 0) && gameMatches > 0) {
    return { allowed: true, reason: null, score, action: "allow" }
  }

  if (mobileMatches + sourceMobileBoost > 1) {
    return { allowed: true, reason: null, score, action: "allow" }
  }

  if (crossPlatformMatches >= 2 && gameMatches > 0) {
    return { allowed: true, reason: null, score, action: "allow" }
  }

  if (nonGameMatches > 0 && mobileMatches === 0 && gameMatches === 0) {
    return {
      allowed: false,
      reason: "non_game_entertainment",
      score,
      action: "skip",
    }
  }

  if ((futurePlatformMatches > 0 || sourcePcConsoleBoost > 0) && gameMatches > 0) {
    return {
      allowed: true,
      reason: "pc_console_game_news",
      score,
      action: "allow",
    }
  }

  return {
    allowed: false,
    reason: mobileMatches === 0 ? "missing_game_platform_signal" : "low_game_relevance",
    score,
    action: "skip",
  }
}

export const evaluateMobileGameNewsRelevance = evaluateGameNewsRelevance
