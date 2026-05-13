# TGLabs Project Context

## Project Goal

TGLabs is an AI-driven gaming news platform built to generate SEO traffic and monetize through gaming news content, especially mobile games, MMORPGs, anime games, and gacha games.

Core objective:

1. AI discovers news.
2. AI analyzes freshness.
3. AI rewrites news.
4. AI generates articles.
5. System publishes automatically.
6. SEO pages drive organic traffic.
7. Traffic is monetized through ads.

The platform is SEO-first and optimized for long-term organic search traffic.

## Tech Stack

Frontend:

- Next.js 16 with App Router
- Tailwind CSS

Backend:

- Next.js API routes
- Supabase

Database/Auth:

- Supabase PostgreSQL
- Supabase Auth

AI:

- Current main model: MiniMax 2.7
- Planned task-specific model separation:
  - extraction
  - rewrite
  - SEO optimization
  - title generation

Deployment:

- Docker
- Linux VPS

## Current Architecture

```text
News Sources
  -> RSS / Scraping Collector
  -> raw_news_queue
  -> freshness validation
  -> HTML fetch
  -> AI extraction
  -> AI rewrite
  -> articles
  -> SEO pages
```

## Completed Work

AI content system:

- AI article generation
- News rewrite
- Multi-article generation
- Preview/edit before save
- Save to Supabase
- Slug uniqueness
- Source URL support
- SEO metadata
- Sitemap
- Google Search Console setup

Frontend:

- Homepage
- Article page
- Dynamic `news/[slug]`
- Admin generate page
- Sticky UI
- Mobile sticky UI
- Loading skeleton

Database:

- `articles`
- `news_sources`
- `raw_news_queue`
- SEO fields
- Article status system

Deployment:

- Production Docker setup
- VPS deployment
- Auto build/start

## Current Phase

Phase 1: Manual AI-assisted publishing is done.

Phase 2: Reliable automated news ingestion is in progress.

Phase 3: Fully autonomous AI news operation is next.

## Current Work

The current focus is building an automated news ingestion pipeline.

Already done:

- `news_sources` table
- RSS source management
- API test routes
- Supabase connection
- Queue architecture
- Fetch status fields
- Failure tracking

## Current Blocking Issue

`rss-parser` `parseURL()` is being blocked by some sites with HTTP 403.

Confirmed log:

```text
RSS TEST FAILED: Status code 403
```

Conclusion:

- The parser works.
- Network access works.
- The target site is blocking the parser/request pattern.

Decision:

- Do not use `parser.parseURL(url)`.
- Use `fetch(url, headers)` and then `parser.parseString(xml)`.

## Important Technical Decisions

### RSS Strategy

Old approach:

```ts
parser.parseURL(url)
```

New approach:

```ts
const response = await fetch(url, { headers });
const xml = await response.text();
const feed = await parser.parseString(xml);
```

Reason:

- `parseURL()` gets blocked.
- Custom request behavior is needed.
- Production reliability is more important than parser convenience.

### Hybrid Collection Strategy

The system should not rely on RSS alone.

Final collection architecture:

- RSS feeds
- HTML scraping
- Sitemap scraping
- AI extraction

Reasons:

- Many gaming sites do not expose useful RSS feeds.
- Some sites block RSS parser requests.
- Some sites use Cloudflare or other anti-bot layers.

### Reliability Before Intelligence

Before AI rewrite, the system must have:

- Freshness validation
- Duplicate prevention
- Fetch validation
- Source quality checks
- Anti-old-news rules

### AI Must Not Fail Silently

Every stage must include:

- Status
- Logs
- Retries
- Failure reason

## Important Database Tables

### `news_sources`

Stores:

- Source config
- RSS URL
- RSS support flag
- Scraping support flag
- Blocked count
- Success/failure tracking

### `raw_news_queue`

Queue for raw news before AI rewrite.

Important fields:

- `source_url`
- `fetch_status`
- `fetch_attempts`
- `raw_content`
- `freshness_score`
- `fetched_at`
- `fetch_error`

### `articles`

Final published articles.

## Important Files

API routes:

- `src/app/api/test-rss`
- `src/app/api/test-fetch`
- `src/app/api/cron/generate-news`
- `src/app/api/ai/generate-article`

News system:

- `src/lib/news/collectRssNews.ts`
- `src/lib/news/processFetchQueue.ts`
- `src/lib/news/testSingleRss.ts`
- `src/lib/news/assertFetchSuccess.ts`

Database client:

- `src/lib/supabase.ts`

Backend workers must use:

- `SUPABASE_SERVICE_ROLE_KEY`

Backend workers must not use:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Next Tasks

High priority:

1. Rewrite the RSS collector from `parseURL()` to `fetch()` plus `parseString()`.
2. Build a robust fetch layer with:
   - user-agent rotation
   - timeout
   - retry
   - anti-block detection
   - HTTP status logging
3. Finish the `raw_news_queue` pipeline:
   - RSS
   - queue
   - fetch HTML
   - validate freshness
   - AI extraction
4. Build AI freshness validation to prevent:
   - old news
   - duplicates
   - fake updates
   - stale content
5. Improve source diversification:
   - source rotation
   - source scoring
   - cooldown system

## Operational Notes

Docker issue previously seen:

- A container may keep using an old build.
- New routes may not appear after normal restart.

Often useful:

```bash
docker compose build --no-cache
docker compose up -d
```

Port issue previously seen:

```text
listen EADDRINUSE :::3000
```

Meaning:

- Multiple `next start` processes may be running.
- Be careful with Docker restart/build flow.

## Coding Rules

Important constraints:

- Do not break the existing system.
- Preserve the current data flow.
- Avoid unnecessary refactors.
- Keep code copy-paste ready when sharing code.
- Separate layers clearly:
  - UI
  - API
  - data layer
- Debug with pinpoint causes.
- Do not guess.
- Debug one layer at a time.

Next.js note:

- This project uses Next.js 16 with breaking changes.
- Before changing Next.js-specific APIs, conventions, or file structure, read the relevant guide in `node_modules/next/dist/docs/`.

## Content Strategy

TGLabs is more than a news site. It is intended to become an ecosystem around:

- YouTube
- Gaming utility content
- SEO articles
- Livestream content

Current style:

- Quick gaming utility content
- Fast payoff
- Useful
- Searchable
- Evergreen where possible
- Low fluff
- High retention structure
