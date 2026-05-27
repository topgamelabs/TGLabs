import * as cheerio from "cheerio"
import { requireEnv } from "@/lib/env"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import {
  buildResearchContext,
  detectMobileGameNews,
  extractArticleFacts,
  logEditorialDecision,
  scoreEditorialCandidate,
  type ArticleFacts,
  type EditorialScore,
  type ResearchContext,
} from "@/lib/ai/editorial"
import {
  cleanupNonRewriteablePendingQueue,
  cleanupRejectedPendingRewriteQueue,
  cleanupStalePendingRewriteQueue,
  getOpenClawCandidates,
  type OpenClawCandidate,
} from "./openClawCandidates"
import { normalizeTitle } from "./newsIdentity"
import {
  buildArticleSlug,
  normalizeArticleSlug,
  saveArticleDraft,
  type ArticleCategory,
  type ArticleDraft,
} from "./saveArticle"
import {
  getArticleBlockMetrics,
  parseArticleBlocks,
  serializeArticleBlocks,
  type ArticleBlock,
} from "./articleBlocks"
import {
  findPossibleDuplicateCandidates,
  type PossibleDuplicateCandidate,
} from "./duplicateCandidates"
import {
  categoryForGameProfile,
  formatGameProfileContext,
  resolveGameProfile,
  type GameProfile,
} from "./gameProfiles"

const DEFAULT_REWRITE_LIMIT = 3
const MAX_REWRITE_LIMIT = 10
const DEFAULT_AI_ATTEMPTS = 2
const MAX_SOURCE_TEXT_LENGTH = 20000
const OPENAI_REWRITE_PROVIDER = "openai"
const DEFAULT_OPENAI_REWRITE_MODEL = "gpt-4o"
const DEFAULT_OPENAI_CLASSIFIER_MODEL = "gpt-4o-mini"
const STALE_PROCESSING_MINUTES = 30
const MIN_FINAL_ARTICLE_TEXT_LENGTH = 1000
const MIN_FINAL_PARAGRAPH_BLOCKS = 4
const MIN_FINAL_CONTENT_BLOCKS = 5
const DISALLOWED_FOREIGN_SCRIPT_PATTERN = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u
const DANGEROUS_AI_HTML_PATTERN = /<\/?(script|style|iframe|object|embed|svg|math)\b/i

type ClassificationDecision =
  | "mobile_game"
  | "cross_platform_game"
  | "pc_console_game"
  | "reject"

type RewrittenArticle = ArticleDraft & {
  blocks: ArticleBlock[]
}

interface ExistingArticleTitle {
  id: string
  title: string | null
  seo_title: string | null
  source_url: string | null
}

interface DuplicateCheckResult {
  articleId: string
  reason: string
  matchedField: "source_url" | "title" | "seo_title"
}

interface NewsClassification {
  decision: ClassificationDecision
  reason: string
  confidence: number
}

interface RewriteContext {
  score?: EditorialScore
  research?: ResearchContext
  facts?: ArticleFacts
  gameProfile?: GameProfile | null
  additionalSources?: AdditionalSourceContext[]
}

interface AdditionalSourceContext {
  queueId: string
  sourceUrl: string
  sourceDomain: string | null
  title: string | null
  excerpt: string | null
  publishedAt: string | null
  similarity: number
  reason: string
  sourceText: string
}

export interface RewriteCandidatesResult {
  dryRun: boolean
  provider: typeof OPENAI_REWRITE_PROVIDER
  model: string
  classifierModel: string
  processed: number
  published: number
  drafted: number
  skippedDuplicate: number
  skippedIrrelevant: number
  skippedLowPriority: number
  failed: number
  recoveredStale: number
  cleanedStalePending: number
  cleanedRejectedPending: number
  cleanedNonRewriteablePending: number
  skippedClaimed: number
  articles: Array<{
    queueId: string
    articleId: string
    slug: string
    title: string
    status: string
    isPublished: boolean
  }>
  failures: Array<{
    queueId: string
    sourceUrl: string
    reason: string
  }>
  duplicates: Array<{
    queueId: string
    sourceUrl: string
    reason: string
  }>
}

export interface RewriteCandidatesOptions {
  limit?: number
  dryRun?: boolean
  publish?: boolean
  maxAttempts?: number
  queueId?: string
  manual?: boolean
  force?: boolean
}

function resolveLimit(limit: number | undefined) {
  if (!Number.isFinite(limit)) return DEFAULT_REWRITE_LIMIT
  return Math.min(Math.max(Math.floor(limit || DEFAULT_REWRITE_LIMIT), 1), MAX_REWRITE_LIMIT)
}

function resolveAttempts(maxAttempts: number | undefined) {
  if (!Number.isFinite(maxAttempts)) return DEFAULT_AI_ATTEMPTS
  return Math.min(Math.max(Math.floor(maxAttempts || DEFAULT_AI_ATTEMPTS), 1), 3)
}

function extractSourceText(html: string) {
  const $ = cheerio.load(html)
  $("script,style,noscript,svg,iframe,form,nav,footer,header,aside").remove()

  const articleText =
    $("article").text() ||
    $("main").text() ||
    $("body").text() ||
    $.root().text()

  return articleText.replace(/\s+/g, " ").trim().slice(0, MAX_SOURCE_TEXT_LENGTH)
}

function buildEditorialContextBlock(options: RewriteContext) {
  const { score, research, facts, gameProfile, additionalSources } = options

  return `
Editorial scoring:
${score ? JSON.stringify(score, null, 2) : "not available"}

Confirmed facts and context:
${research ? JSON.stringify(research, null, 2) : "not available"}

Extracted article facts:
${facts ? JSON.stringify(facts, null, 2) : "not available"}

Known game profile from database:
${formatGameProfileContext(gameProfile)}

Additional source articles merged into this rewrite:
${additionalSources?.length ? JSON.stringify(
  additionalSources.map((source) => ({
    queueId: source.queueId,
    sourceUrl: source.sourceUrl,
    sourceDomain: source.sourceDomain,
    title: source.title,
    excerpt: source.excerpt,
    publishedAt: source.publishedAt,
    similarity: source.similarity,
    reason: source.reason,
    sourceText: source.sourceText.slice(0, 6000),
  })),
  null,
  2
) : "none"}
`.trim()
}

