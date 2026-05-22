# Database Schema Contract

Status date: 2026-05-20

This document captures the Supabase schema assumptions that the application currently depends on. It is intentionally a contract, not a full dump. The goal is to make production drift visible before deploys and before future migrations.

## Verification

Run the read-only schema check from the project root:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
node scripts/verify-schema.js
```

The script checks required tables and columns by issuing read-only `select` requests through Supabase REST. It does not insert, update, delete, or call mutating RPC functions.

Use `SUPABASE_SERVICE_ROLE_KEY` for the most reliable structural check. The script can fall back to `NEXT_PUBLIC_SUPABASE_ANON_KEY`, but RLS may hide schema problems behind permission errors.

## Required Tables And Columns

### articles

Used by public news pages, article pages, admin article updates, AI generation, duplicate checks, and view tracking.

Required columns:

- `id`
- `slug`
- `title`
- `excerpt`
- `content`
- `category`
- `game_id`
- `hero_image`
- `hero_caption`
- `author_id`
- `read_time`
- `rating`
- `view_count`
- `is_published`
- `is_featured`
- `seo_title`
- `seo_description`
- `published_at`
- `created_at`
- `updated_at`
- `source_url`
- `status`
- `ai_generated`
- `search_vector`

Recommended capability columns:

- `inline_images`

### raw_news_queue

Used by ingestion, freshness validation, OpenClaw candidate selection, AI rewrite, admin newsroom, and focused-game monitoring.

Required columns:

- `id`
- `source_id`
- `source_url`
- `source_domain`
- `raw_title`
- `raw_excerpt`
- `raw_content`
- `content_hash`
- `published_source_at`
- `discovered_at`
- `fetched_at`
- `fetch_status`
- `fetch_attempts`
- `fetch_http_status`
- `fetch_error`
- `freshness_status`
- `freshness_reason`
- `extraction_status`
- `rewrite_status`
- `rewrite_attempts`
- `rewrite_error`
- `rewrite_started_at`
- `rewrite_finished_at`
- `rewritten_article_id`
- `source_track`
- `focused_game_id`
- `focused_source_id`
- `detected_update_type`
- `focused_confidence`

### news_sources

Used by RSS collection, source fetching, scraping fallback, source health tracking, and admin newsroom source joins.

Required columns:

- `id`
- `name`
- `domain`
- `rss_url`
- `homepage_url`
- `supports_rss`
- `supports_scraping`
- `blocked_count`
- `last_failure_at`
- `last_success_at`

Recommended capability columns:

- `sitemap_url`
- `site_url`
- `url`

### categories

Used by navigation/category metadata and editorial category rows.

Required columns:

- `id`
- `name`
- `icon`
- `slug`
- `description`
- `sort_order`

### focused_games

Used by focused-game monitoring and admin focused-game management.

Required columns:

- `id`
- `name`
- `slug`
- `category`
- `platforms`
- `official_website`
- `status`
- `priority`
- `notes`
- `created_at`
- `updated_at`

### focused_game_sources

Used by focused-game monitoring source configuration.

Required columns:

- `id`
- `game_id`
- `source_type`
- `source_name`
- `source_url`
- `trust_level`
- `check_frequency`
- `enabled`
- `last_checked_at`
- `last_success_at`
- `last_error`
- `created_at`
- `updated_at`

### games

Used by article relations, homepage sections, and game metadata displays.

Required columns:

- `id`
- `name`
- `slug`
- `thumbnail`
- `platform`
- `created_at`

## Required Indexes And Constraints

These should be verified manually with SQL metadata access because Supabase REST does not expose index definitions reliably:

```sql
select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'articles_source_url_unique_idx',
    'raw_news_queue_rewrite_status_idx',
    'raw_news_queue_rewritten_article_id_idx',
    'focused_games_status_idx',
    'focused_game_sources_game_id_idx',
    'focused_game_sources_enabled_idx',
    'raw_news_queue_source_track_idx',
    'raw_news_queue_focused_game_id_idx',
    'articles_search_vector_idx'
  )
order by tablename, indexname;
```

Important constraints:

- `articles_source_url_unique_idx` must be unique on `articles(source_url)` where `source_url is not null`.
- `articles_search_vector_idx` must be a GIN index on `articles(search_vector)`.
- `focused_games.slug` must be unique.
- `focused_game_sources` must be unique on `(game_id, source_url)`.

Required search support:

- `public.thai` text search configuration should exist. It currently copies `pg_catalog.simple` so existing app queries using `{ config: "thai" }` resolve without changing runtime behavior.
- `public.update_articles_search_vector()` should maintain `articles.search_vector` from `title`, `excerpt`, and stripped `content`.
- `articles_search_vector_update` trigger should run before insert or update of `title`, `excerpt`, or `content`.

## Required RPC

The app expects this RPC to exist:

- `increment_view(article_uuid uuid)`

This RPC is used by `incrementView` in `src/lib/supabase.ts` and is expected to increment `articles.view_count` for one article.

Do not verify this RPC by calling it against a real article in production unless you intentionally accept the extra view count. Prefer SQL metadata inspection:

```sql
select n.nspname as schema_name, p.proname as function_name, pg_get_function_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'increment_view';
```

## Required Production Assumptions

- Public users can read published article data needed by public pages.
- Admin and ingestion paths use server-side credentials and must not rely on client keys for writes.
- Service-role keys must never be exposed to browser/client code.
- New migrations should be incremental and should not assume tables can be dropped/recreated in production.

## Known Gaps

- The repository currently has incremental migrations but not a complete baseline schema dump.
- `scripts/verify-schema.js` checks required tables and columns only. It warns for recommended capability columns. Indexes, constraints, RLS policies, and RPC definitions still require SQL metadata inspection.
- The script does not verify semantic behavior, such as whether `increment_view` increments exactly once or whether queue state transitions are correct. Those belong to later pipeline hardening phases.
