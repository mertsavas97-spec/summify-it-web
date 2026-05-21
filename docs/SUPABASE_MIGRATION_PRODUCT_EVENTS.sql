-- Lightweight product analytics on usage_events (privacy-safe, high-value events only).
-- Run once in Supabase SQL Editor.

alter table public.usage_events
  add column if not exists session_id text,
  add column if not exists source_type text,
  add column if not exists plan text,
  add column if not exists success boolean,
  add column if not exists failure_stage text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- Backfill source_type from legacy source_kind
update public.usage_events
set source_type = source_kind
where source_type is null and source_kind is not null;

create index if not exists usage_events_created_at_idx
  on public.usage_events (created_at desc);

create index if not exists usage_events_event_type_idx
  on public.usage_events (event_type);

create index if not exists usage_events_user_id_idx
  on public.usage_events (user_id)
  where user_id is not null;

create index if not exists usage_events_session_id_idx
  on public.usage_events (session_id)
  where session_id is not null;

create index if not exists usage_events_source_type_idx
  on public.usage_events (source_type)
  where source_type is not null;

create index if not exists usage_events_intelligence_mode_idx
  on public.usage_events (intelligence_mode)
  where intelligence_mode is not null;

comment on column public.usage_events.session_id is
  'Anonymous workspace session id when user_id is null.';
comment on column public.usage_events.metadata is
  'Small JSON only — no document text, filenames, or payment IDs.';
