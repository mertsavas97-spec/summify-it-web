-- Optional access policy and grant repair for public.cms_blog_posts.
-- Run after creating the CMS blog table when PostgREST reports permission errors.

alter table public.cms_blog_posts enable row level security;

grant usage on schema public to anon, authenticated, service_role;

revoke insert, update, delete on public.cms_blog_posts from anon, authenticated;
grant select on public.cms_blog_posts to anon, authenticated;
grant select, insert, update, delete on public.cms_blog_posts to service_role;

drop policy if exists "Published CMS blog posts are public" on public.cms_blog_posts;
create policy "Published CMS blog posts are public"
  on public.cms_blog_posts
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "Service role manages CMS blog posts" on public.cms_blog_posts;
create policy "Service role manages CMS blog posts"
  on public.cms_blog_posts
  for all
  to service_role
  using (true)
  with check (true);
