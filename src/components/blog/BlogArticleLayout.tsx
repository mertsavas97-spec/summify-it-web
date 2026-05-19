import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { TableOfContents } from "@/components/seo/content/TableOfContents";
import { blogPostingSchema } from "@/lib/schema";
import { getRelatedBlogPosts } from "@/lib/blog";
import type { BlogPost } from "@/data/blog-posts";
import { Button } from "@/components/ui/Button";

type BlogArticleLayoutProps = {
  post: BlogPost;
  children: React.ReactNode;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function BlogArticleLayout({ post, children }: BlogArticleLayoutProps) {
  const relatedPosts = getRelatedBlogPosts(post.slug);
  const tocItems = post.toc ?? [];

  return (
    <article className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <JsonLd data={blogPostingSchema(post)} />
      <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
        {tocItems.length > 0 && (
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <TableOfContents items={tocItems} />
            </div>
          </aside>
        )}

        <div className="min-w-0 max-w-3xl lg:max-w-none">
          <nav className="text-xs text-zinc-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-violet-300">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/blog" className="hover:text-violet-300">
              Blog
            </Link>
          </nav>

          <header className="mt-6 border-b border-white/[0.06] pb-8">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
              <span className="rounded border border-violet-500/20 bg-violet-950/30 px-1.5 py-px text-violet-300/80">
                {post.category}
              </span>
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              {post.updatedAt && post.updatedAt !== post.date && (
                <>
                  <span aria-hidden>·</span>
                  <span>Updated {formatDate(post.updatedAt)}</span>
                </>
              )}
              <span aria-hidden>·</span>
              <span>{post.readingTime}</span>
            </div>
            <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
              {post.title}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-zinc-400">{post.description}</p>
            {post.tags.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-md border border-white/[0.06] bg-zinc-900/60 px-2 py-0.5 text-[11px] text-zinc-500"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </header>

          {post.keyTakeaways && post.keyTakeaways.length > 0 && (
            <aside className="mt-8 rounded-xl border border-violet-500/15 bg-violet-950/15 p-5">
              <h2 className="text-sm font-semibold text-violet-200">Key takeaways</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-400">
                {post.keyTakeaways.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </aside>
          )}

          {tocItems.length > 0 && (
            <div className="mt-8 lg:hidden">
              <TableOfContents items={tocItems} />
            </div>
          )}

          <div className="mt-8">{children}</div>

          {post.relatedLinks.length > 0 && (
            <aside className="mt-12 rounded-xl border border-white/[0.06] bg-zinc-950/50 p-5">
              <h2 className="text-sm font-semibold text-zinc-200">Related on Summify</h2>
              <ul className="mt-3 space-y-2">
                {post.relatedLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-violet-300/90 hover:text-violet-200 hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          )}

          {relatedPosts.length > 0 && (
            <aside className="mt-10 rounded-xl border border-white/[0.06] bg-zinc-950/50 p-5">
              <h2 className="text-sm font-semibold text-zinc-200">Related articles</h2>
              <ul className="mt-3 space-y-3">
                {relatedPosts.map((related) => (
                  <li key={related.slug}>
                    <Link
                      href={`/blog/${related.slug}`}
                      className="text-sm font-medium text-violet-300/90 hover:text-violet-200 hover:underline"
                    >
                      {related.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-zinc-600">{related.description}</p>
                  </li>
                ))}
              </ul>
            </aside>
          )}

          <footer className="mt-12 flex flex-wrap gap-3 border-t border-white/[0.06] pt-8">
            <Button href="/upload" size="sm">
              Try Summify free
            </Button>
            <Button href="/blog" variant="secondary" size="sm">
              More articles
            </Button>
          </footer>
        </div>
      </div>
    </article>
  );
}