function buildDraftArticlePrompt(
  candidate: OpenClawCandidate,
  sourceText: string
) {
  return `
You are a professional Thai gaming news editor for TopGame Thailand.

Use the source only as a fact sheet.
Write a completely new Thai editorial news article from scratch.

Do not:
- translate paragraph-by-paragraph
- mirror the source structure
- mirror the source wording
- copy the source tone

Keep factual claims conservative.
If information is not clearly confirmed in the source, do not invent it.

[Writing Style]

- Write like a real Thai gaming news website
- Natural Thai language
- Short, clean, readable sentences
- Informative, not promotional
- Avoid marketing language and exaggerated tone
- Do not write like Facebook engagement bait
- Avoid unnecessary hype
- Keep official English game titles in English. Do not translate or spell them phonetically in Thai.
- Do not open with generic attention/interest language. Lead with the actual news angle.

[Avoid words/styles like]

- "กระแสแรง"
- "เดือด"
- "จัดเต็ม"
- "สุดปัง"
- "เขย่าวงการ"
- "หลายคนมองว่า"

unless directly supported by evidence.

[Structure]

1. Hook
- Open with an interesting angle or key detail
- Do not begin with date/time/location

2. Body
- Use short paragraphs
- Add subheadings when appropriate
- Use bullet points for features or systems

3. Ending
- End naturally
- Optional soft discussion question

[Source URL]
${candidate.source_url}

Write the article first. Do not output JSON.
Use Markdown only for the article draft:
- Start with a single H1 title.
- Use H2 subheadings when they improve readability.
- Use bullet points only when the source has feature/system details that fit bullets.
- A normal result should feel like a complete news article, not a summary.
- When the source has enough information, aim for 6-10 short paragraphs and 3-4 H2 sections.
- Keep the ending natural and avoid a forced conclusion.
- If additional source articles are provided in the editorial context, merge their confirmed facts into this one article.
- Do not write separate articles for each source.
- Prefer facts that appear in multiple sources, but include useful source-specific details when they do not conflict.
- If sources conflict, use the more concrete/official detail or avoid the disputed claim.
- Mention only facts supported by at least one provided source.

Source title: ${candidate.raw_title || ""}
Source excerpt: ${candidate.raw_excerpt || ""}
Source published time: ${candidate.published_source_at || "unknown"}
Freshness reference time: ${candidate.effective_published_at}

Source text:
"""
${sourceText}
"""
`.trim()
}

function buildPackagingPrompt(
  candidate: OpenClawCandidate,
  articleDraft: string,
  context: RewriteContext = {}
) {
  return `
You are formatting an already-written Thai gaming news article for TopGame Thailand.

Do not rewrite the article from scratch.
Preserve the draft's title, structure, paragraph flow, subheadings, bullets, and editorial angle.
Only convert it into the JSON shape required by the website.

Return valid JSON only, no markdown fences.

Technical output requirements:
- The article content must be represented in blocks.
- Use paragraph and heading blocks as the main format.
- Convert Markdown H2 headings into heading blocks with level 2.
- Convert Markdown bullet lists into bullet blocks.
- Convert Markdown blockquotes into quote blocks.
- Use quote, rule, image, or ptag blocks only when genuinely present or clearly useful.
- Do not output raw markdown or HTML.
- Do not include a "content" string field.
- slug must be English only, lowercase, using a-z, 0-9, and hyphens.
- category must be one of: mobile, pc-console, gaming, review, tips, tech, tournament, live.
- Use only Thai and English in title, excerpt, blocks, SEO fields, and slug.
- If the draft contains Chinese, Japanese, Korean, or other non-Thai/non-English text, translate or romanize it into English.
- Never output Chinese, Japanese, or Korean characters anywhere.

Required JSON shape:
{
  "title": "Thai headline",
  "slug": "english-seo-url-slug",
  "excerpt": "1-2 sentence Thai summary",
  "seo_title": "SEO title",
  "seo_description": "SEO description",
  "category": "gaming",
  "blocks": [
    { "type": "paragraph", "content": "intro paragraph" },
    { "type": "heading", "level": 2, "content": "H2 section title" },
    { "type": "paragraph", "content": "next paragraph" },
    { "type": "bullet", "items": ["feature one", "feature two"] }
  ]
}

Source URL: ${candidate.source_url}

${buildEditorialContextBlock(context)}

Article draft to convert:
"""
${articleDraft}
"""
`.trim()
}

function buildGameInfoSectionPrompt(
  candidate: OpenClawCandidate,
  sourceText: string,
  context: RewriteContext = {}
) {
  return `
You are a Thai gaming news editor preparing only the final game information section for a TopGame Thailand article.

Return only the game information section. Do not return the news article.

Rules:
- Use the heading "รายละเอียดทั่วไปของเกม" for the section.
- This section is separate from the news story. Think of it as a compact reference box in article form.
- Include only clearly confirmed details from the source, source URL, title, excerpt, extracted facts, and known game profile.
- If a known game profile is available from the database, treat it as trusted reference data and use it before guessing from the source.
- Prefer database game profile fields for title, platform, genre, developer, publisher, official website, store pages, and social links.
- Use source details only to supplement article-specific status such as release window, test region, or event details.
- Do not invent unknown details.
- If a detail is not confirmed, omit that bullet entirely.
- Never write "ไม่ระบุ", "unknown", "N/A", or similar placeholders.
- Keep official English game titles in English.
- For "ชื่อเกม", use the actual game title, not the article title.
- If adding a source URL, include the full source URL exactly.
- Write in natural Thai.
- Return Markdown only.
- Start with exactly one H2 heading.
- Prefer a concise bullet list.
- Do not return JSON.

Useful details to include when confirmed:
- Game title
- Developer or publisher
- Genre or gameplay style
- Platform
- Current launch status or test region
- Release window
- Official source URL if useful

Source URL: ${candidate.source_url}
Source title: ${candidate.raw_title || ""}
Source excerpt: ${candidate.raw_excerpt || ""}
Source published time: ${candidate.published_source_at || "unknown"}

${buildEditorialContextBlock(context)}

Source text:
"""
${sourceText.slice(0, 10000)}
"""
`.trim()
}

