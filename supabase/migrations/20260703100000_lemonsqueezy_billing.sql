-- LemonSqueezy billing columns on users (idempotent)
alter table if exists public.users
  add column if not exists lemonsqueezy_customer_id text,
  add column if not exists lemonsqueezy_subscription_id text,
  add column if not exists subscription_status text;
