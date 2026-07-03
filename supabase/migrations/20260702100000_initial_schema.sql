-- Core CreatorForge schema (run in Supabase SQL editor)

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  onboarding_completed boolean not null default false,
  onboarding_step int not null default 0,
  onboarding_data jsonb not null default '{}'::jsonb,
  youtube_channel_id text,
  youtube_tokens jsonb,
  plan_type text not null default 'free',
  created_at timestamptz not null default now()
);

create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  youtube_channel_id text not null,
  channel_data jsonb,
  stats_cache jsonb,
  last_updated timestamptz,
  unique (user_id)
);

create table if not exists public.competitors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  youtube_channel_id text not null,
  channel_name text,
  channel_url text,
  channel_data jsonb,
  stats_cache jsonb,
  last_updated timestamptz,
  tracked_since timestamptz not null default now(),
  unique (user_id, youtube_channel_id)
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  category text,
  tags text[],
  priority int not null default 2,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'idea',
  notes text,
  due_date timestamptz,
  "order" int not null default 0,
  youtube_video_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  youtube_video_id text not null,
  title text not null,
  metrics jsonb,
  published_at timestamptz
);

create table if not exists public.scheduled_videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  channel_id uuid not null references public.channels(id) on delete cascade,
  title text not null,
  idea_id uuid references public.ideas(id) on delete set null,
  scheduled_at timestamptz not null,
  notes text,
  status text not null default 'planned',
  thumbnail_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  request_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.thumbnail_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  image_url text not null,
  analysis jsonb not null,
  overall_score int not null,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.channels enable row level security;
alter table public.competitors enable row level security;
alter table public.ideas enable row level security;
alter table public.workflows enable row level security;
alter table public.videos enable row level security;
alter table public.scheduled_videos enable row level security;
alter table public.ai_requests enable row level security;
alter table public.thumbnail_analyses enable row level security;
