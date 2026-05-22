do $$
begin
  if not exists (
    select 1
    from pg_ts_config cfg
    join pg_namespace ns on ns.oid = cfg.cfgnamespace
    where ns.nspname = 'public'
      and cfg.cfgname = 'thai'
  ) then
    execute 'create text search configuration public.thai (copy = pg_catalog.simple)';
  end if;
end $$;

alter table public.articles
  add column if not exists search_vector tsvector;

create or replace function public.update_articles_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('public.thai'::regconfig, coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('public.thai'::regconfig, coalesce(new.excerpt, '')), 'B') ||
    setweight(
      to_tsvector(
        'public.thai'::regconfig,
        regexp_replace(coalesce(new.content, ''), '<[^>]+>', ' ', 'g')
      ),
      'C'
    );

  return new;
end;
$$;

drop trigger if exists articles_search_vector_update on public.articles;

create trigger articles_search_vector_update
  before insert or update of title, excerpt, content
  on public.articles
  for each row
  execute function public.update_articles_search_vector();

update public.articles
set search_vector =
  setweight(to_tsvector('public.thai'::regconfig, coalesce(title, '')), 'A') ||
  setweight(to_tsvector('public.thai'::regconfig, coalesce(excerpt, '')), 'B') ||
  setweight(
    to_tsvector(
      'public.thai'::regconfig,
      regexp_replace(coalesce(content, ''), '<[^>]+>', ' ', 'g')
    ),
    'C'
  );

create index if not exists articles_search_vector_idx
  on public.articles
  using gin (search_vector);
