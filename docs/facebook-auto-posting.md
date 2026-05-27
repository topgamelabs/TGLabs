# Facebook Auto Posting

This project can publish posts to a Facebook Page through:

```text
POST /api/facebook/post
```

The endpoint is protected by the existing operational auth. Use either the admin Basic auth credentials or:

```http
Authorization: Bearer <TGLABS_ADMIN_API_TOKEN>
```

## Required Meta setup

Create or configure a Meta app in Meta for Developers, then use Facebook Login to grant a Page access token with these Page permissions:

```text
pages_manage_posts
pages_read_engagement
pages_manage_engagement
pages_read_user_engagement
```

For video publishing, Meta also requires:

```text
publish_video
```

The Facebook user granting access must be able to perform the Page tasks needed to create content, manage, and moderate the Page.

## Environment variables

Add these to the deployment environment:

```env
FACEBOOK_PAGE_ID=
FACEBOOK_PAGE_ACCESS_TOKEN=
FACEBOOK_GRAPH_API_VERSION=v25.0
```

`FACEBOOK_GRAPH_API_VERSION` is optional. The app defaults to `v25.0`.

## Post a custom message

```bash
curl -X POST "https://www.tglabs.info/api/facebook/post" \
  -H "Authorization: Bearer $TGLABS_ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "New article is live",
    "link": "https://www.tglabs.info/news/example"
  }'
```

## Post from an article

Pass an article id and the endpoint will build the Facebook message from the article title and excerpt. The link will use the article slug.

```bash
curl -X POST "https://www.tglabs.info/api/facebook/post" \
  -H "Authorization: Bearer $TGLABS_ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "articleId": "article_uuid"
  }'
```

## Schedule a post

Meta requires scheduled Page posts to be between 10 minutes and 30 days from the API request time.

```bash
curl -X POST "https://www.tglabs.info/api/facebook/post" \
  -H "Authorization: Bearer $TGLABS_ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Scheduled post",
    "link": "https://www.tglabs.info/news/example",
    "scheduledPublishTime": 1779700800
  }'
```

## Dry run

Use `dryRun` to inspect the payload without calling Facebook:

```json
{
  "articleId": "article_uuid",
  "dryRun": true
}
```

## Roadmap

Current status:

- Simple Page post API exists for `message + link`.
- Local token check confirmed the configured Page can be read and published to
  through Graph API.
- Phase 1 manual article photo posting is implemented locally:
  - article `hero_image` is posted through the Page photos endpoint
  - article URL is added as the first comment after the photo post
  - article-level Facebook post state is stored to prevent duplicate posts
  - admin article editor has a manual `Post to Facebook` action
- Real posting has been verified with a long-lived Page access token.
- The admin posting route successfully saved `facebook_post_id`,
  `facebook_posted_at`, and `facebook_first_comment_id` back to Supabase.
- The first comment now uses the public production article URL.
- The system is not yet connected to automatic article publishing.
- Phase 2 is paused until the current operational issues found after Phase 1
  are resolved.

### Phase 1 - Manual image news post

Goal:

- Post an article image to Facebook.
- Use the article excerpt as the initial caption.
- Add the article URL as the first comment.

Planned implementation:

- [x] Add a photo-post helper using the Page photos endpoint.
- [x] Use `hero_image` or a selected social image URL.
- [x] Add a first-comment helper using the returned post id.
- [x] Add an admin action to post a selected article to Facebook.
- [x] Store posting state on the article:
  - `facebook_post_id`
  - `facebook_posted_at`
  - `facebook_first_comment_id`
  - `facebook_post_error`
- [x] Store `facebook_last_attempt_at` for troubleshooting.
- [x] Complete one real post after refreshing the Page access token.
- [x] Verify the admin posting route with a real Facebook photo post.
- [x] Confirm the first comment is stored and uses the public production URL.

Important behavior:

- Do not create a second Facebook post if `facebook_post_id` already exists.
- If the photo post succeeds but the comment fails, keep the post and save the
  comment error for manual retry.
- Do not auto-post yet in Phase 1.

### Phase 2 - AI social creative

Status: Paused until the current post-Phase-1 operational issues are resolved.

Goal:

- Generate a 4:5 image for Facebook news posts.
- Generate a more attention-grabbing caption.
- Add optional sponsor content as the second comment.

Planned implementation:

- Add social creative fields or a small social assets table.
- Add preview/approval before any Facebook post is created.
- Keep the caption punchy but factual; mild clickbait is acceptable, false
  claims are not.
- Use official article images first when they are better than AI output.
- Use AI images carefully because game visuals can be inaccurate or
  copyright-sensitive.

### Phase 3 - Publish automation

Goal:

- Automatically post to Facebook when an article is published.

Planned implementation:

- Trigger after article publish only when auto-posting is enabled.
- Check existing `facebook_post_id` before posting.
- Record success and failure on the article.
- Do not fail article publishing if Facebook posting fails.
- Prefer queue-style processing if image generation or Facebook posting risks
  API timeout.

Known risks:

- Facebook must be able to fetch the image URL publicly.
- Source-site image hotlinking may fail.
- Page tokens can expire or lose permissions.
- API-created photo posts can behave differently from manual Meta Business
  Suite posts.
- Comments can fail independently from the photo post.
