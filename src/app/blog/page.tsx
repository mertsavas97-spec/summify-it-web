import Link from "next/link";
import { pageSeo } from "@/lib/page-metadata";
import {
  getAllBlogPosts,
  getComparisonBlogPosts,
  getFeaturedBlogPost,
  getLatestBlogPosts,
  getLearningWorkflowPosts,
  getTrendingBlogPosts,
} from "@/lib/blog";
import { BLOG_CATEGORIES } from "@/data/blog-categories";
import { BlogCard } from "@/components/blog/BlogCard";
import { PublicHero } from "@/components/public/PublicHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { webPageSchema } from "@/lib/schema";

export const metadata = pageSeo.blog;

export default function BlogIndexPage() {
  const featured = getFeaturedBlogPost();
  const trending = getTrendingBlogPosts(3).filter((p) => p.slug !== featured.slug);
  const latest = getLatestBlogPosts(6).filter((p) => p.slug !== featured.slug);
  const comparisons = getComparisonBlogPosts();
  const learning = getLearningWorkflowPosts();
  const all = getAllBlogPosts();

  return (
    <>
      <JsonLd
        data={[
          webPageSchema({
            name: "Summify Blog — AI PDF, YouTube, Learn & Quiz Guides",
            description:
              "Editorial guides on AI PDF summarizers, YouTube study notes, Learn cards, and quiz workflows.",
            path: "/blog",
          }),
        ]}
      />
      <PublicHero
        badge="Blog"
        title="AI PDF, YouTube, Learn cards & quiz workflows"
        description="Practical guides for students and knowledge workers — structured summarization, source-backed Learn cards, and post-learn quizzes with Summify."
        primaryCta={{ href: "/upload", label: "Try Summify free" }}
        secondaryCta={{ href: "/summarize-pdf", label: "AI PDF summarizer" }}
      />

      <section className="border-t border-white/[0.06] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/35 via-zinc-950/80 to-zinc-950/95 p-6 sm:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300/80">
              Featured
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
              <Link href={`/blog/${featured.slug}`} className="hover:text-violet-100">
                {featured.title}
              </Link>
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
              {featured.description}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
              <span>{featured.readingTime}</span>
              <span aria-hidden>·</span>
              <span>Updated {featured.updatedAt}</span>
            </div>
            <Link
              href={`/blog/${featured.slug}`}
              className="mt-5 inline-flex text-sm font-medium text-violet-300 hover:text-violet-200"
            >
              Read featured article →
            </Link>
          </div>
        </div>
      </section>

      {trending.length > 0 ? (
        <section className="border-t border-white/[0.06] px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-sm font-semibold text-zinc-200">Trending</h2>
            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trending.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-t border-white/[0.06] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-sm font-semibold text-zinc-200">Categories</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Topical hubs for PDF, YouTube, study workflows, research, and comparisons.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BLOG_CATEGORIES.map((cat) => {
              const count = all.filter((p) => p.categoryId === cat.id).length;
              return (
                <Link
                  key={cat.id}
                  href={`/blog/category/${cat.slug}`}
                  className="rounded-xl border border-white/[0.06] bg-zinc-950/50 p-4 transition-colors hover:border-violet-500/25 hover:bg-violet-950/10"
                >
                  <p className="text-sm font-medium text-zinc-100">{cat.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                    {cat.description}
                  </p>
                  <p className="mt-2 text-[11px] text-zinc-600">
                    {count} article{count === 1 ? "" : "s"}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-sm font-semibold text-zinc-200">Latest</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </section>

      {comparisons.length > 0 ? (
        <section className="border-t border-white/[0.06] px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-sm font-semibold text-zinc-200">Comparisons</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Evaluate AI PDF and document tools on structure, Learn cards, and study outputs.
            </p>
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              {comparisons.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {learning.length > 0 ? (
        <section className="border-t border-white/[0.06] px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-sm font-semibold text-zinc-200">Learning workflows</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Study notes, Learn cards, and post-learn quizzes — Summary → Learn → Quiz.
            </p>
            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {learning.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
