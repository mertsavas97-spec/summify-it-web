-- ---------------------------------------------------------------------------
-- Phase 9C — Memory / spaced repetition
-- Private review data for authenticated users only.
-- ---------------------------------------------------------------------------

create table if not exists public.review_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  analysis_id uuid not null references public.saved_analyses (id) on delete cascade,
  source_kind text not null check (source_kind in ('learn_card', 'key_insight', 'important_concept')),
  source_id text not null,
  prompt text not null,
  answer text not null,
  context text,
  difficulty text not null default 'new' check (difficulty in ('new', 'learning', 'steady', 'difficult', 'mastered')),
  retention_score numeric not null default 0.6 check (retention_score >= 0 and retention_score <= 1),
  ease_factor numeric not null default 2.3 check (ease_factor >= 1.3 and ease_factor <= 3.0),
  interval_days integer not null default 0 check (interval_days >= 0),
  stability_days integer not null default 1 check (stability_days >= 1),
  lapses integer not null default 0 check (lapses >= 0),
  review_count integer not null default 0 check (review_count >= 0),
  last_reviewed_at timestamptz,
  next_review_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (user_id, analysis_id, source_kind, source_id)
);

create index if not exists review_items_user_due_idx
  on public.review_items (user_id, next_review_at)
  where archived_at is null;

create index if not exists review_items_analysis_idx
  on public.review_items (analysis_id);

alter table public.review_items enable row level security;

grant select, insert, update, delete on public.review_items to authenticated;

create policy "review_items_select_own"
  on public.review_items for select
  using (auth.uid() = user_id);

create policy "review_items_insert_own"
  on public.review_items for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.saved_analyses sa
      where sa.id = analysis_id
        and sa.user_id = auth.uid()
    )
  );

create policy "review_items_update_own"
  on public.review_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "review_items_delete_own"
  on public.review_items for delete
  using (auth.uid() = user_id);

drop trigger if exists review_items_set_updated_at on public.review_items;
create trigger review_items_set_updated_at
  before update on public.review_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- review_sessions
-- ---------------------------------------------------------------------------
create table if not exists public.review_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  cards_reviewed integer not null default 0 check (cards_reviewed >= 0),
  again_count integer not null default 0 check (again_count >= 0),
  hard_count integer not null default 0 check (hard_count >= 0),
  good_count integer not null default 0 check (good_count >= 0),
  easy_count integer not null default 0 check (easy_count >= 0),
  retention_score numeric check (retention_score is null or (retention_score >= 0 and retention_score <= 1)),
  metadata jsonb
);

create index if not exists review_sessions_user_started_idx
  on public.review_sessions (user_id, started_at desc);

alter table public.review_sessions enable row level security;

grant select, insert, update, delete on public.review_sessions to authenticated;

create policy "review_sessions_select_own"
  on public.review_sessions for select
  using (auth.uid() = user_id);

create policy "review_sessions_insert_own"
  on public.review_sessions for insert
  with check (auth.uid() = user_id);

create policy "review_sessions_update_own"
  on public.review_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "review_sessions_delete_own"
  on public.review_sessions for delete
  using (auth.uid() = user_id);

-- Public share safety:
-- No anon grants or policies are created for review_items or review_sessions.
-- Public share pages continue to read only saved_analyses fields exposed by Phase 9A.
