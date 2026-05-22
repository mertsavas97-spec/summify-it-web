import { JsonLd } from "@/components/seo/JsonLd";
import { TableOfContents } from "@/components/seo/content/TableOfContents";
import { FAQSection } from "@/components/public/FAQSection";
import { BlogAuthor } from "@/components/blog/BlogAuthor";
import { BlogBreadcrumbs } from "@/components/blog/BlogBreadcrumbs";
import { BlogEndCta } from "@/components/blog/cta/BlogEndCta";
import { BlogInlineCta } from "@/components/blog/cta/BlogInlineCta";
import { BlogWorkflowCta } from "@/components/blog/cta/BlogWorkflowCta";
import { BlogRelatedLinks } from "@/components/blog/BlogRelatedLinks";
import { BlogCard } from "@/components/blog/BlogCard";
import {
  blogPostBreadcrumbItems,
  getRelatedBlogPosts,
  getRelatedProductLinks,
} from "@/lib/blog";
import { getBlogCategory } from "@/data/blog-categories";
import { blogPostJsonLdGraph } from "@/lib/schema";
import type { BlogPost } from "@/data/blog-posts";
import Link from "next/link";

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
  const productLinks = getRelatedProductLinks(post);
  const category = getBlogCategory(post.categoryId);
  const breadcrumbs = blogPostBreadcrumbItems(post);
  const tocItems = post.toc;

  return (
    <article className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <JsonLd data={blogPostJsonLdGraph(post)} />
      <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[minmax(0,220px)_1fr] lg:gap-10">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            {tocItems.length > 0 ? <TableOfContents items={tocItems} /> : null}
          </div>
        </aside>

        <div className="min-w-0 max-w-3xl lg:max-w-none">
          <BlogBreadcrumbs items={breadcrumbs} />

          <header className="mt-6 border-b border-white/[0.06] pb-8">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
              <Link
                href={`/blog/category/${category.slug}`}
                className="rounded border border-violet-500/20 bg-violet-950/30 px-1.5 py-px text-violet-300/80 transition-colors hover:border-violet-500/35"
              >
                {category.name}
              </Link>
              <time dateTime={post.date}>Published {formatDate(post.date)}</time>
              <span aria-hidden>·</span>
              <time dateTime={post.updatedAt}>Updated {formatDate(post.updatedAt)}</time>
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

          <BlogAuthor author={post.author} />

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

          {post.workflowCluster ? (
            <div className="mt-8">
              <BlogWorkflowCta cluster={post.workflowCluster} />
            </div>
          ) : null}

          <div className="mt-8">
            {children}
            <BlogInlineCta />
          </div>

          {post.faqs.length > 0 ? (
            <div className="mt-12">
              <FAQSection items={post.faqs} title="Frequently asked questions" />
            </div>
          ) : null}

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
                    {link.description ? (
                      <p className="text-xs text-zinc-600">{link.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </aside>
          )}

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <BlogRelatedLinks {...productLinks} />
            {relatedPosts.length > 0 ? (
              <aside className="rounded-xl border border-white/[0.06] bg-zinc-950/50 p-5">
                <h2 className="text-sm font-semibold text-zinc-200">Related articles</h2>
                <ul className="mt-4 space-y-4">
                  {relatedPosts.map((related) => (
                    <li key={related.slug}>
                      <BlogCard post={related} compact />
                    </li>
                  ))}
                </ul>
              </aside>
            ) : null}
          </div>

          <footer className="mt-12">
            <BlogEndCta />
          </footer>
        </div>
      </div>
    </article>
  );
}
