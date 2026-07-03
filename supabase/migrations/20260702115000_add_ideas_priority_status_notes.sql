-- Add missing fields to `public.ideas` for Idea Bank.
-- Safe to run multiple times.

alter table public.ideas
  add column if not exists priority integer not null default 2,
  add column if not exists status text not null default 'active',
  add column if not exists notes text null;

-- Ensure tags column exists as text[] (if you created it as jsonb, adjust types/database.ts accordingly).
alter table public.ideas
  add column if not exists tags text[] null;

create index if not exists ideas_user_id_idx on public.ideas (user_id);
create index if not exists ideas_user_id_created_at_idx on public.ideas (user_id, created_at desc);
create index if not exists ideas_user_id_status_idx on public.ideas (user_id, status);

-- Optional: small guardrail for priority values (1=low, 2=medium, 3=high).
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ideas_priority_check'
  ) then
    alter table public.ideas
      add constraint ideas_priority_check check (priority in (1, 2, 3));
  end if;
end $$;

