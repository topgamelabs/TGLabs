alter table public.articles
  add column if not exists facebook_post_id text,
  add column if not exists facebook_posted_at timestamptz,
  add column if not exists facebook_first_comment_id text,
  add column if not exists facebook_post_error text,
  add column if not exists facebook_last_attempt_at timestamptz;

create index if not exists articles_facebook_post_id_idx
  on public.articles (facebook_post_id)
  where facebook_post_id is not null;
