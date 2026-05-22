-- CMS blog posts for /dashboard/admin/blog.
-- Run once in Supabase SQL Editor. Admin writes use the server service role client.

create table if not exists public.cms_blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text,
  category text,
  tags text[] default '{}',
  cover_image_url text,
  author text,
  body text not null,
  status text default 'draft',
  seo_title text,
  seo_description text,
  og_title text,
  og_description text,
  canonical_url text,
  published_at timestamptz,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists cms_blog_posts_slug_idx on public.cms_blog_posts (slug);
create index if not exists cms_blog_posts_status_idx on public.cms_blog_posts (status);
create index if not exists cms_blog_posts_category_idx on public.cms_blog_posts (category);
create index if not exists cms_blog_posts_updated_at_idx on public.cms_blog_posts (updated_at desc);

alter table public.cms_blog_posts enable row level security;

-- No public policies. The dashboard actions use the existing service role admin client.
