export type ArticleBlock =
  | { type: "paragraph"; content: string }
  | { type: "heading"; level: 2; content: string }
  | { type: "bullet"; items: string[] }
  | { type: "quote"; content: string }
  | { type: "rule"; label?: string }
  | { type: "image"; imageUrl: string; imageCaption?: string }
  | {
      type: "ptag"
      tagType: "buff" | "nerf" | "new" | "event" | "fix"
      tagLabel: string
    }

export interface ArticleBlockMetrics {
  text: string
  textLength: number
  paragraphs: number
  headings: number
  quotes: number
  bullets: number
}

const ALLOWED_TYPES = new Set([
  "paragraph",
  "heading",
  "bullet",
  "quote",
  "rule",
  "image",
  "ptag",
])

const ALLOWED_TAG_TYPES = new Set(["buff", "nerf", "new", "event", "fix"])
type PTagType = "buff" | "nerf" | "new" | "event" | "fix"
const EMOJI_PATTERN = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ")
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : ""
}

export function extractBlocksText(blocks: ArticleBlock[]) {
  return blocks
    .flatMap((block) => {
      if (block.type === "bullet") return block.items
      if ("content" in block && block.content) return [block.content]
      if (block.type === "image") return [block.imageCaption || ""]
      if (block.type === "ptag") return [block.tagLabel]
      if (block.type === "rule") return [block.label || ""]
      return []
    })
    .map(stripHtml)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
}

export function getArticleBlockMetrics(blocks: ArticleBlock[]): ArticleBlockMetrics {
  const text = extractBlocksText(blocks)

  return {
    text,
    textLength: text.length,
    paragraphs: blocks.filter((block) => block.type === "paragraph").length,
    headings: blocks.filter((block) => block.type === "heading").length,
    quotes: blocks.filter((block) => block.type === "quote").length,
    bullets: blocks.filter((block) => block.type === "bullet").length,
  }
}

export function parseArticleBlocks(value: unknown): ArticleBlock[] {
  const blocks = Array.isArray(value)
    ? value
    : value && typeof value === "object" && Array.isArray((value as { blocks?: unknown }).blocks)
      ? (value as { blocks: unknown[] }).blocks
      : null

  if (!blocks) {
    throw new Error("AI_REWRITE_BLOCKS_NOT_ARRAY")
  }

  return blocks.map((rawBlock, index) => {
    if (!rawBlock || typeof rawBlock !== "object") {
      throw new Error(`AI_REWRITE_BAD_BLOCK_${index}`)
    }

    const block = rawBlock as Record<string, unknown>
    const type = cleanText(block.type)

    if (!ALLOWED_TYPES.has(type)) {
      throw new Error(`AI_REWRITE_UNSUPPORTED_BLOCK_${type || index}`)
    }

    if (type === "paragraph") {
      const content = cleanText(block.content)
      if (!content) throw new Error("AI_REWRITE_EMPTY_PARAGRAPH")
      if (EMOJI_PATTERN.test(content)) throw new Error("AI_REWRITE_EMOJI_NOT_ALLOWED")
      return { type, content }
    }

    if (type === "heading") {
      const content = cleanText(block.content)
      if (!content) throw new Error("AI_REWRITE_EMPTY_HEADING")
      if (EMOJI_PATTERN.test(content)) throw new Error("AI_REWRITE_EMOJI_NOT_ALLOWED")
      return { type, level: 2, content }
    }

    if (type === "bullet") {
      const items = Array.isArray(block.items)
        ? block.items.map(cleanText).filter(Boolean)
        : []
      if (items.length === 0) throw new Error("AI_REWRITE_EMPTY_BULLET")
      if (items.some((item) => EMOJI_PATTERN.test(item))) {
        throw new Error("AI_REWRITE_EMOJI_NOT_ALLOWED")
      }
      return { type, items }
    }

    if (type === "quote") {
      const content = cleanText(block.content)
      if (!content) throw new Error("AI_REWRITE_EMPTY_QUOTE")
      if (EMOJI_PATTERN.test(content)) throw new Error("AI_REWRITE_EMOJI_NOT_ALLOWED")
      return { type, content }
    }

    if (type === "rule") {
      const label = cleanText(block.label)
      return label ? { type, label } : { type }
    }

    if (type === "image") {
      const imageUrl = cleanText(block.imageUrl)
      if (!imageUrl) throw new Error("AI_REWRITE_EMPTY_IMAGE_URL")
      try {
        new URL(imageUrl)
      } catch {
        throw new Error("AI_REWRITE_BAD_IMAGE_URL")
      }
      const imageCaption = cleanText(block.imageCaption)
      return imageCaption ? { type, imageUrl, imageCaption } : { type, imageUrl }
    }

    const tagType = cleanText(block.tagType)
    const tagLabel = cleanText(block.tagLabel)
    if (!ALLOWED_TAG_TYPES.has(tagType)) {
      throw new Error("AI_REWRITE_BAD_PTAG_TYPE")
    }
    if (!tagLabel) throw new Error("AI_REWRITE_EMPTY_PTAG")
    return {
      type: "ptag",
      tagType: tagType as PTagType,
      tagLabel,
    }
  })
}

export function serializeArticleBlocks(blocks: ArticleBlock[]) {
  return JSON.stringify(blocks)
}