function buildOpinionOnlyPrompt(
  candidate: OpenClawCandidate,
  sourceText: string,
  context: RewriteContext = {}
) {
  return `
You are a Thai gaming news editor writing only a short human opinion note for a finished TopGame Thailand article.

Return only one Markdown blockquote. Do not return the news article.

Rules:
- The opinion must be a Markdown blockquote, starting with "> ".
- Do not add a heading for this opinion section.
- Write like the site writer is casually adding a short personal feeling.
- Keep it natural, warm, and human. It should not sound like formal analysis.
- Maximum 500 Thai/English characters.
- It may be lightly speculative or expressive, but must not invent concrete facts.
- Do not mention "ทีมงาน", "ผู้เขียน", or "ความเห็น".
- Keep official English game titles in English.
- Do not return JSON.

Example tone:
> การกลับมาครั้งนี้น่าสนใจมาก มาดูกันว่าจะทำให้ผู้เล่นสนใจได้มากขนาดไหน

> เป็นเกมที่มี IP ระดับตำนาน กลับมาเปิดให้เล่นในรูปแบบใหม่แบบนี้ รอติดตามเลย

Source URL: ${candidate.source_url}
Source title: ${candidate.raw_title || ""}
Source excerpt: ${candidate.raw_excerpt || ""}

${buildEditorialContextBlock(context)}

Source text:
"""
${sourceText.slice(0, 6000)}
"""
`.trim()
}

function normalizeMarkdownSection(value: string) {
  return value.replace(/```(?:markdown)?|```/gi, "").trim()
}

function appendMarkdownSection(articleDraft: string, section: string) {
  const cleanArticle = articleDraft.trim()
  const cleanSection = normalizeMarkdownSection(section)

  if (!cleanSection) return cleanArticle

  return `${cleanArticle}\n\n${cleanSection}`.trim()
}

function normalizeOpinionBlock(value: string) {
  const clean = normalizeMarkdownSection(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/^>\s*/, "")
    .trim()
    .slice(0, 500)

  if (!clean) {
    throw new Error("AI_OPINION_EMPTY")
  }

  return `> ${clean}`
}

function markdownTextLength(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/\[[^\]]+\]\([^)]+\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim().length
}

function validateMarkdownRetention(
  stage: string,
  previousArticle: string,
  nextArticle: string
) {
  const previousLength = markdownTextLength(previousArticle)
  const nextLength = markdownTextLength(nextArticle)

  if (previousLength >= 800 && nextLength < Math.floor(previousLength * 0.8)) {
    throw new Error(`${stage}_DROPPED_ARTICLE_BODY`)
  }
}

function validateFinalArticleQuality(article: RewrittenArticle) {
  const metrics = getArticleBlockMetrics(article.blocks)
  const contentBlocks = article.blocks.filter((block) =>
    ["paragraph", "heading", "bullet"].includes(block.type)
  )
  const firstContentBlock = article.blocks.find((block) => block.type !== "rule")

  if (metrics.textLength < MIN_FINAL_ARTICLE_TEXT_LENGTH) {
    throw new Error("AI_REWRITE_ARTICLE_TOO_SHORT")
  }

  if (metrics.paragraphs < MIN_FINAL_PARAGRAPH_BLOCKS) {
    throw new Error("AI_REWRITE_TOO_FEW_PARAGRAPHS")
  }

  if (contentBlocks.length < MIN_FINAL_CONTENT_BLOCKS) {
    throw new Error("AI_REWRITE_TOO_FEW_CONTENT_BLOCKS")
  }

  if (firstContentBlock?.type === "quote") {
    throw new Error("AI_REWRITE_QUOTE_ONLY_OR_QUOTE_FIRST")
  }

  if (metrics.quotes > 0) {
    const lastTextBlockIndex = article.blocks
      .map((block, index) => ("content" in block || block.type === "bullet" ? index : -1))
      .filter((index) => index >= 0)
      .pop()
    const lastQuoteIndex = article.blocks
      .map((block, index) => (block.type === "quote" ? index : -1))
      .filter((index) => index >= 0)
      .pop()

    if (
      typeof lastTextBlockIndex === "number" &&
      typeof lastQuoteIndex === "number" &&
      lastQuoteIndex < lastTextBlockIndex
    ) {
      throw new Error("AI_REWRITE_OPINION_QUOTE_NOT_LAST")
    }
  }
}

