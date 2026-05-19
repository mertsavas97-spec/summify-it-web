-- ---------------------------------------------------------------------------
-- Phase 9D — Retention / daily habit metadata
-- Optional private persistence for streak freezes, recovery windows, and future
-- reminder preferences. Core stats can still be computed from review history.
-- ---------------------------------------------------------------------------

create table if not exists public.retention_stats (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_review_date date,
  streak_freezes_available integer not null default 0 check (streak_freezes_available >= 0),
  streak_freezes_used integer not null default 0 check (streak_freezes_used >= 0),
  recovery_available_until date,
  reminder_preferences jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.retention_stats enable row level security;

grant select, insert, update, delete on public.retention_stats to authenticated;

create policy "retention_stats_select_own"
  on public.retention_stats for select
  using (auth.uid() = user_id);

create policy "retention_stats_insert_own"
  on public.retention_stats for insert
  with check (auth.uid() = user_id);

create policy "retention_stats_update_own"
  on public.retention_stats for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "retention_stats_delete_own"
  on public.retention_stats for delete
  using (auth.uid() = user_id);

drop trigger if exists retention_stats_set_updated_at on public.retention_stats;
create trigger retention_stats_set_updated_at
  before update on public.retention_stats
  for each row execute function public.set_updated_at();

-- Future reminder architecture only:
-- reminder_preferences can later hold email/push/digest/calendar preferences.
-- No anon policies, cron jobs, email sends, or notification infrastructure are
-- created in Phase 9D.
