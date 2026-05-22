# AI Editorial Pipeline Roadmap

This document is the working memory for the TGLabs AI Gaming News System.
Use it to continue development if chat context is lost.

## Current Production Baseline

The current AI news pipeline is already live-ready and synced to `main` and
`dev` at commit `eb6692f`.

Implemented flow:

1. Collect news from configured RSS/source feeds.
2. Queue raw links in `raw_news_queue`.
3. Fetch full source content.
4. Run freshness validation.
5. Clean stale unfiltered raw news older than 30 days.
6. Filter mobile/cross-platform game relevance with heuristics.
7. Validate candidates with OpenAI classifier.
8. Rewrite selected news into Thai gaming news articles.
9. Repair retry failed rewrites when validation errors are fixable.
10. Validate rewritten article quality.
11. Insert final articles into Supabase `articles`.
12. Mark queue rows as `success`, `skipped`, `failed`, or `duplicate`.

Production DB migration already applied:

```sql
create unique index if not exists articles_source_url_unique_idx
  on public.articles (source_url)
  where source_url is not null;
```

Latest verified health before this roadmap:

- `npm run lint`: passed with 41 existing warnings.
- `npm run build`: passed.
- `articles.source_url` duplicates: 0.
- `raw_news_queue.rewrite_status = processing`: 0.
- eligible pending rewrite queue: 0.
- Repair retry tested successfully on a real item.

## Existing Key Files

- `src/lib/news/collectRssNews.ts`
- `src/lib/news/processFetchQueue.ts`
- `src/lib/news/processFreshnessValidation.ts`
- `src/lib/news/newsRelevance.ts`
- `src/lib/news/openClawCandidates.ts`
- `src/lib/news/rewriteCandidates.ts`
- `src/app/api/cron/generate-news/route.ts`
- `src/app/api/openclaw/rewrite/route.ts`
- `supabase/migrations/202605150001_add_raw_news_rewrite_observability.sql`
- `supabase/migrations/202605160001_add_article_source_url_unique_guard.sql`
- `ai-rules/`

## Development Rules For The Next Phase

- Develop on `dev`, not `main`.
- Do not rebuild the working pipeline from scratch.
- Do not refactor unrelated UI or article pages.
- Do not change the database schema unless necessary and discussed first.
- Keep the existing Supabase data flow and queue statuses compatible.
- Add changes one roadmap item at a time.
- Ask for approval before starting each roadmap item.
- After each item, update this file with status and verification results.

## Planned Improvements

### 1. Make Pipeline Stages And Logs Clearer

Status: completed in local `dev`.

Goal:

- Make the current pipeline easier to debug without changing behavior.
- Standardize stage/result types and decision logging.

Expected work:

- Added reusable stage/result types in `src/lib/ai/editorial/types.ts`.
- Added structured decision logger in `src/lib/ai/editorial/logger.ts`.
- Integrated structured scoring logs into `rewriteCandidates.ts`.
- Kept current schema unchanged.

### 2. Add Editorial Scoring

Status: completed in local `dev`.

Goal:

- Rank candidate news by value before rewriting.
- Prioritize mobile game news with high SEO/player impact.

Expected output:

- `should_write`
- `priority_score`
- `seo_score`
- `engagement_score`
- `source_quality_score`
- `rejection_reason`
- `decision_reason`

Implementation:

- Added heuristic scoring in `src/lib/ai/editorial/editorialScoring.ts`.
- Integrated scoring before rewrite.
- Low-priority accepted-by-classifier items are marked `skipped` with
  `EDITORIAL_SCORE_REJECT`.

### 3. Add Fact Extraction Before Rewrite

Status: completed in local `dev`.

Goal:

- Reduce hallucination and improve article completeness.

Expected extracted facts:

- game name
- event/update name
- key points
- release date
- rewards
- platforms
- important details

Implementation:

- Added fact extraction in `src/lib/ai/editorial/factExtractor.ts`.
- Facts are included in rewrite and repair prompts.

### 4. Extract Save Article Logic

Status: completed in local `dev`.

Goal:

- Move Supabase article insert logic out of `rewriteCandidates.ts`.
- Reuse the same save logic from future pipeline wrappers and test scripts.

Rules:

- Do not create a parallel database flow.
- Preserve duplicate/source_url guard behavior.

Implementation:

- Added `src/lib/news/saveArticle.ts`.
- `rewriteCandidates.ts` now uses `saveArticleDraft`.
- Duplicate `source_url` guard behavior is preserved.

### 5. Add `runEditorialPipeline(newsItem, options)`

Status: completed in local `dev`.

Goal:

- Provide one reusable function for API, cron, test scripts, and future admin tools.