function buildRepairPrompt(
  candidate: OpenClawCandidate,
  articleDraft: string,
  previousError: string,
  context: RewriteContext = {}
) {
  return `
You are repairing a Thai gaming news rewrite that failed validation.

Previous validation error: ${previousError}

Repair the article so it passes validation while preserving the same editorial
brief and natural Thai gaming-news reading flow. Do not make it longer only to
hit a length target. Do not turn the article into a rigid template.

Return a fresh valid JSON object only, no markdown fences.

Required JSON shape:
{
  "title": "Thai headline",
  "slug": "english-seo-url-slug",
  "excerpt": "1-2 sentence Thai summary",
  "seo_title": "SEO title",
  "seo_description": "SEO description",
  "category": "gaming",
  "blocks": [
    { "type": "paragraph", "content": "short intro paragraph" },
    { "type": "heading", "level": 2, "content": "H2 section title" },
    { "type": "paragraph", "content": "next paragraph" }
  ]
}

Repair rules:
- Write in Thai, with only Thai and English characters.
- Return JSON Blocks only. Do not output HTML strings.
- Preserve the article draft's editorial angle and structure.
- Use paragraph and heading as the core blocks.
- Preserve any final Markdown blockquote as a quote block.
- Use bullet, quote, rule, image, and ptag only when genuinely useful.
- Fix the validation problem without forcing length, filler, or a fixed block plan.
- Treat the source as a fact sheet and write a new Thai editorial article from scratch.
- Do not translate paragraph-by-paragraph, mirror the source structure, mirror the source wording, copy the source tone, or preserve the original sentence order.
- Reorder information for Thai gaming readers and lead with player impact.
- Do not fabricate facts. Use only source facts and confirmed editorial context for factual claims.
- You may explain why a confirmed fact matters to players, but keep interpretation clearly separate from fact.
- Never output Chinese, Japanese, or Korean characters anywhere.
- Translate or romanize all non-Thai/non-English names.
- Keep the story flow: hook intro, main news details, subheaded sections when appropriate, and natural ending.
- The hook must not begin with date, time, or location.
- Do not force a quote block, bullet block, rule block, image block, or ptag block if it would make the article feel templated.
- Do not use emoji in article blocks.
- Do not use clickbait or overclaim.
- Do not use these phrases unless directly supported by evidence: "กระแสแรง", "เดือด", "จัดเต็ม", "สุดปัง", "เขย่าวงการ", "หลายคนมองว่า".
- Preserve source details such as platforms, release window, rewards, campaign details, official links, and developer/publisher when present.
- Do not add filler or a generic conclusion.
- slug must be English only, lowercase, using a-z, 0-9, and hyphens.
- category must be one of: mobile, pc-console, gaming, review, tips, tech, tournament, live.

Source URL: ${candidate.source_url}

${buildEditorialContextBlock(context)}

Article draft:
"""
${articleDraft}
"""
`.trim()
}

function buildClassificationPrompt(candidate: OpenClawCandidate, sourceText: string) {
  return `
You are a strict news classifier for TopGame Thailand.

Classify whether this source should be rewritten for a Thai gaming news site
that covers mobile, cross-platform, PC, and console games.

Return valid JSON only, no markdown fences.

Required JSON shape:
{
  "decision": "mobile_game | cross_platform_game | pc_console_game | reject",
  "reason": "short reason",
  "confidence": 0.0
}

Decision rules:
- mobile_game: clearly about a mobile game, gacha game, mobile MMORPG, iOS/Android launch, mobile update, mobile event, mobile pre-registration, mobile redeem code, or mobile game service.
- cross_platform_game: clearly about a game available across mobile plus PC/console, or a game service where mobile support is explicitly present in the article body/title.
- pc_console_game: clearly about a PC or console game, launch, update, event, patch, major sale, controversy, shutdown, or player-relevant game service.
- reject: anime, manga, movie, music, merchandise, general entertainment, hardware, or unclear topics.
- reject: anime-only, manga-only, movie-only, trailer/PV-only, voice actor/event, anniversary, figure, goods, or merchandise stories unless the actual article is clearly about a playable game launch/update/event/shutdown.
- reject: hardware, GPU/CPU, driver, benchmark, monitor, keyboard, mouse, or device stories unless the article is clearly about a player-impacting game update/service.
- reject: game profile pages, category pages, tag pages, directory pages, sales chart pages, and pages that are not a specific news article.
- If the article only mentions a game platform in site chrome/navigation/ads, reject it.
- If game relevance is not clear from the actual article body, reject it.
- Classify by the source title, excerpt, and article body only.
- Do not classify as mobile_game or cross_platform_game solely because the publisher/source website focuses on mobile games.
- Do not use words in the domain name, URL slug, site navigation, breadcrumbs, ads, related links, or footer as platform evidence.
- If a story says "multiple platforms" but does not clearly confirm iOS, Android, mobile, App Store, Google Play, or smartphone support, classify it as pc_console_game when PC/console platforms are present.

Source title: ${candidate.raw_title || ""}
Source excerpt: ${candidate.raw_excerpt || ""}
Source published time: ${candidate.published_source_at || "unknown"}
Freshness reference time: ${candidate.effective_published_at}

Source text:
"""
${sourceText.slice(0, 8000)}
"""
`.trim()
}

function parseJsonObject(text: string) {
  const trimmed = text.replace(/```json|```/g, "").trim()
  const start = trimmed.indexOf("{")
  const end = trimmed.lastIndexOf("}")

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI_JSON_NOT_FOUND")
  }

  return JSON.parse(trimmed.slice(start, end + 1))
}

function validateClassification(value: unknown): NewsClassification {
  const data = value as Partial<NewsClassification>
  const decision = data.decision || "reject"

  if (
    !["mobile_game", "cross_platform_game", "pc_console_game", "reject"].includes(
      decision
    )
  ) {
    throw new Error("AI_CLASSIFICATION_BAD_DECISION")
  }

  return {
    decision: decision as ClassificationDecision,
    reason: (data.reason || "classified_by_ai").trim().slice(0, 500),
    confidence:
      typeof data.confidence === "number" && Number.isFinite(data.confidence)
        ? Math.min(Math.max(data.confidence, 0), 1)
        : 0,
  }
}

function hasDisallowedForeignScript(value: string) {
  return DISALLOWED_FOREIGN_SCRIPT_PATTERN.test(value)
}

function hasValidEnglishSlug(value: string | null | undefined) {
  return Boolean(value && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))
}

function hasDangerousHtml(value: string) {
  return DANGEROUS_AI_HTML_PATTERN.test(value)
}

