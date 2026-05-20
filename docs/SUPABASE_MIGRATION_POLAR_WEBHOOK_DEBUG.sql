-- Polar webhook debug log (serverless-safe; service role only)
-- Run once in Supabase SQL Editor after deploying webhook debug persistence.

create table if not exists public.polar_webhook_debug_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text,
  delivery_id text,
  polar_customer_id text,
  polar_subscription_id text,
  customer_email text,
  resolved_user_id uuid,
  resolved_plan text,
  resolved_interval text,
  sync_status text not null default 'started',
  error_code text,
  error_message text,
  payload_summary jsonb not null default '{}'::jsonb
);

comment on table public.polar_webhook_debug_events is
  'Append-only Polar webhook sync audit trail for serverless debugging (service role writes only).';

create index if not exists polar_webhook_debug_events_created_at_idx
  on public.polar_webhook_debug_events (created_at desc);

create index if not exists polar_webhook_debug_events_customer_email_idx
  on public.polar_webhook_debug_events (lower(customer_email))
  where customer_email is not null;

create index if not exists polar_webhook_debug_events_resolved_user_id_idx
  on public.polar_webhook_debug_events (resolved_user_id)
  where resolved_user_id is not null;

alter table public.polar_webhook_debug_events enable row level security;

-- No policies: only service role (webhook + admin debug routes) may read/write.
