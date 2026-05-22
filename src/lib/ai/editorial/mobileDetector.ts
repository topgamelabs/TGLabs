import { evaluateMobileGameNewsRelevance } from "@/lib/news/newsRelevance"
import type { EditorialNewsItem, MobileGameDetection } from "./types"

const PLATFORM_TERMS = [
  "android",
  "ios",
  "app store",
  "google play",
  "mobile",
  "smartphone",
  "cross-platform",
  "cross platform",
  "crossplay",
  "pc",
  "steam",
  "playstation",
  "ps5",
  "xbox",
  "switch",
  "console",
]

function joinedText(item: EditorialNewsItem) {
  return [item.title, item.excerpt, item.content, item.url]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

export function detectMobileGameNews(
  item: EditorialNewsItem
): MobileGameDetection {
  const relevance = evaluateMobileGameNewsRelevance({
    title: item.title,
    excerpt: item.excerpt,
    content: item.content,
    url: item.url,
  })
  const text = joinedText(item)
  const platformSignals = PLATFORM_TERMS.filter((term) => text.includes(term))
  const hasGacha = /gacha|summon|banner|reroll|free pull|pre-register/i.test(text)
  const hasMmorpg = /mmorpg|rpg|role-playing/i.test(text)
  const hasPcConsole = /pc|steam|playstation|ps5|xbox|switch|console/i.test(text)
  const gameType = hasGacha
    ? "gacha"
    : hasMmorpg
      ? "rpg"
      : hasPcConsole
        ? "pc_console"
        : "game_news"
  const confidence = relevance.allowed
    ? Math.min(0.98, 0.55 + relevance.score / 20)
    : Math.min(0.45, relevance.score / 20)

  return {
    is_mobile_game: relevance.allowed,
    confidence,
    platform_signals: platformSignals,
    game_type: gameType,
    reason: relevance.reason || "game_platform_signals_found",
  }
}
