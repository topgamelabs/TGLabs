# Facebook News Pipeline

Production flow:

1. Rewrite is complete and the article remains `draft`.
2. Codex generates a 4:5 background image from the article hero/reference image.
3. Save the generated image and the TGLabs overlay final image locally.
4. Upload the images to Supabase Storage.
5. Vercel Cron publishes the article, creates the Facebook photo post, adds the first comment with the article URL, and saves Facebook IDs back to Supabase.

Upload the prepared images:

```bash
node scripts/upload-facebook-creative.mjs --article-id ARTICLE_ID --generated output/facebook-creative/article-ai-background.png --final output/facebook-creative/article-final.png
```

Run a dry check first:

```bash
node scripts/run-facebook-news-pipeline.mjs --article-id ARTICLE_ID --dry-run
```

Run the real post:

```bash
node scripts/run-facebook-news-pipeline.mjs --article-id ARTICLE_ID
```

If `--article-id` is omitted, the runner picks the oldest draft article with a hero image, no `facebook_post_id`, and a matching final image in Supabase Storage.

Storage path convention:

```text
images/facebook-creative/ARTICLE_ID/generated.png
images/facebook-creative/ARTICLE_ID/final.png
```

The Facebook post route can still use an explicit `imageUrl` or local `imageFilePath` for manual testing, but Vercel Cron uses the Supabase Storage final image.
