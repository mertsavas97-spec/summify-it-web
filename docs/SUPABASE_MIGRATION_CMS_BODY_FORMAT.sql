-- CMS blog body format support for Markdown and sanitized HTML.

alter table public.cms_blog_posts
add column if not exists body_format text default 'markdown';

alter table public.cms_blog_posts
drop constraint if exists cms_blog_posts_body_format_check;

alter table public.cms_blog_posts
add constraint cms_blog_posts_body_format_check
check (body_format in ('markdown', 'html'));