function validateRewrite(value: unknown): RewrittenArticle {
  const data = value as Partial<ArticleDraft> & { blocks?: unknown }
  const category = data.category || "gaming"
  const allowedCategories: ArticleCategory[] = [
    "gaming",
    "mobile",
    "pc-console",
    "tips",
    "review",
    "tech",
    "tournament",
    "live",
  ]

  if (!data.title || !data.excerpt || !data.blocks) {
    throw new Error("AI_REWRITE_INCOMPLETE")
  }

  const blocks = parseArticleBlocks(data.blocks)
  const serializedContent = serializeArticleBlocks(blocks)

  const languageCheckFields = [
    data.title,
    data.excerpt,
    serializedContent,
    data.seo_title,
    data.seo_description,
  ]

  if (
    languageCheckFields.some(
      (field) => field && hasDisallowedForeignScript(field)
    )
  ) {
    throw new Error("AI_REWRITE_UNTRANSLATED_FOREIGN_TEXT")
  }

  if (languageCheckFields.some((field) => field && hasDangerousHtml(field))) {
    throw new Error("AI_REWRITE_UNSAFE_HTML")
  }

  const normalizedSlug = normalizeArticleSlug(data.slug || data.seo_title || data.title)
  if (!hasValidEnglishSlug(normalizedSlug)) {
    throw new Error("AI_REWRITE_BAD_SLUG")
  }

  const article = {
    title: data.title.trim(),
    slug: normalizedSlug || undefined,
    excerpt: data.excerpt.trim(),
    content: serializedContent,
    seo_title: (data.seo_title || data.title).trim(),
    seo_description: (data.seo_description || data.excerpt).trim(),
    category: allowedCategories.includes(category) ? category : "gaming",
    blocks,
  }

  validateFinalArticleQuality(article)

  return article
}

function categoryForClassification(
  classification: NewsClassification
): ArticleCategory {
  if (classification.decision === "pc_console_game") return "pc-console"
  if (classification.decision === "mobile_game") return "mobile"
  if (classification.decision === "cross_platform_game") return "mobile"
  return "gaming"
}

function applyClassifiedCategory(
  article: RewrittenArticle,
  classification: NewsClassification,
  gameProfile?: GameProfile | null
): RewrittenArticle {
  return {
    ...article,
    category: categoryForGameProfile(gameProfile) || categoryForClassification(classification),
    game_id: gameProfile?.id || article.game_id || null,
  }
}

function cleanFinalGameInfoBlocks(
  article: RewrittenArticle,
  candidate: OpenClawCandidate
): RewrittenArticle {
  let insideGameInfo = false
  let changed = false

  const blocks = article.blocks.map((block) => {
    if (block.type === "heading") {
      insideGameInfo = block.content.trim() === "รายละเอียดทั่วไปของเกม"
      return block
    }

    if (!insideGameInfo || block.type !== "bullet") {
      return block
    }

    const items = block.items
      .filter((item) => {
        const shouldRemove =
          /ไม่(?:ได้)?ระบุ|unknown|n\/a|not specified/i.test(item)
        if (shouldRemove) changed = true
        return !shouldRemove
      })
      .map((item) => {
        if (
          /^(URL\s*)?(แหล่งข้อมูล|แหล่งที่มา|source)\s*:/i.test(item) &&
          !/^.*https?:\/\//i.test(item)
        ) {
          changed = true
          return `แหล่งข้อมูล: ${candidate.source_url}`
        }

        return item
      })

    if (items.length !== block.items.length) {
      changed = true
    }

    return { ...block, items }
  })

  if (!changed) return article

  return {
    ...article,
    blocks,
    content: serializeArticleBlocks(blocks),
  }
}

async function requestOpenAiJson(
  apiKey: string,
  prompt: string,
  options: {
    model: string
    temperature: number
    timeoutMs: number
    errorPrefix: string
  }
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs)

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        temperature: options.temperature,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`${options.errorPrefix}_HTTP_${response.status}: ${await response.text()}`)
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ""

    return parseJsonObject(text)
  } finally {
    clearTimeout(timeout)
  }
}

async function requestOpenAiText(
  apiKey: string,
  prompt: string,
  options: {
    model: string
    temperature: number
    timeoutMs: number
    errorPrefix: string
  }
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs)

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        temperature: options.temperature,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`${options.errorPrefix}_HTTP_${response.status}: ${await response.text()}`)
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ""

    if (!text.trim()) {
      throw new Error(`${options.errorPrefix}_EMPTY_RESPONSE`)
    }

    return text.trim()
  } finally {
    clearTimeout(timeout)
  }
}

async function classifyCandidate(
  apiKey: string,
  candidate: OpenClawCandidate,
  sourceText: string
) {
  const model =
    process.env.OPENAI_CLASSIFIER_MODEL || DEFAULT_OPENAI_CLASSIFIER_MODEL
  const raw = await requestOpenAiJson(
    apiKey,
    buildClassificationPrompt(candidate, sourceText),
    {
      model,
      temperature: 0,
      timeoutMs: 30000,
      errorPrefix: "AI_CLASSIFIER",
    }
  )

  return validateClassification(raw)
}

async function generateRewrite(
  apiKey: string,
  candidate: OpenClawCandidate,
  sourceText: string,
  repairReason?: string,
  context: RewriteContext = {}
) {
  const articleDraft = await requestDraftArticle(apiKey, candidate, sourceText)
  const articleWithGameInfo = await requestArticleWithGameInfo(
    apiKey,
    candidate,
    articleDraft,
    sourceText,
    context
  )
  const articleWithOpinion = await requestArticleWithOpinion(
    apiKey,
    candidate,
    articleWithGameInfo,
    sourceText,
    context
  )
  const prompt = repairReason
    ? buildRepairPrompt(candidate, articleWithOpinion, repairReason, context)
    : buildPackagingPrompt(candidate, articleWithOpinion, context)

  return requestRewrite(apiKey, prompt, candidate)
}

function getRewriteSourceText(candidate: OpenClawCandidate) {
  const apiKey = requireEnv("OPENAI_API_KEY")
  const sourceText = extractSourceText(candidate.raw_content)

  if (sourceText.length < 500) {
    throw new Error("SOURCE_TEXT_TOO_SHORT")
  }

  return { apiKey, sourceText }
}

function buildAdditionalSourceContexts(
  candidates: PossibleDuplicateCandidate[]
): AdditionalSourceContext[] {
  return candidates
    .map((candidate) => {
      const sourceText = candidate.raw_content
        ? extractSourceText(candidate.raw_content)
        : ""

      return {
        queueId: candidate.id,
        sourceUrl: candidate.source_url || "",
        sourceDomain: candidate.source_domain || null,
        title: candidate.raw_title || null,
        excerpt: candidate.raw_excerpt || null,
        publishedAt: candidate.published_source_at || null,
        similarity: candidate.similarity,
        reason: candidate.reason,
        sourceText,
      }
    })
    .filter((source) => source.sourceUrl && source.sourceText.length >= 500)
}

