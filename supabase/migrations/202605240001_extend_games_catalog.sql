alter table public.games
  add column if not exists aliases text[] not null default '{}',
  add column if not exists platforms text[] not null default '{}',
  add column if not exists genre text,
  add column if not exists developer text,
  add column if not exists publisher text,
  add column if not exists official_website text,
  add column if not exists official_x text,
  add column if not exists official_facebook text,
  add column if not exists official_youtube text,
  add column if not exists app_store_url text,
  add column if not exists google_play_url text,
  add column if not exists steam_url text,
  add column if not exists playstation_url text,
  add column if not exists nintendo_url text,
  add column if not exists xbox_url text,
  add column if not exists status text not null default 'active',
  add column if not exists description text,
  add column if not exists last_seen_at timestamptz,
  add column if not exists metadata_source_url text,
  add column if not exists confidence numeric not null default 1,
  add column if not exists needs_review boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

update public.games
set platforms = array[platform]
where platform is not null
  and platform <> ''
  and (platforms is null or cardinality(platforms) = 0);

create index if not exists games_slug_idx
  on public.games (slug);

create index if not exists games_platform_idx
  on public.games (platform);

create index if not exists games_needs_review_idx
  on public.games (needs_review);
