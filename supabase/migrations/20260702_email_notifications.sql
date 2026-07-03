-- Email notifications: preferences + logs
-- Create tables in `public` schema.

create extension if not exists pgcrypto;

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

create index if not exists email_preferences_email_idx on public.email_preferences (email);

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  to_email text not null,
  type text not null,
  subject text not null,
  status text not null check (status in ('sent', 'failed', 'skipped')),
  resend_id text null,
  error text null,
  metadata jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists email_logs_user_created_idx on public.email_logs (user_id, created_at desc);
create index if not exists email_logs_created_idx on public.email_logs (created_at desc);
create index if not exists email_logs_type_created_idx on public.email_logs (type, created_at desc);

-- Keep `updated_at` current.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_email_preferences_updated_at on public.email_preferences;
create trigger trg_email_preferences_updated_at
before update on public.email_preferences
for each row execute function public.set_updated_at();