async function markMergedDuplicates(
  primaryQueueId: string,
  articleId: string,
  duplicates: AdditionalSourceContext[]
) {
  for (const duplicate of duplicates) {
    const { error } = await supabaseAdmin
      .from("raw_news_queue")
      .update({
        extraction_status: "skipped",
        rewrite_status: "duplicate",
        rewrite_error: `merged_into:${primaryQueueId}:${articleId}`,
        rewrite_finished_at: new Date().toISOString(),
        rewritten_article_id: articleId,
      })
      .eq("id", duplicate.queueId)
      .eq("extraction_status", "pending")
      .eq("rewrite_status", "pending")

    if (error) {
      console.error(
        "[AI WRITER] Failed to mark merged duplicate",
        duplicate.queueId,
        error.message
      )
    }
  }
}

async function requestDraftArticle(
  apiKey: string,
  candidate: OpenClawCandidate,
  sourceText: string
) {
  return requestOpenAiText(
    apiKey,
    buildDraftArticlePrompt(candidate, sourceText),
    {
      model: process.env.OPENAI_REWRITE_MODEL || DEFAULT_OPENAI_REWRITE_MODEL,
      temperature: 0.7,
      timeoutMs: 60000,
      errorPrefix: "AI_DRAFT",
    }
  )
}

async function requestArticleWithGameInfo(
  apiKey: string,
  candidate: OpenClawCandidate,
  articleDraft: string,
  sourceText: string,
  context: RewriteContext = {}
) {
  const gameInfoSection = await requestOpenAiText(
    apiKey,
    buildGameInfoSectionPrompt(candidate, sourceText, context),
    {
      model: process.env.OPENAI_REWRITE_MODEL || DEFAULT_OPENAI_REWRITE_MODEL,
      temperature: 0.3,
      timeoutMs: 60000,
      errorPrefix: "AI_GAME_INFO",
    }
  )

  const articleWithGameInfo = appendMarkdownSection(articleDraft, gameInfoSection)
  validateMarkdownRetention("AI_GAME_INFO", articleDraft, articleWithGameInfo)

  return articleWithGameInfo
}

async function requestArticleWithOpinion(
  apiKey: string,
  candidate: OpenClawCandidate,
  articleDraft: string,
  sourceText: string,
  context: RewriteContext = {}
) {
  const opinion = await requestOpenAiText(
    apiKey,
    buildOpinionOnlyPrompt(candidate, sourceText, context),
    {
      model: process.env.OPENAI_REWRITE_MODEL || DEFAULT_OPENAI_REWRITE_MODEL,
      temperature: 0.6,
      timeoutMs: 60000,
      errorPrefix: "AI_OPINION",
    }
  )

  const articleWithOpinion = appendMarkdownSection(
    articleDraft,
    normalizeOpinionBlock(opinion)
  )
  validateMarkdownRetention("AI_OPINION", articleDraft, articleWithOpinion)

  return articleWithOpinion
}

async function requestRewrite(
  apiKey: string,
  prompt: string,
  candidate: OpenClawCandidate
) {
  const raw = await requestOpenAiJson(apiKey, prompt, {
    model: process.env.OPENAI_REWRITE_MODEL || DEFAULT_OPENAI_REWRITE_MODEL,
    temperature: 0.2,
    timeoutMs: 45000,
    errorPrefix: "AI",
  })

  return cleanFinalGameInfoBlocks(validateRewrite(raw), candidate)
}

async function generateRewriteWithRetry(
  candidate: OpenClawCandidate,
  maxAttempts: number,
  options: {
    manual?: boolean
    force?: boolean
    additionalSources?: AdditionalSourceContext[]
  } = {}
) {
  let lastError: unknown
  let repairReason: string | undefined
  const { apiKey, sourceText } = getRewriteSourceText(candidate)
  const classification = options.force
    ? ({
        decision: "reject",
        reason: "manual_force_rewrite",
        confidence: 1,
      } satisfies NewsClassification)
    : await classifyCandidate(apiKey, candidate, sourceText)

  if (!options.force && classification.decision === "reject") {
    throw new Error(`AI_CLASSIFIED_REJECT: ${classification.reason}`)
  }

  const newsItem = {
    title: candidate.raw_title || "",
    url: candidate.source_url,
    source: candidate.source_domain || "unknown",
    publishedAt: candidate.effective_published_at,
    content: sourceText,
    excerpt: candidate.raw_excerpt || undefined,
  }
  const detection = detectMobileGameNews(newsItem)
  const score = scoreEditorialCandidate(newsItem, detection, {
    bypassLowPriorityReject: options.manual === true,
    forceWrite: options.manual === true || options.force === true,
  })

  if (!score.should_write) {
    logEditorialDecision({
      stage: "editorial_scoring",
      status: "rejected",
      reason: score.rejection_reason,
      score: score.priority_score,
      url: candidate.source_url,
    })
    throw new Error(`EDITORIAL_SCORE_REJECT: ${score.decision_reason}`)
  }

  const research = buildResearchContext(newsItem, score, {
    enableResearch: process.env.AI_RESEARCH_ENABLED === "true",
  })
  const facts = extractArticleFacts(newsItem, research)
  const { profile: gameProfile, created: createdGameProfile } =
    await resolveGameProfile({
      candidate,
      facts,
      sourceText,
      classificationDecision: classification.decision,
    })
  const context = {
    score,
    research,
    facts,
    gameProfile,
    additionalSources: options.additionalSources || [],
  }

  logEditorialDecision({
    stage: "editorial_scoring",
    status: "accepted",
    reason: score.decision_reason,
    score: score.priority_score,
    url: candidate.source_url,
  })

  if (gameProfile) {
    console.log(
      `[GAME PROFILE] ${createdGameProfile ? "Created" : "Matched"} ${gameProfile.name} (${gameProfile.id})`
    )
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const article = await generateRewrite(
        apiKey,
        candidate,
        sourceText,
        repairReason,
        context
      )

      return {
        article: applyClassifiedCategory(article, classification, gameProfile),
        attempts: attempt,
        classification,
      }
    } catch (error) {
      lastError = error
      const message = error instanceof Error ? error.message : "AI_REWRITE_FAILED"
      repairReason = message
      console.warn(
        `[AI WRITER] Attempt ${attempt}/${maxAttempts} failed ${candidate.source_url}: ${message}`
      )
    }
  }

  throw lastError instanceof Error ? lastError : new Error("AI_REWRITE_FAILED")
}

