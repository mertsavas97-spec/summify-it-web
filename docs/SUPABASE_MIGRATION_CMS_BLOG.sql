-- CMS blog posts for /dashboard/admin/blog
-- Run once in Supabase SQL Editor (service role writes from server only).

create table if not exists public.cms_blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  category_id text not null default 'study-learning',
  tags text[] not null default '{}',
  cover_image_url text,
  markdown_body text not null default '',
  author_name text default 'Summify Editorial',
  author_role text default 'Product & learning workflows',
  author_bio text,
  author_href text default '/about',
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  seo_title text,
  seo_description text,
  og_title text,
  og_description text,
  canonical_url text,
  primary_keyword text,
  faqs jsonb not null default '[]'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cms_blog_posts_status_idx on public.cms_blog_posts (status);
create index if not exists cms_blog_posts_updated_idx on public.cms_blog_posts (updated_at desc);

alter table public.cms_blog_posts enable row level security;

-- No public policies: reads/writes use service role on the server.

comment on table public.cms_blog_posts is 'Summify CMS blog posts (admin-only via service role).';
