-- =============================================================================
-- CreatorForge — full schema (idempotent)
-- =============================================================================
--
-- HOW TO RUN
-- 1. Open Supabase Dashboard → SQL Editor → New query
-- 2. Paste this entire file and click Run
-- 3. Safe to run multiple times (empty project OR partial migrations already applied)
-- 4. Does NOT drop tables or delete data
--
-- If you previously ran incremental files in supabase/migrations/, this file
-- reconciles any missing columns before creating indexes and RLS policies.
-- =============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables (CREATE IF NOT EXISTS — skipped when table already exists)
-- ---------------------------------------------------------------------------

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  onboarding_completed boolean not null default false,
  onboarding_step int not null default 0,
  onboarding_data jsonb not null default '{}'::jsonb,
  youtube_channel_id text,
  youtube_tokens jsonb,
  plan_type text not null default 'free',
  lemonsqueezy_customer_id text,
  lemonsqueezy_subscription_id text,
  subscription_status text,
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
  user_id uuid not null references auth.users(id) on delete cascade,
  channel_id uuid not null references public.channels(id) on delete cascade,
  title text not null,
  idea_id uuid references public.ideas(id) on delete set null,
  scheduled_at timestamptz not null,
  notes text,
  status text not null default 'planned' check (status in ('planned', 'draft', 'scheduled', 'published', 'canceled')),
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

create table if not exists public.email_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  email text not null,
  unsubscribed_all boolean not null default false,
  weekly_digest_enabled boolean not null default true,
  weekly_digest_frequency text not null default 'weekly' check (weekly_digest_frequency in ('weekly', 'biweekly')),
  competitor_alerts_enabled boolean not null default true,
  publishing_reminders_enabled boolean not null default true,
  goal_reached_enabled boolean not null default true,
  onboarding_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  to_email text not null,
  type text not null,
  subject text not null,
  status text not null check (status in ('sent', 'failed', 'skipped')),
  resend_id text,
  error text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Column patches (for tables created by older/partial migrations)
-- CREATE TABLE IF NOT EXISTS does not add missing columns — this section does.
-- ---------------------------------------------------------------------------

alter table if exists public.users
  add column if not exists email text not null default '',
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_step int not null default 0,
  add column if not exists onboarding_data jsonb not null default '{}'::jsonb,
  add column if not exists youtube_channel_id text,
  add column if not exists youtube_tokens jsonb,
  add column if not exists plan_type text not null default 'free',
  add column if not exists lemonsqueezy_customer_id text,
  add column if not exists lemonsqueezy_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists created_at timestamptz not null default now();

alter table if exists public.channels
  add column if not exists user_id uuid,
  add column if not exists youtube_channel_id text,
  add column if not exists channel_data jsonb,
  add column if not exists stats_cache jsonb,
  add column if not exists last_updated timestamptz;

alter table if exists public.competitors
  add column if not exists user_id uuid,
  add column if not exists youtube_channel_id text,
  add column if not exists channel_name text,
  add column if not exists channel_url text,
  add column if not exists channel_data jsonb,
  add column if not exists stats_cache jsonb,
  add column if not exists last_updated timestamptz,
  add column if not exists tracked_since timestamptz not null default now();

alter table if exists public.ideas
  add column if not exists user_id uuid,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists category text,
  add column if not exists tags text[],
  add column if not exists priority int not null default 2,
  add column if not exists status text not null default 'active',
  add column if not exists notes text,
  add column if not exists created_at timestamptz not null default now();

-- workflows / videos: channel_id is required by app code and RLS below
alter table if exists public.workflows
  add column if not exists channel_id uuid,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists status text not null default 'idea',
  add column if not exists notes text,
  add column if not exists due_date timestamptz,
  add column if not exists "order" int not null default 0,
  add column if not exists youtube_video_id text,
  add column if not exists created_at timestamptz not null default now();

alter table if exists public.videos
  add column if not exists channel_id uuid,
  add column if not exists youtube_video_id text,
  add column if not exists title text,
  add column if not exists metrics jsonb,
  add column if not exists published_at timestamptz;

