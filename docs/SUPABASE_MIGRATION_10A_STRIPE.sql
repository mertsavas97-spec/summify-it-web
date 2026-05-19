-- ---------------------------------------------------------------------------
-- Phase 10A — Stripe billing profile fields
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists current_period_end timestamptz,
  add column if not exists billing_interval text check (billing_interval is null or billing_interval in ('monthly', 'yearly'));

create unique index if not exists profiles_stripe_customer_id_uidx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists profiles_stripe_subscription_id_idx
  on public.profiles (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- Optional launch default for new signups after billing launch:
-- update public.profiles set plan = 'free' where plan is null;

-- Public beta override remains supported by keeping plan = 'beta' on existing
-- accounts that should retain full preview access.
