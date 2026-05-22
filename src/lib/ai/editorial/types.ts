export type EditorialStage =
  | "mobile_detection"
  | "editorial_scoring"
  | "research_context"
  | "fact_extraction"
  | "thai_rewrite"
  | "seo_packaging"
  | "supabase_save"

export interface EditorialNewsItem {
  title: string
  url: string
  source: string
  publishedAt?: string
  content?: string
  excerpt?: string
  image?: string
}

export interface MobileGameDetection {
  is_mobile_game: boolean
  confidence: number
  platform_signals: string[]
  game_type: string
  reason: string
}

export interface EditorialScore {
  should_write: boolean
  priority_score: number
  seo_score: number
  engagement_score: number
  source_quality_score: number
  rejection_reason?: string
  decision_reason: string
}

export interface ResearchContext {
  confirmed_facts: string[]
  background_context: string[]
  player_relevance: string
  missing_information: string[]
  source_urls: string[]
}

export interface ArticleFacts {
  game_name: string
  event_or_update_name: string
  key_points: string[]
  release_date?: string
  rewards?: string[]
  platforms: string[]
  important_details: string[]
}

export interface SeoPackage {
  title: string
  slug: string
  excerpt: string
  meta_title: string
  meta_description: string
  category: string
  tags: string[]
  quality_score: number
}

export interface PipelineLogEvent {
  stage: EditorialStage | "pipeline"
  status: "accepted" | "rejected" | "started" | "completed" | "failed"
  reason?: string
  score?: number
  url?: string
  details?: Record<string, unknown>
}

export interface RunEditorialPipelineOptions {
  dryRun?: boolean
  publish?: boolean
  enableResearch?: boolean
}

export interface RunEditorialPipelineResult {
  accepted: boolean
  stage: string
  reason?: string
  scores?: EditorialScore
  article?: {
    title: string
    slug: string
    excerpt: string
    content: string
  }
  savedArticleId?: string
  detection?: MobileGameDetection
  research?: ResearchContext
  facts?: ArticleFacts
  seo?: SeoPackage
}