alter table if exists public.scheduled_videos
  add column if not exists user_id uuid,
  add column if not exists channel_id uuid,
  add column if not exists title text,
  add column if not exists idea_id uuid,
  add column if not exists scheduled_at timestamptz,
  add column if not exists notes text,
  add column if not exists status text not null default 'planned',
  add column if not exists thumbnail_url text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.ai_requests
  add column if not exists user_id uuid,
  add column if not exists request_type text,
  add column if not exists created_at timestamptz not null default now();

alter table if exists public.thumbnail_analyses
  add column if not exists user_id uuid,
  add column if not exists image_url text,
  add column if not exists analysis jsonb,
  add column if not exists overall_score int,
  add column if not exists created_at timestamptz not null default now();

alter table if exists public.email_preferences
  add column if not exists email text,
  add column if not exists unsubscribed_all boolean not null default false,
  add column if not exists weekly_digest_enabled boolean not null default true,
  add column if not exists weekly_digest_frequency text not null default 'weekly',
  add column if not exists competitor_alerts_enabled boolean not null default true,
  add column if not exists publishing_reminders_enabled boolean not null default true,
  add column if not exists goal_reached_enabled boolean not null default true,
  add column if not exists onboarding_enabled boolean not null default true,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now();

alter table if exists public.email_logs
  add column if not exists user_id uuid,
  add column if not exists to_email text,
  add column if not exists type text,
  add column if not exists subject text,
  add column if not exists status text,
  add column if not exists resend_id text,
  add column if not exists error text,
  add column if not exists metadata jsonb,
  add column if not exists created_at timestamptz not null default now();

-- Backfill channel_id on legacy workflows rows that used user_id (if present)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'workflows' and column_name = 'user_id'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'workflows' and column_name = 'channel_id'
  ) then
    update public.workflows w
    set channel_id = c.id
    from public.channels c
    where w.channel_id is null and c.user_id = w.user_id;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Foreign keys (idempotent)
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'workflows_channel_id_fkey') then
    alter table public.workflows
      add constraint workflows_channel_id_fkey
      foreign key (channel_id) references public.channels(id) on delete cascade;
  end if;
exception when others then
  raise notice 'workflows_channel_id_fkey skipped: %', sqlerrm;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'videos_channel_id_fkey') then
    alter table public.videos
      add constraint videos_channel_id_fkey
      foreign key (channel_id) references public.channels(id) on delete cascade;
  end if;
exception when others then
  raise notice 'videos_channel_id_fkey skipped: %', sqlerrm;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'scheduled_videos_channel_id_fkey') then
    alter table public.scheduled_videos
      add constraint scheduled_videos_channel_id_fkey
      foreign key (channel_id) references public.channels(id) on delete cascade;
  end if;
exception when others then
  raise notice 'scheduled_videos_channel_id_fkey skipped: %', sqlerrm;
end $$;

-- ---------------------------------------------------------------------------
-- Indexes (only after columns exist)
-- ---------------------------------------------------------------------------

create index if not exists ideas_user_id_idx on public.ideas (user_id);
create index if not exists ideas_user_id_created_at_idx on public.ideas (user_id, created_at desc);
create index if not exists ideas_user_id_status_idx on public.ideas (user_id, status);
create index if not exists ai_requests_user_id_created_at_idx on public.ai_requests (user_id, created_at desc);
create index if not exists scheduled_videos_user_id_idx on public.scheduled_videos (user_id);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'scheduled_videos' and column_name = 'channel_id'
  ) then
    execute 'create index if not exists scheduled_videos_channel_id_idx on public.scheduled_videos (channel_id)';
  end if;
end $$;

create index if not exists scheduled_videos_scheduled_at_idx on public.scheduled_videos (scheduled_at);
create index if not exists email_preferences_email_idx on public.email_preferences (email);
create index if not exists email_logs_user_created_idx on public.email_logs (user_id, created_at desc);
create index if not exists email_logs_created_idx on public.email_logs (created_at desc);
create index if not exists email_logs_type_created_idx on public.email_logs (type, created_at desc);

-- ---------------------------------------------------------------------------
-- Constraints (idempotent)
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ideas_priority_check') then
    alter table public.ideas add constraint ideas_priority_check check (priority in (1, 2, 3));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'scheduled_videos_status_check') then
    alter table public.scheduled_videos
      add constraint scheduled_videos_status_check
      check (status in ('planned', 'draft', 'scheduled', 'published', 'canceled'));
  end if;
