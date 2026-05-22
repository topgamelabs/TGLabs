# Engineering Audit Fix Phases

Status date: 2026-05-20

This note preserves the agreed audit/fix roadmap so future work can continue safely even if chat context is lost.

## Phase 1: Operational API Security - Completed

Goal: Prevent admin, cron, test, and AI operational endpoints from being publicly callable in production.

Completed:

- Added centralized auth helper in `src/lib/apiAuth.ts`.
- Replaced the confusing `OPENCLAW_INGEST_TOKEN` name with `TGLABS_ADMIN_API_TOKEN`.
- Added bearer-token support for server-to-server calls such as cron jobs.
- Added Basic Auth support for browser admin access with:
  - `TGLABS_ADMIN_USERNAME`
  - `TGLABS_ADMIN_PASSWORD`
- Added `src/proxy.ts` to protect:
  - `/admin/:path*`
  - `/api/admin/:path*`
  - `/api/ai/generate-article`
- Added `requireOperationalAuth` checks to operational routes including:
  - `/api/admin/newsroom`
  - `/api/admin/articles/[id]`
  - `/api/admin/focused-games`
  - `/api/openclaw/rewrite`
  - `/api/openclaw/candidates`
  - `/api/cron/generate-news`
  - `/api/test-fetch`
  - `/api/test-freshness`
  - `/api/test-rss`
  - `/api/ai/generate-article`

Verification completed:

- `npm run lint` passed with existing warnings only.
- `npm run build` passed after running outside sandbox because sandboxed build hit network `EACCES` during Supabase prerender fetch.
- `rg` confirmed no remaining `OPENCLAW_INGEST_TOKEN` references in `src`.

Production setup required before deploy:

```env
TGLABS_ADMIN_API_TOKEN=long-random-token
TGLABS_ADMIN_USERNAME=admin
TGLABS_ADMIN_PASSWORD=long-random-password
```

Cron must call protected endpoints with:

```bash
curl -H "Authorization: Bearer $TGLABS_ADMIN_API_TOKEN" https://tglabs.info/api/cron/generate-news
```

Notes:

- Local development still works without these env vars because the guard allows non-production access when no auth env is configured.
- Do not put `TGLABS_ADMIN_API_TOKEN` into client-side code.
- Keep Phase 1 commits limited to auth-related files; the worktree contains unrelated existing changes.

## Phase 2: Content Safety - Completed

Goal: Prevent stored XSS and unsafe HTML from AI output, migrated articles, or admin-edited content.

Completed:

- Added centralized sanitizer in `src/lib/sanitizeHtml.ts`.
- Sanitizer escapes all HTML by default, restores only allowlisted tags, and strips unsafe raw-content tags such as `script`, `style`, `iframe`, `object`, `embed`, `svg`, and `math`.
- Allowed basic article formatting tags such as `p`, headings, lists, `blockquote`, `strong`, `em`, `code`, `pre`, safe `a[href]`, and safe `img[src]`.
- Applied sanitizer to JSON block paragraph and bullet rendering.
- Applied sanitizer to legacy public article HTML rendering.
- Applied sanitizer to legacy `ArticleContent`.
- Applied sanitizer to admin generate preview.
- Left `src/app/layout.tsx` Google Analytics script untouched because it is static first-party code, not DB/AI/admin content.

Verification completed:

- `npm run lint` passed with existing warnings only.
- `npm run build` passed after running outside sandbox because sandboxed build can hit network `EACCES` during Supabase prerender fetch.

Key files:

- `src/components/news/ContentRenderer.tsx`
- `src/app/news/[slug]/page.tsx`
- `src/components/ui/ArticleContent.tsx`
- `src/app/admin/generate/page.tsx`
- `src/lib/sanitizeHtml.ts`

Remaining Phase 2 risks:

- Sanitization is render-time only; stored DB content is not migrated or rewritten.
- The sanitizer is intentionally conservative and may strip unsupported legacy HTML layout tags or attributes.
- A future hardening pass can sanitize at save time too, after verifying existing article content shape.

## Phase 3: Database Reproducibility - Completed

Goal: Make the Supabase database schema and production assumptions reproducible from the repo.

Completed:

- Added `docs/database-schema-contract.md` to capture the current required database contract.
- Documented required tables and columns for:
  - `articles`
  - `raw_news_queue`
  - `news_sources`
  - `categories`
  - `focused_games`
  - `focused_game_sources`
  - `games`
- Documented required indexes, constraints, production assumptions, and `increment_view` RPC.
- Added `scripts/verify-schema.js`, a read-only Supabase REST checker for required tables and columns.
- The verifier warns, but does not fail, for recommended capability columns that are optional in current runtime paths.
- Added `supabase/migrations/202605200001_add_articles_search_vector.sql` after approval to repair the critical search schema drift.
- Left existing runtime code, ingestion pipeline code, and frontend behavior unchanged.

