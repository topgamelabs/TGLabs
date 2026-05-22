create table if not exists public.focused_games (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null default 'mobile',
  platforms text[] not null default '{}',
  official_website text,
  status text not null default 'active' check (status in ('active', 'paused')),
  priority text not null default 'normal' check (priority in ('high', 'normal', 'low')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.focused_game_sources (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.focused_games(id) on delete cascade,
  source_type text not null default 'news_page' check (
    source_type in (
      'official_site',
      'news_page',
      'manual_url',
      'youtube',
      'x',
      'facebook',
      'steam',
      'app_store',
      'google_play'
    )
  ),
  source_name text,
  source_url text not null,
  trust_level text not null default 'official' check (trust_level in ('official', 'semi_official', 'community')),
  check_frequency text not null default 'manual' check (check_frequency in ('manual', 'daily', 'weekly')),
  enabled boolean not null default true,
  last_checked_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id, source_url)
);

alter table public.raw_news_queue
  add column if not exists source_track text not null default 'general',
  add column if not exists focused_game_id uuid references public.focused_games(id) on delete set null,
  add column if not exists focused_source_id uuid references public.focused_game_sources(id) on delete set null,
  add column if not exists detected_update_type text,
  add column if not exists focused_confidence numeric;

create index if not exists focused_games_status_idx
  on public.focused_games (status);

create index if not exists focused_game_sources_game_id_idx
  on public.focused_game_sources (game_id);

create index if not exists focused_game_sources_enabled_idx
  on public.focused_game_sources (enabled);

create index if not exists raw_news_queue_source_track_idx
  on public.raw_news_queue (source_track);

create index if not exists raw_news_queue_focused_game_id_idx
  on public.raw_news_queue (focused_game_id);
