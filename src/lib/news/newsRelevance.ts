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
  "battle pass",
  "beta test",
  "character",
  "event",
  "gameplay",
  "launch",
  "maintenance",
  "patch",
  "player",
  "pvp",
  "release",
  "roadmap",
  "rpg",
  "server",
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
  /\/(category|tag|tags|games|game|profiles?|awards?|database|wiki)(\/|$)/i

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

export function evaluateMobileGameNewsRelevance(
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
  const nonGameMatches = countMatches(text, NON_GAME_TERMS)
  const headlineMobileMatches = countMatches(headlineText, MOBILE_GAME_TERMS)
  const headlineGameMatches = countMatches(headlineText, GAME_SERVICE_TERMS)
  const headlineCrossPlatformMatches = countMatches(headlineText, CROSS_PLATFORM_TERMS)
  const headlineNonGameMatches = countMatches(headlineText, NON_GAME_TERMS)
  const score = mobileMatches * 3 + gameMatches + crossPlatformMatches

  if (
    nonArticleMatches > 0 ||
    (input.url && NON_ARTICLE_URL_PATTERN.test(input.url))
  ) {
    return { allowed: false, reason: "non_article_page", score, action: "skip" }
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

  if (mobileMatches > 0 && gameMatches > 0) {
    return { allowed: true, reason: null, score, action: "allow" }
  }

  if (mobileMatches > 1) {
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

  if (futurePlatformMatches > 0 && gameMatches > 0) {
    return {
      allowed: false,
      reason: "future_platform_news_pending",
      score,
      action: "defer",
    }
  }

  return {
    allowed: false,
    reason: mobileMatches === 0 ? "missing_mobile_or_cross_platform_signal" : "low_game_relevance",
    score,
    action: "skip",
  }
}