async function findPublishedDuplicate(
  candidate: OpenClawCandidate
): Promise<DuplicateCheckResult | null> {
  const { data: sameUrl, error: urlError } = await supabaseAdmin
    .from("articles")
    .select("id")
    .eq("source_url", candidate.source_url)
    .eq("is_published", true)
    .limit(1)

  if (urlError) {
    throw new Error(`DUPLICATE_URL_CHECK_FAILED: ${urlError.message}`)
  }

  if (sameUrl && sameUrl.length > 0) {
    return {
      articleId: sameUrl[0].id,
      reason: "duplicate_published_source_url",
      matchedField: "source_url",
    }
  }

  const normalizedTitle = normalizeTitle(candidate.raw_title)
  if (!normalizedTitle) return null

  const { data: recentTitles, error: titleError } = await supabaseAdmin
    .from("articles")
    .select("id,title,seo_title,source_url")
    .not("title", "is", null)
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(100)

  if (titleError) {
    throw new Error(`DUPLICATE_TITLE_CHECK_FAILED: ${titleError.message}`)
  }

  for (const article of (recentTitles || []) as ExistingArticleTitle[]) {
    if (normalizeTitle(article.title) === normalizedTitle) {
      return {
        articleId: article.id,
        reason: "duplicate_published_title",
        matchedField: "title",
      }
    }

    if (normalizeTitle(article.seo_title) === normalizedTitle) {
      return {
        articleId: article.id,
        reason: "duplicate_published_seo_title",
        matchedField: "seo_title",
      }
    }
  }

  return null
}

async function markQueue(
  queueId: string,
  patch: {
    extraction_status?: string
    rewrite_status?: string
    rewrite_attempts?: number
    rewrite_error?: string | null
    rewrite_started_at?: string | null
    rewrite_finished_at?: string | null
    rewritten_article_id?: string | null
  }
) {
  const { error } = await supabaseAdmin
    .from("raw_news_queue")
    .update(patch)
    .eq("id", queueId)

  if (error) {
    const fallbackPatch = {
      extraction_status: patch.extraction_status,
      rewrite_status: patch.rewrite_status,
    }

    const { error: fallbackError } = await supabaseAdmin
      .from("raw_news_queue")
      .update(fallbackPatch)
      .eq("id", queueId)

    if (fallbackError) {
      console.error(
        "[AI WRITER] Failed to update queue",
        queueId,
        fallbackError.message
      )
    }
  }
}

async function recoverStaleRewriteJobs() {
  const cutoff = new Date(
    Date.now() - STALE_PROCESSING_MINUTES * 60 * 1000
  ).toISOString()

  const patch = {
    extraction_status: "failed",
    rewrite_status: "failed",
    rewrite_error: "stale_processing_recovered",
    rewrite_finished_at: new Date().toISOString(),
  }

  const { data: staleRows, error: staleError } = await supabaseAdmin
    .from("raw_news_queue")
    .update(patch)
    .eq("rewrite_status", "processing")
    .lt("rewrite_started_at", cutoff)
    .select("id")

  if (staleError) {
    console.error("[AI WRITER] Failed to recover stale rewrite jobs", staleError.message)
    return 0
  }

  const { data: missingStartedRows, error: missingStartedError } = await supabaseAdmin
    .from("raw_news_queue")
    .update(patch)
    .eq("rewrite_status", "processing")
    .is("rewrite_started_at", null)
    .select("id")

  if (missingStartedError) {
    console.error(
      "[AI WRITER] Failed to recover rewrite jobs with missing start time",
      missingStartedError.message
    )
  }

  return (staleRows?.length || 0) + (missingStartedRows?.length || 0)
}

async function claimCandidate(queueId: string) {
  const patch = {
    extraction_status: "processing",
    rewrite_status: "processing",
    rewrite_attempts: 0,
    rewrite_error: null,
    rewrite_started_at: new Date().toISOString(),
    rewrite_finished_at: null,
    rewritten_article_id: null,
  }

  const { data, error } = await supabaseAdmin
    .from("raw_news_queue")
    .update(patch)
    .eq("id", queueId)
    .eq("extraction_status", "pending")
    .eq("rewrite_status", "pending")
    .select("id")
    .maybeSingle()

  if (!error) {
    return Boolean(data)
  }

  const { data: fallbackData, error: fallbackError } = await supabaseAdmin
    .from("raw_news_queue")
    .update({
      extraction_status: "processing",
      rewrite_status: "processing",
    })
    .eq("id", queueId)
    .eq("extraction_status", "pending")
    .eq("rewrite_status", "pending")
    .select("id")
    .maybeSingle()

  if (fallbackError) {
    throw new Error(`CLAIM_REWRITE_JOB_FAILED: ${fallbackError.message}`)
  }

  return Boolean(fallbackData)
}

