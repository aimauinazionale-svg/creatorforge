-- Onboarding wizard: persist progress on users row.
-- Safe to run multiple times.

alter table if exists public.users
  add column if not exists onboarding_completed boolean not null default false;

alter table if exists public.users
  add column if not exists onboarding_step integer not null default 0;

alter table if exists public.users
  add column if not exists onboarding_data jsonb not null default '{}'::jsonb;