exception when others then
  raise notice 'scheduled_videos_status_check skipped: %', sqlerrm;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'email_preferences_weekly_digest_frequency_check') then
    alter table public.email_preferences
      add constraint email_preferences_weekly_digest_frequency_check
      check (weekly_digest_frequency in ('weekly', 'biweekly'));
  end if;
exception when others then
  raise notice 'email_preferences_weekly_digest_frequency_check skipped: %', sqlerrm;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'email_logs_status_check') then
    alter table public.email_logs
      add constraint email_logs_status_check
      check (status in ('sent', 'failed', 'skipped'));
  end if;
exception when others then
  raise notice 'email_logs_status_check skipped: %', sqlerrm;
end $$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_scheduled_videos_updated_at on public.scheduled_videos;
create trigger set_scheduled_videos_updated_at
before update on public.scheduled_videos
for each row execute function public.set_updated_at();

drop trigger if exists trg_email_preferences_updated_at on public.email_preferences;
create trigger trg_email_preferences_updated_at
before update on public.email_preferences
for each row execute function public.set_updated_at();

-- Auto-create public.users row on auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.users enable row level security;
alter table public.channels enable row level security;
alter table public.competitors enable row level security;
alter table public.ideas enable row level security;
alter table public.workflows enable row level security;
alter table public.videos enable row level security;
alter table public.scheduled_videos enable row level security;
alter table public.ai_requests enable row level security;
alter table public.thumbnail_analyses enable row level security;
alter table public.email_preferences enable row level security;
alter table public.email_logs enable row level security;

-- users
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users for select using (auth.uid() = id);
drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users for update using (auth.uid() = id) with check (auth.uid() = id);

-- channels
drop policy if exists "channels_select_own" on public.channels;
create policy "channels_select_own" on public.channels for select using (auth.uid() = user_id);
drop policy if exists "channels_insert_own" on public.channels;
create policy "channels_insert_own" on public.channels for insert with check (auth.uid() = user_id);
drop policy if exists "channels_update_own" on public.channels;
create policy "channels_update_own" on public.channels for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "channels_delete_own" on public.channels;
create policy "channels_delete_own" on public.channels for delete using (auth.uid() = user_id);

-- competitors
drop policy if exists "competitors_select_own" on public.competitors;
create policy "competitors_select_own" on public.competitors for select using (auth.uid() = user_id);
drop policy if exists "competitors_insert_own" on public.competitors;
create policy "competitors_insert_own" on public.competitors for insert with check (auth.uid() = user_id);
drop policy if exists "competitors_update_own" on public.competitors;
create policy "competitors_update_own" on public.competitors for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "competitors_delete_own" on public.competitors;
create policy "competitors_delete_own" on public.competitors for delete using (auth.uid() = user_id);

-- ideas
drop policy if exists "ideas_select_own" on public.ideas;
create policy "ideas_select_own" on public.ideas for select using (auth.uid() = user_id);
drop policy if exists "ideas_insert_own" on public.ideas;
create policy "ideas_insert_own" on public.ideas for insert with check (auth.uid() = user_id);
drop policy if exists "ideas_update_own" on public.ideas;
create policy "ideas_update_own" on public.ideas for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "ideas_delete_own" on public.ideas;
create policy "ideas_delete_own" on public.ideas for delete using (auth.uid() = user_id);

