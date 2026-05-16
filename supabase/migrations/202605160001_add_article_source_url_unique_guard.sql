create unique index if not exists articles_source_url_unique_idx
  on public.articles (source_url)
  where source_url is not null;

