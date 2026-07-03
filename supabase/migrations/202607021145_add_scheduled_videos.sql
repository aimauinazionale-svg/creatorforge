-- Content Calendar: scheduled videos
-- Safe to run multiple times.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.scheduled_videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  channel_id uuid not null references public.channels (id) on delete cascade,
  title text not null,
  idea_id uuid null references public.ideas (id) on delete set null,
  scheduled_at timestamptz not null,
  notes text null,
  status text not null default 'planned' check (status in ('planned', 'draft', 'scheduled', 'published', 'canceled')),
  thumbnail_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scheduled_videos_user_id_idx on public.scheduled_videos (user_id);
create index if not exists scheduled_videos_channel_id_idx on public.scheduled_videos (channel_id);
create index if not exists scheduled_videos_scheduled_at_idx on public.scheduled_videos (scheduled_at);

drop trigger if exists set_scheduled_videos_updated_at on public.scheduled_videos;
create trigger set_scheduled_videos_updated_at
before update on public.scheduled_videos
for each row
execute function public.set_updated_at();

alter table public.scheduled_videos enable row level security;

drop policy if exists "scheduled_videos_select_own" on public.scheduled_videos;
create policy "scheduled_videos_select_own"
on public.scheduled_videos
for select
using (auth.uid() = user_id);

drop policy if exists "scheduled_videos_insert_own" on public.scheduled_videos;
create policy "scheduled_videos_insert_own"
on public.scheduled_videos
for insert
with check (auth.uid() = user_id);

drop policy if exists "scheduled_videos_update_own" on public.scheduled_videos;
create policy "scheduled_videos_update_own"
on public.scheduled_videos
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "scheduled_videos_delete_own" on public.scheduled_videos;
create policy "scheduled_videos_delete_own"
on public.scheduled_videos
for delete
using (auth.uid() = user_id);