-- workflows / videos (via channel ownership — only when channel_id column exists)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'workflows' and column_name = 'channel_id'
  ) then
    execute $policy$
      drop policy if exists "workflows_select_own" on public.workflows;
      create policy "workflows_select_own" on public.workflows for select using (
        exists (select 1 from public.channels c where c.id = workflows.channel_id and c.user_id = auth.uid())
      );
      drop policy if exists "workflows_insert_own" on public.workflows;
      create policy "workflows_insert_own" on public.workflows for insert with check (
        exists (select 1 from public.channels c where c.id = workflows.channel_id and c.user_id = auth.uid())
      );
      drop policy if exists "workflows_update_own" on public.workflows;
      create policy "workflows_update_own" on public.workflows for update using (
        exists (select 1 from public.channels c where c.id = workflows.channel_id and c.user_id = auth.uid())
      ) with check (
        exists (select 1 from public.channels c where c.id = workflows.channel_id and c.user_id = auth.uid())
      );
      drop policy if exists "workflows_delete_own" on public.workflows;
      create policy "workflows_delete_own" on public.workflows for delete using (
        exists (select 1 from public.channels c where c.id = workflows.channel_id and c.user_id = auth.uid())
      );
    $policy$;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'videos' and column_name = 'channel_id'
  ) then
    execute $policy$
      drop policy if exists "videos_select_own" on public.videos;
      create policy "videos_select_own" on public.videos for select using (
        exists (select 1 from public.channels c where c.id = videos.channel_id and c.user_id = auth.uid())
      );
      drop policy if exists "videos_insert_own" on public.videos;
      create policy "videos_insert_own" on public.videos for insert with check (
        exists (select 1 from public.channels c where c.id = videos.channel_id and c.user_id = auth.uid())
      );
      drop policy if exists "videos_update_own" on public.videos;
      create policy "videos_update_own" on public.videos for update using (
        exists (select 1 from public.channels c where c.id = videos.channel_id and c.user_id = auth.uid())
      ) with check (
        exists (select 1 from public.channels c where c.id = videos.channel_id and c.user_id = auth.uid())
      );
      drop policy if exists "videos_delete_own" on public.videos;
      create policy "videos_delete_own" on public.videos for delete using (
        exists (select 1 from public.channels c where c.id = videos.channel_id and c.user_id = auth.uid())
      );
    $policy$;
  end if;
end $$;

-- scheduled_videos
drop policy if exists "scheduled_videos_select_own" on public.scheduled_videos;
create policy "scheduled_videos_select_own" on public.scheduled_videos for select using (auth.uid() = user_id);
drop policy if exists "scheduled_videos_insert_own" on public.scheduled_videos;
create policy "scheduled_videos_insert_own" on public.scheduled_videos for insert with check (auth.uid() = user_id);
drop policy if exists "scheduled_videos_update_own" on public.scheduled_videos;
create policy "scheduled_videos_update_own" on public.scheduled_videos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "scheduled_videos_delete_own" on public.scheduled_videos;
create policy "scheduled_videos_delete_own" on public.scheduled_videos for delete using (auth.uid() = user_id);

-- ai_requests
drop policy if exists "ai_requests_select_own" on public.ai_requests;
create policy "ai_requests_select_own" on public.ai_requests for select using (auth.uid() = user_id);
drop policy if exists "ai_requests_insert_own" on public.ai_requests;
create policy "ai_requests_insert_own" on public.ai_requests for insert with check (auth.uid() = user_id);

-- thumbnail_analyses
drop policy if exists "thumbnail_analyses_select_own" on public.thumbnail_analyses;
create policy "thumbnail_analyses_select_own" on public.thumbnail_analyses for select using (auth.uid() = user_id);
drop policy if exists "thumbnail_analyses_insert_own" on public.thumbnail_analyses;
create policy "thumbnail_analyses_insert_own" on public.thumbnail_analyses for insert with check (auth.uid() = user_id);
drop policy if exists "thumbnail_analyses_delete_own" on public.thumbnail_analyses;
create policy "thumbnail_analyses_delete_own" on public.thumbnail_analyses for delete using (auth.uid() = user_id);

-- email_preferences
drop policy if exists "email_preferences_select_own" on public.email_preferences;
create policy "email_preferences_select_own" on public.email_preferences for select using (auth.uid() = user_id);
drop policy if exists "email_preferences_insert_own" on public.email_preferences;
create policy "email_preferences_insert_own" on public.email_preferences for insert with check (auth.uid() = user_id);
drop policy if exists "email_preferences_update_own" on public.email_preferences;
create policy "email_preferences_update_own" on public.email_preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- email_logs (users can read their own logs)
drop policy if exists "email_logs_select_own" on public.email_logs;
create policy "email_logs_select_own" on public.email_logs for select using (auth.uid() = user_id);
