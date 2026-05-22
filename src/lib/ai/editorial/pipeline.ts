import { detectMobileGameNews } from "./mobileDetector"
import { scoreEditorialCandidate } from "./editorialScoring"
import { buildResearchContext } from "./researchContext"
import { extractArticleFacts } from "./factExtractor"
import { packageSeoResult } from "./seoPackaging"
import { logEditorialDecision } from "./logger"
import { saveArticleDraft } from "@/lib/news/saveArticle"
import type {
  EditorialNewsItem,
  RunEditorialPipelineOptions,
  RunEditorialPipelineResult,
} from "./types"

export async function runEditorialPipeline(
  newsItem: EditorialNewsItem,
  options: RunEditorialPipelineOptions = {}
): Promise<RunEditorialPipelineResult> {
  logEditorialDecision({
    stage: "pipeline",
    status: "started",
    url: newsItem.url,
  })

  const detection = detectMobileGameNews(newsItem)
  if (!detection.is_mobile_game) {
    logEditorialDecision({
      stage: "mobile_detection",
      status: "rejected",
      reason: detection.reason,
      score: detection.confidence,
      url: newsItem.url,
    })
    return {
      accepted: false,
      stage: "mobile_detection",
      reason: detection.reason,
      detection,
    }
  }

  const scores = scoreEditorialCandidate(newsItem, detection)
  if (!scores.should_write) {
    logEditorialDecision({
      stage: "editorial_scoring",
      status: "rejected",
      reason: scores.rejection_reason,
      score: scores.priority_score,
      url: newsItem.url,
    })
    return {
      accepted: false,
      stage: "editorial_scoring",
      reason: scores.rejection_reason,
      detection,
      scores,
    }
  }

  const research = buildResearchContext(newsItem, scores, {
    enableResearch: options.enableResearch,
  })
  const facts = extractArticleFacts(newsItem, research)
  const article = {
    title: newsItem.title,
    slug: packageSeoResult(newsItem, {
      title: newsItem.title,
      excerpt: newsItem.excerpt || newsItem.title,
    }).slug,
    excerpt: newsItem.excerpt || newsItem.title,
    content: newsItem.content || "",
  }
  const seo = packageSeoResult(newsItem, article, scores.priority_score)
  let savedArticleId: string | undefined

  if (!options.dryRun && article.content.trim()) {
    const saved = await saveArticleDraft(
      {
        sourceUrl: newsItem.url,
        rawContent: newsItem.content || "",
      },
      {
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        seo_title: seo.meta_title,
        seo_description: seo.meta_description,
        category: seo.category as "gaming",
      },
      { publish: options.publish === true }
    )
    savedArticleId = saved.id

    logEditorialDecision({
      stage: "supabase_save",
      status: "completed",
      reason: options.publish === true ? "published" : "draft",
      url: newsItem.url,
      details: { articleId: saved.id },
    })
  }

  logEditorialDecision({
    stage: "pipeline",
    status: "accepted",
    reason: scores.decision_reason,
    score: scores.priority_score,
    url: newsItem.url,
  })

  return {
    accepted: true,
    stage: options.dryRun ? "dry_run" : "ready",
    reason: scores.decision_reason,
    scores,
    article,
    savedArticleId,
    detection,
    research,
    facts,
    seo,
  }
}
