-- Phase 9A — public share columns on saved_analyses (safe to re-run)
-- Run in Supabase SQL Editor after saved_analyses exists.

alter table public.saved_analyses
  add column if not exists is_public boolean not null default false,
  add column if not exists share_id uuid,
  add column if not exists shared_at timestamptz;

create unique index if not exists saved_analyses_share_id_unique_idx
  on public.saved_analyses (share_id)
  where share_id is not null;

-- Owner updates (share toggle)
drop policy if exists "saved_analyses_update_own" on public.saved_analyses;
create policy "saved_analyses_update_own"
  on public.saved_analyses for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant update on public.saved_analyses to authenticated;

-- Public read by share_id (anon + authenticated, read-only)
drop policy if exists "saved_analyses_select_public_share" on public.saved_analyses;
create policy "saved_analyses_select_public_share"
  on public.saved_analyses for select
  to anon, authenticated
  using (is_public = true and share_id is not null);

grant select on public.saved_analyses to anon;
