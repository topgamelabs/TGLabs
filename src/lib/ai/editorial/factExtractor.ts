import type { ArticleFacts, EditorialNewsItem, ResearchContext } from "./types"

function firstMatch(text: string, pattern: RegExp) {
  return text.match(pattern)?.[1]?.trim()
}

function listMatches(text: string, terms: string[]) {
  const lower = text.toLowerCase()
  return terms.filter((term) => lower.includes(term.toLowerCase()))
}

export function extractArticleFacts(
  item: EditorialNewsItem,
  research?: ResearchContext
): ArticleFacts {
  const text = [item.title, item.excerpt, item.content].filter(Boolean).join(" ")
  const gameName =
    firstMatch(item.title, /《([^》]+)》/u) ||
    firstMatch(item.title, /"([^"]+)"/u) ||
    item.title.split(/[!:|｜-]/)[0]?.trim() ||
    "Unknown game"
  const eventName =
    firstMatch(text, /(anniversary|collaboration|collab|pre-registration|pre-register|global launch|major update|limited banner)/i) ||
    ""
  const platforms = listMatches(text, [
    "iOS",
    "Android",
    "Google Play",
    "App Store",
    "PC",
    "Steam",
    "PlayStation",
    "Nintendo Switch",
  ])
  const rewards = listMatches(text, [
    "free pull",
    "free summon",
    "reward",
    "gem",
    "diamond",
    "code",
    "redeem",
  ])
  const releaseDate = firstMatch(
    text,
    /(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}\s+[A-Za-z]+\s+\d{4}|[A-Za-z]+\s+\d{1,2},\s+\d{4})/
  )
  const keyPoints = (research?.confirmed_facts || [])
    .concat(item.excerpt ? [item.excerpt] : [])
    .slice(0, 6)

  return {
    game_name: gameName,
    event_or_update_name: eventName,
    key_points: keyPoints,
    release_date: releaseDate,
    rewards,
    platforms,
    important_details: keyPoints.slice(0, 5),
  }
}

