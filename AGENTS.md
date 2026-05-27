<!-- BEGIN:nextjs-agent-rules -->

# Next.js Version Notice

This project uses Next.js 16. APIs, conventions, and file structure may differ
from older training data. When changing framework behavior, check the relevant
guide in `node_modules/next/dist/docs/` and heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# TGLabs AI Editorial System

## Project Overview

TGLabs is an AI-assisted Thai gaming news platform focused on:

- Mobile games
- PC and console games
- MMORPG and gacha games
- SEO-driven news content
- AI-assisted editorial workflow
- Supabase-backed publishing operations

Primary goals:

- Publish useful Thai gaming news consistently
- Preserve human-feeling editorial quality
- Grow SEO traffic without clickbait or fabricated claims
- Keep the pipeline observable and safe to operate

## Current Workflow Rules

- Work locally only unless the user explicitly asks to sync main.
- Do not push, deploy, or sync main without an explicit instruction.
- Do not recreate the old dev-branch workflow; the active workflow is local -> main.
- Never revert or overwrite unrelated local changes.
- If a file has existing changes, read it carefully and work with those changes.
- Production cannot rely on local AI services; fetch and rewrite work currently run locally.
- Supabase is the shared data source for published site content.

## Editorial Direction

Prioritize game news with clear player value:

- Mobile game launches, updates, events, anniversaries, collaborations, banners,
  free summons, global launches, shutdowns, and major service changes
- PC/console launches, updates, release dates, major patches, platform news,
  controversies, sales, and player-impacting service changes
- Cross-platform games count as `mobile` when the source clearly confirms mobile,
  iOS, Android, App Store, Google Play, or smartphone support

Do not prioritize:

- Hardware news unless it directly affects game service or players
- Anime, manga, music, merchandise, figures, or voice actor news unless the
  article is clearly about a playable game launch, update, event, or service
- Patch notes with no clear player impact or editorial angle
- Generic gaming topics without a specific news hook

## Category Rules

- Use the game table/profile data when available before asking AI to infer category.
- `mobile`: mobile-only games and cross-platform games with confirmed mobile support.
- `pc-console`: PC or console games without confirmed mobile support.
- `gaming`: broader game industry/news items that do not fit mobile or PC/console cleanly.
- Do not categorize purely by source website. Categorize by article content.

## Writing Style

Articles should:

- Sound like a real Thai gaming news website
- Use natural Thai language
- Use short, readable paragraphs
- Lead with the actual news angle, not generic hype
- Preserve official English game titles
- Be informative, not promotional
- Avoid fake certainty and unsupported claims
- Avoid Facebook engagement-bait style

Avoid overusing:

- "นอกจากนี้"
- "อย่างไรก็ตาม"
- "ถือเป็น"
- "กล่าวได้ว่า"
- "ในส่วนของ"
- repetitive transitions
- generic filler conclusions
- robotic summaries

## Rewrite Pipeline Safety

The rewrite flow must protect article quality before saving:

- Do not save quote-only articles.
- Do not save articles that are obviously too short.
- Do not mark a rewrite as success when the final JSON has no real news body.
- Game info and opinion sections should be appended safely; they must not replace
  the main article.
- Opinion must be a short quote block at the end, not the entire article.
- If validation fails, mark the queue item failed with a clear `rewrite_error`
  instead of publishing bad content.
- Suspicious old articles with very short content, no paragraph blocks, or only
  quote blocks should be regenerated before publishing.

## Facebook Posting Status

Facebook Phase 1 is complete locally:

- Manual Facebook Page photo posting works.
- The article URL is added as the first comment.
- `facebook_post_id`, `facebook_posted_at`, `facebook_first_comment_id`,
  `facebook_post_error`, and `facebook_last_attempt_at` are stored on articles.
- Duplicate posting is prevented by checking `facebook_post_id`.

Phase 2 is paused until current operational issues are resolved. Do not start AI
social creative generation unless the user explicitly resumes Phase 2.

## SEO Rules

Prioritize:

- Searchable game names
- Event names
- Update versions
- Banner names
- Platform/service terms users actually search for
- Clear title intent

Titles should:

- Be direct and readable
- Avoid excessive punctuation
- Avoid unsupported hype
- Balance CTR and search intent

## Technical Stack

- Frontend: Next.js 16, React, Tailwind CSS
- Backend/data: Supabase
- Deployment: Vercel
- AI workflow: local orchestration with cloud rewrite where configured

## Development Rules

- Prefer existing project patterns over new abstractions.
- Keep UI and API layers separated.
- Preserve SEO structure and article rendering behavior.
- Keep edits narrowly scoped to the requested task.
- Add validation before automation when bad data could publish.
- Run lint/build when the change affects TypeScript, Next.js routes, or shared
  pipeline behavior.

## AI Pipeline Architecture

Current high-level flow:

RSS/source discovery -> filtering -> relevance scoring -> approval/rewrite queue
-> AI rewrite -> JSON block packaging -> review/draft -> publish -> optional
Facebook share.

## Content Quality Goals

Every article should:

- Provide practical value for players
- Be easy to skim
- Feel timely
- Feel written by a human editor
- Avoid obvious AI fingerprints
- Avoid invented details