export async function rewriteOpenClawCandidates(
  options: RewriteCandidatesOptions | number = {}
) {
  const normalizedOptions =
    typeof options === "number" ? { limit: options } : options
  const limit = resolveLimit(normalizedOptions.limit)
  const dryRun = normalizedOptions.dryRun === true
  const publish = normalizedOptions.publish === true
  const maxAttempts = resolveAttempts(normalizedOptions.maxAttempts)
  const queueId = normalizedOptions.queueId
  const manual = normalizedOptions.manual === true
  const force = normalizedOptions.force === true

  const result: RewriteCandidatesResult = {
    dryRun,
    provider: OPENAI_REWRITE_PROVIDER,
    model: process.env.OPENAI_REWRITE_MODEL || DEFAULT_OPENAI_REWRITE_MODEL,
    classifierModel:
      process.env.OPENAI_CLASSIFIER_MODEL || DEFAULT_OPENAI_CLASSIFIER_MODEL,
    processed: 0,
    published: 0,
    drafted: 0,
    skippedDuplicate: 0,
    skippedIrrelevant: 0,
    skippedLowPriority: 0,
    failed: 0,
    recoveredStale: 0,
    cleanedStalePending: 0,
    cleanedRejectedPending: 0,
    cleanedNonRewriteablePending: 0,
    skippedClaimed: 0,
    articles: [],
    failures: [],
    duplicates: [],
  }

  if (!dryRun) {
    result.recoveredStale = await recoverStaleRewriteJobs()
    result.cleanedStalePending = await cleanupStalePendingRewriteQueue()
    result.cleanedRejectedPending = await cleanupRejectedPendingRewriteQueue()
    result.cleanedNonRewriteablePending = await cleanupNonRewriteablePendingQueue()
  }

  const candidates = await getOpenClawCandidates(limit, {
    markSkipped: !dryRun,
    queueId,
  })

  for (const candidate of candidates) {
    result.processed++
    console.log(`[AI WRITER] Rewriting ${candidate.source_url}`)

    if (!dryRun && !(await claimCandidate(candidate.id))) {
      result.skippedClaimed++
      continue
    }

    try {
      const duplicate = await findPublishedDuplicate(candidate)
      if (duplicate) {
        if (!dryRun) {
          await markQueue(candidate.id, {
            extraction_status: "skipped",
            rewrite_status: "duplicate",
            rewrite_error: duplicate.reason,
            rewrite_finished_at: new Date().toISOString(),
          })
        }

        result.skippedDuplicate++
        result.duplicates.push({
          queueId: candidate.id,
          sourceUrl: candidate.source_url,
          reason: `${duplicate.reason}:${duplicate.articleId}:${duplicate.matchedField}`,
        })
        continue
      }

      const mergedSources = buildAdditionalSourceContexts(
        await findPossibleDuplicateCandidates(candidate, {
          includeRawContent: true,
          limit: 4,
        })
      )

      if (mergedSources.length > 0) {
        console.log(
          `[AI WRITER] Merging ${mergedSources.length} duplicate source(s) into ${candidate.source_url}`
        )
      }

      const rewritten = await generateRewriteWithRetry(candidate, maxAttempts, {
        manual,
        force,
        additionalSources: mergedSources,
      })

      if (dryRun) {
        result.articles.push({
          queueId: candidate.id,
          articleId: "dry-run",
          slug: buildArticleSlug(rewritten.article),
          title: rewritten.article.title,
          status: "dry-run",
          isPublished: false,
        })
        continue
      }

      const inserted = await saveArticleDraft(
        {
          sourceUrl: candidate.source_url,
          rawContent: candidate.raw_content,
        },
        rewritten.article,
        { publish }
      )

      await markQueue(candidate.id, {
        extraction_status: "success",
        rewrite_status: "success",
        rewrite_attempts: rewritten.attempts,
        rewrite_error: null,
        rewrite_finished_at: new Date().toISOString(),
        rewritten_article_id: inserted.id,
      })

      await markMergedDuplicates(candidate.id, inserted.id, mergedSources)

      if (publish) {
        result.published++
      } else {
        result.drafted++
      }
      result.articles.push({
        queueId: candidate.id,
        articleId: inserted.id,
        slug: inserted.slug,
        title: inserted.title,
        status: inserted.status,
        isPublished: inserted.is_published,
      })

      for (const mergedSource of mergedSources) {
        result.skippedDuplicate++
        result.duplicates.push({
          queueId: mergedSource.queueId,
          sourceUrl: mergedSource.sourceUrl,
          reason: `merged_into:${candidate.id}:${inserted.id}`,
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI_REWRITE_FAILED"

      console.error(`[AI WRITER] Failed ${candidate.source_url}`, message)

      if (message === "DUPLICATE_PUBLISHED_SOURCE_URL") {
        result.skippedDuplicate++
        result.duplicates.push({
          queueId: candidate.id,
          sourceUrl: candidate.source_url,
          reason: message,
        })

        if (!dryRun) {
          await markQueue(candidate.id, {
            extraction_status: "skipped",
            rewrite_status: "duplicate",
            rewrite_error: message,
            rewrite_finished_at: new Date().toISOString(),
          })
        }

        continue
      }

      if (message.startsWith("AI_CLASSIFIED_REJECT:")) {
        result.skippedIrrelevant++
        result.failures.push({
          queueId: candidate.id,
          sourceUrl: candidate.source_url,
          reason: message,
        })

        if (!dryRun) {
          await markQueue(candidate.id, {
            extraction_status: "skipped",
            rewrite_status: "skipped",
            rewrite_error: message.slice(0, 2000),
            rewrite_finished_at: new Date().toISOString(),
          })
        }

        continue
      }

      if (message.startsWith("EDITORIAL_SCORE_REJECT:")) {
        result.skippedLowPriority++
        result.failures.push({
          queueId: candidate.id,
          sourceUrl: candidate.source_url,
          reason: message,
        })

        if (!dryRun) {
          await markQueue(candidate.id, {
            extraction_status: "skipped",
            rewrite_status: "skipped",
            rewrite_error: message.slice(0, 2000),
            rewrite_finished_at: new Date().toISOString(),
          })
        }

        continue
      }

      result.failed++
      result.failures.push({
        queueId: candidate.id,
        sourceUrl: candidate.source_url,
        reason: message,
      })

      if (!dryRun) {
        await markQueue(candidate.id, {
          extraction_status: "failed",
          rewrite_status: "failed",
          rewrite_attempts: maxAttempts,
          rewrite_error: message.slice(0, 2000),
          rewrite_finished_at: new Date().toISOString(),
        })
      }
    }
  }

  return result
}