Expected input:

```ts
{
  title: string
  url: string
  source: string
  publishedAt?: string
  content?: string
  excerpt?: string
  image?: string
}
```

Expected result:

```ts
{
  accepted: boolean
  stage: string
  reason?: string
  scores?: object
  article?: object
  savedArticleId?: string
}
```

Modes:

- `dryRun: true` means do not save.
- `publish: false` means save as draft.
- `publish: true` means save as published.

Implementation:

- Added `runEditorialPipeline` in `src/lib/ai/editorial/pipeline.ts`.
- Supports dry-run and cautious save mode when caller provides article-ready
  content.

### 6. Add Test/Mock Script

Status: completed in local `dev`.

Goal:

- Run pipeline tests on sample news without publishing.

Expected script:

- `scripts/test-editorial-pipeline.ts` or a project-compatible JS script.

Implementation:

- Added `scripts/test-editorial-pipeline.ts`.
- The script type-checks with the project build. Runtime execution needs a TS
  runner if used directly from the shell.

### 7. Add Optional Research / Context Enrichment

Status: completed in local `dev`.

Goal:

- Add extra context only for high-priority or thin-source articles.

Rules:

- Do not run research for every article by default.
- Separate confirmed facts from assumptions.
- If research fails or is unavailable, write only from confirmed source facts.

Implementation:

- Added source-grounded context builder in
  `src/lib/ai/editorial/researchContext.ts`.
- External lookup is not run by default.
- Research can be enabled with `AI_RESEARCH_ENABLED=true`.

### 8. Add Cron Health Report / Metrics

Status: completed in local `dev`.

Goal:

- Track daily pipeline health and source performance.

Metrics:

- collected
- fetched
- accepted
- skipped
- failed
- duplicate
- published
- top failure reasons
- publish rate
- source performance

Implementation:

- Added `src/lib/news/editorialHealthReport.ts`.
- `GET /api/openclaw/rewrite` now includes `health` with queue counts,
  `published24h`, publish rate, top failure reasons, and source performance.

## Recommended Order

1. Make pipeline stages and logs clearer.
2. Add editorial scoring.
3. Add fact extraction before rewrite.
4. Extract save article logic.
5. Add `runEditorialPipeline(newsItem, options)`.
6. Add test/mock script.
7. Add optional research/context enrichment.
8. Add cron health report/metrics.

## Latest Local Verification

After completing roadmap items 1-8 locally on `dev`:

- `npm run lint`: passed with the same 41 existing warnings.
- `npm run build`: passed.
- No database schema change was added.
- Existing production article pages and UI were not modified.

## Next Action

Review the local diff, optionally test the OpenClaw rewrite status endpoint, then
ask for approval before committing or syncing.

## Newsroom Admin Roadmap

Status: started in local `dev`.

Goal:

- Add a minimal, production-safe admin cockpit for monitoring and manually
  controlling the AI news pipeline.
- Match the main site visual language: dark surface, red accent, compact
  editorial dashboard, no marketing-style layout.

### Newsroom Step 1: Queue + Health Monitor

Status: completed in local `dev`.

Expected path:

- `/admin/newsroom`

Expected features:

- Pipeline summary cards.
- Queue list from `raw_news_queue`.
- Filters for status, source, category/type, and search.
- Row-level metadata: title, source, published date, status, error/reason.
- Manual actions: rewrite/retry, skip, delete/archive, view source.

Implementation:

- Added `/admin/newsroom`.
- Added compact health cards.
- Added Queue, Articles, Health, and Rules tabs.
- Added queue filters for status, source, future category/type, and search.
- Added row actions for rewrite, retry, skip, delete, and source link.
- Added API route `/api/admin/newsroom`.

### Newsroom Step 2: Manual Controls

Status: completed in local `dev`.

Expected actions:

- Rewrite one queue item.
- Retry/reset failed item.
- Skip item.
- Delete raw queue item when intentionally unwanted.

Rules:

- Prefer soft actions where possible.
- Hard delete should be explicit and admin-only.

Implementation:

- Added admin API actions:
  - `rewrite`
  - `retry`
  - `skip`
  - `delete`
- Added `queueId` support to `rewriteOpenClawCandidates`.

### Newsroom Step 3: Articles List

Status: completed in local `dev`.

Expected features:

- Published/draft article list.
- Search by title, slug, source URL.
- Filter by category/status/date.
- Link to public page and edit page.

Implementation:

- Added Articles tab in `/admin/newsroom`.
- Added latest article list with edit and public view actions.

### Newsroom Step 4: Published Article Editor

Status: completed in local `dev`.

Expected path:

- `/admin/newsroom/articles/[id]`

