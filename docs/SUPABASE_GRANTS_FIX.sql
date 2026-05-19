-- Run once in Supabase SQL Editor if you see:
-- "permission denied for table profiles" (or usage_events / user_limits / saved_analyses)
--
-- Tables created via raw SQL do not automatically grant privileges to the
-- `authenticated` role. RLS policies alone are not enough.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.usage_events to authenticated;
grant select, insert, update, delete on public.user_limits to authenticated;
grant select, insert, update, delete on public.saved_analyses to authenticated;
