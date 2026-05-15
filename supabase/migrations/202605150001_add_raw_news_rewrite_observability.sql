alter table public.raw_news_queue
  add column if not exists rewrite_attempts integer not null default 0,
  add column if not exists rewrite_error text,
  add column if not exists rewrite_started_at timestamptz,
  add column if not exists rewrite_finished_at timestamptz,
  add column if not exists rewritten_article_id uuid references public.articles(id) on delete set null;

create index if not exists raw_news_queue_rewrite_status_idx
  on public.raw_news_queue (rewrite_status);

create index if not exists raw_news_queue_rewritten_article_id_idx
  on public.raw_news_queue (rewritten_article_id);
