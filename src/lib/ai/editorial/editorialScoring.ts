import type { EditorialNewsItem, EditorialScore, MobileGameDetection } from "./types"

const HIGH_PRIORITY_TERMS = [
  "anniversary",
  "collab",
  "collaboration",
  "controversy",
  "limited banner",
  "free pull",
  "free summon",
  "free reward",
  "reward",
  "pre-register",
  "pre-registration",
  "global launch",
  "shutdown",
  "redeem",
  "code",
  "major update",
  "new season",
  "official launch",
  "release date",
]

const LOW_PRIORITY_TERMS = [
  "best builds",
  "best progression",
  "beginner guide",
  "beginners guide",
  "build guide",
  "guide and tips",
  "how to",
  "maintenance",
  "minor patch",
  "reroll guide",
  "small update",
  "tier list",
  "tips and tricks",
  "walkthrough",
  "wallpaper",
  "merchandise",
  "goods",
]

function clampScore(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)))
}

function textFor(item: EditorialNewsItem) {
  return [item.title, item.excerpt, item.content, item.url]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

function metadataTextFor(item: EditorialNewsItem) {
  return [item.title, item.excerpt, item.url]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

export function scoreEditorialCandidate(
  item: EditorialNewsItem,
  detection: MobileGameDetection,
  options: { bypassLowPriorityReject?: boolean } = {}
): EditorialScore {
  const text = textFor(item)
  const metadataText = metadataTextFor(item)
  const highMatches = HIGH_PRIORITY_TERMS.filter((term) => text.includes(term))
  const lowMatches = LOW_PRIORITY_TERMS.filter((term) => metadataText.includes(term))
  const titleLength = item.title.trim().length
  const hasNamedGame = /《[^》]+》|[A-Z][A-Za-z0-9:' -]{2,}/.test(item.title)
  const seoScore = clampScore(35 + highMatches.length * 10 + (hasNamedGame ? 20 : 0))
  const engagementScore = clampScore(30 + highMatches.length * 12 - lowMatches.length * 12)
  const sourceQualityScore = item.content && item.content.length > 1200 ? 80 : 55
  const supportedGameNews = detection.is_mobile_game
  const isGuideLike = lowMatches.some((term) =>
    [
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
    ].includes(term)
  )
  const priorityScore = clampScore(
    detection.confidence * 45 + seoScore * 0.25 + engagementScore * 0.2 + sourceQualityScore * 0.1
  )
  const shouldWrite =
    supportedGameNews &&
    priorityScore >= 45 &&
    seoScore >= 40 &&
    titleLength > 8 &&
    (options.bypassLowPriorityReject ||
      (lowMatches.length < 2 && !(isGuideLike && highMatches.length === 0)))

  return {
    should_write: shouldWrite,
    priority_score: priorityScore,
    seo_score: seoScore,
    engagement_score: engagementScore,
    source_quality_score: sourceQualityScore,
    rejection_reason: shouldWrite ? undefined : supportedGameNews ? "low_editorial_priority" : "not_supported_game_news",
    decision_reason: shouldWrite
      ? `accepted:${highMatches.join(",") || "standard_game_news"}`
      : `rejected:${lowMatches.join(",") || "insufficient_game_seo_signal"}`,
  }
}
