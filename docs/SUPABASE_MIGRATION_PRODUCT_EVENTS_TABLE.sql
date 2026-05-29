-- First-party product analytics table.
-- Run once in Supabase SQL Editor.

create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users (id) on delete set null,
  session_id text not null,
  event_name text not null,
  event_value text null,
  metadata jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists product_events_created_at_idx
  on public.product_events (created_at desc);

create index if not exists product_events_event_name_idx
  on public.product_events (event_name);

create index if not exists product_events_user_id_idx
  on public.product_events (user_id)
  where user_id is not null;

create index if not exists product_events_session_id_idx
  on public.product_events (session_id);

comment on table public.product_events is
  'Privacy-safe, high-value product usage events. No document text, filenames, or payment IDs.';

-- RLS
alter table public.product_events enable row level security;

-- Only the service role can read raw events.
create policy "service_role_read_product_events"
  on public.product_events
  for select
  to service_role
  using (true);

-- Allow authenticated users to write their own events.
create policy "authenticated_insert_own_product_events"
  on public.product_events
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Allow service role to write anything (guests + server-side writes).
create policy "service_role_insert_product_events"
  on public.product_events
  for insert
  to service_role
  with check (true);
