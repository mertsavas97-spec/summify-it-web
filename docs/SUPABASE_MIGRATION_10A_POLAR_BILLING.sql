-- Phase 10A — Polar billing columns on profiles
-- Run once in Supabase SQL Editor after deploying Polar integration.

alter table public.profiles
  add column if not exists polar_customer_id text,
  add column if not exists polar_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists current_period_end timestamptz,
  add column if not exists billing_interval text;

comment on column public.profiles.polar_customer_id is 'Polar customer ID for billing portal and webhooks';
comment on column public.profiles.polar_subscription_id is 'Active Polar subscription ID';
comment on column public.profiles.subscription_status is 'Polar subscription status (active, canceled, etc.)';
comment on column public.profiles.current_period_end is 'Current billing period end from Polar';
comment on column public.profiles.billing_interval is 'monthly or yearly';

create index if not exists profiles_polar_customer_id_idx
  on public.profiles (polar_customer_id)
  where polar_customer_id is not null;

create index if not exists profiles_polar_subscription_id_idx
  on public.profiles (polar_subscription_id)
  where polar_subscription_id is not null;

-- Webhook handler uses service role; authenticated users read own profile via existing RLS.
