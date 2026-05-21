-- Optional: grant admin dashboard access via profile role (in addition to email allowlist).
-- Run once in Supabase SQL Editor.

alter table public.profiles
  add column if not exists role text;

comment on column public.profiles.role is
  'Optional access role. Set to admin for internal dashboard access.';

-- Example:
-- update public.profiles set role = 'admin' where email = 'you@example.com';
