# Supabase schema — Summify (Phase 7B)

Paste the SQL below into the **Supabase SQL Editor** and run it once per project.  
Do **not** commit service-role keys; the app uses only the **anon** key with RLS.

Prerequisites: Supabase Auth enabled (magic link from Phase 7A).

---

## Full migration SQL

```sql
-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  plan text not null default 'beta',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Required: without these GRANTs, authenticated clients get "permission denied for table profiles"
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.usage_events to authenticated;
grant select, insert, update, delete on public.user_limits to authenticated;
grant select, insert, update, delete on public.saved_analyses to authenticated;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- usage_events
-- ---------------------------------------------------------------------------
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  event_type text not null,
  source_kind text,
  intelligence_mode text,
  provider_used text,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_id_created_at_idx
  on public.usage_events (user_id, created_at desc);

alter table public.usage_events enable row level security;

create policy "usage_events_select_own"
  on public.usage_events for select
  using (auth.uid() = user_id);

create policy "usage_events_insert_own"
  on public.usage_events for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- user_limits (beta usage foundation — not enforced in app yet)
-- ---------------------------------------------------------------------------
create table if not exists public.user_limits (
  user_id uuid primary key references auth.users (id) on delete cascade,
  daily_analysis_count integer not null default 0,
  last_reset_date date not null default (timezone('utc', now()))::date,
  monthly_analysis_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.user_limits enable row level security;

create policy "user_limits_select_own"
  on public.user_limits for select
  using (auth.uid() = user_id);

create policy "user_limits_insert_own"
  on public.user_limits for insert
  with check (auth.uid() = user_id);

create policy "user_limits_update_own"
  on public.user_limits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger (profiles)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists user_limits_set_updated_at on public.user_limits;
create trigger user_limits_set_updated_at
  before update on public.user_limits
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Optional: auto-create profile + limits on auth signup
-- (App also calls ensureProfileForUser — redundant safety net)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, plan)
  values (new.id, new.email, 'beta')
  on conflict (id) do nothing;

  insert into public.user_limits (user_id, last_reset_date)
  values (new.id, (timezone('utc', now()))::date)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

---

## Tables reference

| Table | Purpose |
|-------|---------|
| `profiles` | One row per user — email, plan (`beta`), optional name/avatar |
| `usage_events` | Append-only audit of actions (e.g. `analysis_completed`) |
| `user_limits` | Rolling daily/monthly counters for future caps |

---

## RLS summary

| Action | profiles | usage_events | user_limits |
|--------|----------|--------------|-------------|
| Read own | yes | yes | yes |
| Insert own | yes | yes | yes |
| Update own | yes | no | yes |
| Anonymous / other users | denied | denied | denied |

`usage_events.user_id` is nullable for future anonymous telemetry; the app only inserts when a session exists (RLS requires `auth.uid() = user_id`).

---

## App integration

| Feature | Location |
|---------|----------|
| Ensure profile on login | `ensureProfileForUser()` — `/auth/callback`, `/account` |
| Track analysis | `runPostAnalysisPersistence()` — `/api/analyze` |
| Save analysis | `saveAnalysis()` — authenticated `/api/analyze` success |
| Dashboard | `getUserAnalyses()` — `/dashboard` |
| Account counts | `user_limits` + `countUserAnalyses()` on `/account` |

---

## Verify in Supabase

1. **Table Editor** — `profiles`, `usage_events`, `user_limits` exist.
2. Sign in via the app → a row appears in `profiles`.
3. Run an analysis while signed in → row in `usage_events`; `user_limits` counters increment.
4. **Authentication → Policies** — RLS enabled on all three tables.

See also: `docs/AUTH_SETUP.md`.

---

## Phase 7C — `saved_analyses` (paste separately if 7B already applied)

```sql
-- ---------------------------------------------------------------------------
-- saved_analyses
-- ---------------------------------------------------------------------------
create table if not exists public.saved_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  source_kind text,
  intelligence_mode text,
  provider_used text,
  document_type text,
  source_label text,
  summary jsonb not null,
  learn_cards jsonb not null default '[]'::jsonb,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_analyses_user_id_created_at_idx
  on public.saved_analyses (user_id, created_at desc);

alter table public.saved_analyses enable row level security;

grant select, insert, update, delete on public.saved_analyses to authenticated;

create policy "saved_analyses_select_own"
  on public.saved_analyses for select
  using (auth.uid() = user_id);

create policy "saved_analyses_insert_own"
  on public.saved_analyses for insert
  with check (auth.uid() = user_id);

create policy "saved_analyses_delete_own"
  on public.saved_analyses for delete
  using (auth.uid() = user_id);

drop trigger if exists saved_analyses_set_updated_at on public.saved_analyses;
create trigger saved_analyses_set_updated_at
  before update on public.saved_analyses
  for each row execute function public.set_updated_at();
```

| Table | Purpose |
|-------|---------|
| `saved_analyses` | Structured intelligence output per completed analysis (no raw transcripts) |

| Action | saved_analyses |
|--------|----------------|
| Read own | yes |
| Insert own | yes |
| Delete own | yes |
| Update | no (append-only via new rows) |