Editable fields:

- title
- slug
- excerpt
- content
- category
- hero image
- seo title
- seo description
- status
- is published

Rules:

- Validate required fields before save.
- Do not auto-rewrite published content without explicit action.

Implementation:

- Added `/admin/newsroom/articles/[id]`.
- Added API route `/api/admin/articles/[id]`.
- Supports editing title, slug, excerpt, HTML content, category, hero image,
  SEO title, SEO description, and published/draft state.
- Added lightweight quality checks before save.

### Newsroom Step 5: Future Rules And Filters

Status: scaffolded in local `dev`.

Future ideas:

- Source allow/block list.
- Keyword boost/reject rules.
- Category priority.
- Score threshold tuning.
- Audit log for admin actions.

Implementation:

- Added Rules tab placeholder.
- Added UI-level category/type filter structure for future multi-category
  queue filtering.

Latest verification after newsroom work:

- `npm run lint`: passed with the same 41 existing warnings.
- `npm run build`: passed.
- New routes:
  - `/admin/newsroom`
  - `/admin/newsroom/articles/[id]`
  - `/api/admin/newsroom`
  - `/api/admin/articles/[id]`

## JSON Blocks Rewrite Migration

Status: completed in local `dev`.

Decision:

- The article page already supports JSON block arrays in `articles.content`.
- New AI rewrites should save `content` as `JSON.stringify(blocks)`.
- Existing HTML articles remain supported by the legacy renderer path.

Implemented:

- Added `src/lib/news/articleBlocks.ts` with block types, parser,
  validation, serialization, and metrics.
- Updated `rewriteCandidates.ts` prompts to request JSON Blocks only.
- Updated rewrite validation to require:
  - block array
  - supported block types only
  - 5+ paragraph blocks
  - 3+ heading blocks
  - exactly 1 quote block
  - no CJK scripts outside allowed Thai/English usage
  - no emoji in article blocks
- Updated save read-time estimation to understand JSON Blocks.
- Updated admin article editor quality checks to understand JSON Blocks.

Supported block types:

- `paragraph`
- `heading`
- `bullet`
- `quote`
- `rule`
- `image`
- `ptag`

Latest verification after JSON Blocks migration:

- `npm run lint`: passed with the same 41 existing warnings.
- `npm run build`: passed.
- No database schema change was required.

## Hybrid Local AI Cost Control Roadmap

Status: planned.

Goal:

- Reduce rewrite cost when queue volume grows without dropping published article
  quality.
- Keep OpenAI/Codex available for the final high-quality Thai editorial pass.

Recommended direction:

- Add an AI provider mode later: `openai`, `local`, and `hybrid`.
- Use local AI first for cheaper stages such as classification, scoring,
  extraction, draft rewrite, and JSON repair trials.
- Use OpenAI for final Thai rewrite, final SEO packaging, and difficult repair
  cases where style quality matters most.
- Test local models such as Gemma 2 9B and Qwen-family models on the same
  sample articles before switching any production path.
- Track output quality with the existing newsroom preview before allowing local
  AI output to publish.

Rules:

- Do not replace the current working OpenAI rewrite path until quality is
  measured.
- Do not add another database flow.
- Local AI should remain roadmap-only for now.
- Do not implement local AI writing in the current phase.
- If local AI is tested later, start with dry-run classification/extraction
  only. It must not write or publish articles until benchmark quality is proven.

Current decision:

- Local AI is not worth implementing yet if the only goal is cost reduction.
- The higher-impact work now is stricter news filtering, better scoring, and a
  safer admin publish workflow.

## News Selection Accuracy Roadmap

Status: active.

Goal:

- Reduce AI rewrite cost by sending fewer low-value items into the expensive AI
  rewrite path.
- Improve article relevance before optimizing model/provider costs.

Immediate focus:

- Reject generic guides, beginner guides, progression builds, tier lists, and
  how-to pages unless explicitly approved for a guide category.
- Prefer player-impact news: launches, major updates, collaborations,
  anniversaries, limited events, rewards/codes, pre-registration, shutdowns,
  controversies, and major platform releases.
- Keep `mobile`, `pc-console`, and `gaming` categories distinct.
- Let `news` remain the all-news page, not the preferred generated article
  category.

Implementation rules:

- Tighten heuristic filtering before AI.
- Keep OpenAI rewrite path unchanged for accepted candidates.
- Do not change database schema for this phase.
- Mark rejected queue items with clear reasons so the admin newsroom can show
  why they were skipped.

Latest freshness decision:

- Missing `published_source_at` should not block every article automatically.
- If a fetched article has no publish date but was discovered within 72 hours,
  it can pass freshness with reason
  `fresh_by_recent_discovery_missing_publish_date`.