Verification command:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
node scripts/verify-schema.js
```

Production verification result before applying the Phase 3 migration:

- The verifier runs successfully against the linked Supabase project, but currently fails because `articles.search_vector` is missing or inaccessible.
- Recommended capability columns are also missing or inaccessible:
  - `articles.inline_images`
  - `news_sources.sitemap_url`
  - `news_sources.site_url`
  - `news_sources.url`
- This result became clean after applying the approved Phase 3 migration and rerunning `scripts/verify-schema.js`.

Approved migration:

- `202605200001_add_articles_search_vector.sql` adds `articles.search_vector`, `articles_search_vector_idx`, `public.thai` text search config, and an update trigger for future article writes.

Verification completed after applying migration:

- `npx supabase db push` applied `202605200001_add_articles_search_vector.sql`.
- `npx supabase migration list` confirmed `202605200001` exists locally and remotely.
- `node scripts/verify-schema.js` passed 7/7 required table checks against the linked Supabase project.
- A read-only Supabase smoke test confirmed `.textSearch("search_vector", "game", { config: "thai" })` returns results without error.

Known limits:

- `scripts/verify-schema.js` does not mutate data.
- The script verifies tables and columns only.
- Indexes, constraints, RLS policies, and RPC function definitions still require manual SQL metadata inspection, documented in `docs/database-schema-contract.md`.

Key files:

- `supabase/migrations/*`
- `docs/database-schema-contract.md`
- `scripts/verify-schema.js`
- `scripts/verify-db.js`
- `scripts/verify-migration.js`

## Phase 4: Pipeline Hardening - Completed

Goal: Reduce production risk in the ingestion and AI rewrite flow without a large refactor.

Completed:

- Added a guard so fetch-time duplicate/stale freshness rejection also marks queue items as non-rewriteable:
  - `extraction_status = skipped`
  - `rewrite_status = skipped`
  - `rewrite_error = <freshness/duplicate reason>`
  - `rewrite_finished_at = now()`
- Added the same terminal skip behavior when freshness validation rejects pending items.
- Added `scripts/verify-pipeline-health.js`, a read-only checker for important queue invariants:
  - rejected items should not remain rewrite-pending
  - accepted rewrite-pending items should have `raw_content`
  - processing rewrite jobs should have `rewrite_started_at`
  - processing rewrite jobs should not stay stale beyond the check window
- Expanded the health checker to sample recent duplicate risks:
  - active queue source URL duplicates
  - article source URL duplicates
  - active queue normalized title duplicates
  - article normalized title duplicates
  - non-rejected queue content hash duplicates
- Added an AI rewrite guardrail that rejects dangerous raw HTML tags such as `script`, `iframe`, `object`, `embed`, `svg`, and `math` before saving generated article blocks.
- Added `scripts/repair-pipeline-health.js` to repair legacy successful queue rows that are missing `rewritten_article_id` when a matching article can be found by `source_url`. The script defaults to dry-run and only mutates data with `--apply`.

Verification command:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
node scripts/verify-pipeline-health.js
```

Verification completed:

- `node --check scripts/verify-pipeline-health.js` passed.
- `npm run lint` passed with existing warnings only.
- `node scripts/verify-pipeline-health.js` passed against the linked Supabase project after expanding duplicate-risk checks.
- `node scripts/repair-pipeline-health.js` dry-run found one legacy success row missing `rewritten_article_id`.
- `node scripts/repair-pipeline-health.js --apply` repaired that row by matching the article through `source_url`.
- `npm run build` passed with dummy Supabase/OpenAI env values. Build logged expected invalid-key responses from prerender data fetches, but completed successfully.

Remaining recommended steps:

1. Add targeted mutation-based rewrite claim/retry/failure tests on a staging DB if approved.
2. Add deeper AI fact-consistency checks only after deciding how strict the editorial pipeline should be.

Key files:

- `src/lib/news/collectRssNews.ts`
- `src/lib/news/processFetchQueue.ts`
- `src/lib/news/processFreshnessValidation.ts`
- `src/lib/news/openClawCandidates.ts`
- `src/lib/news/rewriteCandidates.ts`
- `src/lib/news/saveArticle.ts`
- `scripts/test-editorial-pipeline.ts`
- `scripts/verify-pipeline-health.js`

## Phase 5: Maintainability Cleanup - Completed

Goal: Make the project easier to understand and modify after the high-risk issues are handled.

Completed:

- Added `docs/scripts-runbook.md` to classify scripts by operational risk:
  - read-only verification
  - dry-run first
  - mutates production data
- Removed unused lint noise from legacy scripts without changing their intended behavior.
- Confirmed no repo-root `.bak` or `.fix` files are currently present to archive/remove.
- Left frontend layout/components untouched to avoid broad refactors after the safety phases.

Verification completed:

- `node --check` passed for the touched legacy scripts.
- `npm run lint` passed with 33 remaining warnings after cleanup. Script-specific lint warnings were removed; remaining warnings are frontend/runtime cleanup items outside this narrow pass.
- `npm run build` should be run if Phase 5 later touches runtime app code. This pass only changed docs and maintenance scripts.

Deferred:

1. Extract shared frontend pieces only where duplication is clearly hurting maintenance:
   - site nav
   - footer
   - article card
   - category page layout
2. Fix mojibake/encoding corruption in Thai UI text and prompts after deciding the canonical source text.
3. Split large modules only after tests/smoke checks exist.

Key files and areas:

- `docs/scripts-runbook.md`
- `src/app/page.tsx`
- `src/app/news/page.tsx`
- `src/app/news/mobile/page.tsx`
- `src/components/news/CategoryNewsPage.tsx`
- `src/lib/news/rewriteCandidates.ts`
- `scripts/*`

## Current Next Step

Phases 1-5 are completed at the agreed safety-first scope.

Before deploy, confirm production env values are set:

- `TGLABS_ADMIN_API_TOKEN`
- `TGLABS_ADMIN_USERNAME`
- `TGLABS_ADMIN_PASSWORD`

Recommended follow-up:

1. Run a final code review of the Phase 5 cleanup.
2. Decide whether to address remaining frontend/runtime lint warnings as a separate cleanup pass.
3. Decide whether to fix mojibake strings now that the high-risk backend and pipeline work is complete.
