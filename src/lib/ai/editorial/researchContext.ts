import type { EditorialNewsItem, EditorialScore, ResearchContext } from "./types"

function extractSentences(text: string, limit: number) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+|[。！？]\s*/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 20)
    .slice(0, limit)
}

export function buildResearchContext(
  item: EditorialNewsItem,
  score?: EditorialScore,
  options: { enableResearch?: boolean } = {}
): ResearchContext {
  const sourceText = [item.title, item.excerpt, item.content]
    .filter(Boolean)
    .join(" ")
  const confirmedFacts = extractSentences(sourceText, 8)
  const shouldAddContext =
    options.enableResearch === true && (score?.priority_score || 0) >= 70

  return {
    confirmed_facts: confirmedFacts,
    background_context: shouldAddContext
      ? [
          "Extra research is enabled, but no external source lookup is performed by this local module.",
        ]
      : [],
    player_relevance:
      score && score.priority_score >= 70
        ? "High-priority player-facing update."
        : "Use only confirmed source facts and avoid unsupported claims.",
    missing_information: confirmedFacts.length > 0 ? [] : ["source_content_details"],
    source_urls: [item.url],
  }
}