- `published_source_at` must remain null when the source date is unknown; do
  not fabricate a publish date.
- Rewrite ordering and prompts may use an internal freshness reference time
  based on `published_source_at || discovered_at`.

## PC / Console Expansion

Status: in progress in local `dev`.

Goal:

- Support PC/Console news from the expanded source list.
- Keep Mobile as the primary category while adding PC/Console visibility on the
  main site.

Current work:

- Category `pc-console` is supported in article save/edit flows.
- News filtering has been opened for PC/Console game news.
- Main homepage needs a top navigation entry and a PC/Console section after
  Mobile Games.

Latest implementation:

- `news` is treated as the all-news listing, not the preferred category for
  new generated articles.
- Primary categories are `mobile`, `pc-console`, and `gaming`.
- New routes:
  - `/news/mobile`
  - `/news/pc-console`
  - `/news/gaming`
- New general gaming articles should save as `gaming`.
- Legacy `news` category articles are still included in the Gaming page for
  backward compatibility.

## Local AI Newsroom Translation Preview Roadmap

Status: planned, blocked by local Ollama installation.

Goal:

- Help the admin quickly review `Ready to Rewrite` queue items by showing Thai
  preview translations of only the visible raw title/excerpt.
- Use local AI for this low-risk translation task to reduce OpenAI cost.
- Keep source facts intact and avoid mixing translation preview with published
  article content.

Important rule:

- Do not overwrite `raw_title`, `raw_excerpt`, `raw_content`, or any source
  attribution fields.
- Translation preview is only an admin convenience layer for selection.
- Rewrite/publish quality remains handled by the existing editorial pipeline.

Preferred local model direction:

- Primary target: Ollama with `gemma2:9b`.
- Fallback when memory/performance is limited: `gemma:7b` or `gemma2:2b`.
- User originally asked for Gemma 2 7B; note that Ollama's Gemma 2 family is
  typically available as 2B/9B/27B, while 7B maps to the older Gemma family.

Phase 1:

- Add an admin-only translation preview API.
- Use local Ollama if available.
- If Ollama is unavailable, return the original title/excerpt and a clear
  fallback status.
- Translate only visible newsroom rows, preferably when the filter is
  `Ready to Rewrite`.

Phase 2:

- Add a `Translate visible` button or controlled auto-translation for eligible
  rows.
- Show Thai title/excerpt as the primary preview.
- Keep original source title/excerpt visible below in muted text.
- Add a small `AI translated preview` label so the admin knows it is not source
  text.

Phase 3:

- If preview quality is useful, add optional Supabase cache fields or a small
  cache table to avoid repeated local translation.
- Cache must be admin-only and must not become the article source of truth.
- Add basic quality checks for empty output, untranslated text, and obvious
  hallucinated additions.

Resume note:

- After Ollama and the chosen Gemma model are installed locally, return to this
  roadmap and implement Phase 1 -> Phase 2 -> Phase 3 in order.

## Focused Games Official Source Monitor Roadmap

Status: active.

Goal:

- Add a focused game monitoring workflow separate from broad news discovery.
- Track specific games and their official or near-official channels.
- Prioritize accuracy by using official sources first, then route accepted
  findings into the existing queue/rewrite/admin flow.

Core principles:

- Do not replace the current general news discovery system.
- Do not create a parallel article publishing pipeline.
- Reuse `raw_news_queue` for rewrite readiness when possible.
- Keep the first version simple: official websites/news pages and manual URLs
  first; social network APIs can wait.
- Source accuracy matters more than volume.

Phase 1:

- Add `focused_games` for games the admin wants to monitor.
- Add `focused_game_sources` for official website/news/manual source URLs.
- Link focused findings to `raw_news_queue` with `focused_game_id`,
  `focused_source_id`, and `source_track = focused`.
- Add an admin sidebar/nav so focused game workflows are visually separate from
  the existing newsroom.
- Add pages to list/add/edit focused games and add sources for each game.
- Add `Check sources now` for enabled website/news/manual sources.

Phase 2:

- Add focused source health: last checked, last success, last error, discovered
  count.
- Add lightweight update-type detection: patch, event, banner, code,
  collaboration, launch, maintenance, shutdown.
- Add a focused queue filter in the newsroom so official-source items can be
  reviewed separately.

Phase 3:

- Add low-risk extra source types: YouTube RSS, Steam news, App Store/Google
  Play update notes.
- Keep X/Facebook manual-first until API access and rate limits are clear.

Implementation note:

- First inspect the live Supabase schema before writing migrations, because the
  local migration folder only contains recent incremental migrations.
