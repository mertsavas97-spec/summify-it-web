-- Google Analytics OAuth connection storage for /dashboard/admin/analytics.
-- Run once in Supabase SQL Editor.
-- Tokens are stored server-side and written via service role client.

create table if not exists public.admin_oauth_tokens (
  provider text primary key,
  refresh_token text,
  scope text,
  token_type text,
  expires_at timestamptz,
  connected_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.admin_oauth_tokens enable row level security;

-- No public policies. Access is restricted to the server-side service role client.
