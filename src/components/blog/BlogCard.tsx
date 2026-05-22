import Link from "next/link";
import type { BlogPost } from "@/data/blog-posts";
import { getBlogCategory } from "@/data/blog-categories";

type BlogCardProps = {
  post: BlogPost;
  compact?: boolean;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function BlogCard({ post, compact = false }: BlogCardProps) {
  const category = getBlogCategory(post.categoryId);

  if (compact) {
    return (
      <article>
        <Link
          href={`/blog/${post.slug}`}
          className="text-sm font-medium text-violet-300/90 hover:text-violet-200 hover:underline"
        >
          {post.title}
        </Link>
        <p className="mt-0.5 line-clamp-2 text-xs text-zinc-600">{post.description}</p>
      </article>
    );
  }

  return (
    <article className="group rounded-xl border border-white/[0.06] bg-zinc-950/50 p-5 transition-colors hover:border-violet-500/25 hover:bg-violet-950/10">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
        <Link
          href={`/blog/category/${category.slug}`}
          className="rounded border border-violet-500/20 bg-violet-950/30 px-1.5 py-px text-violet-300/80 transition-colors hover:border-violet-500/35"
        >
          {category.name}
        </Link>
        <span>{formatDate(post.date)}</span>
        <span aria-hidden>·</span>
        <span>{post.readingTime}</span>
        {post.trending ? (
          <>
            <span aria-hidden>·</span>
            <span className="text-amber-400/80">Trending</span>
          </>
        ) : null}
      </div>
      <h2 className="mt-3 text-lg font-semibold text-zinc-100 group-hover:text-white">
        <Link href={`/blog/${post.slug}`} className="outline-offset-4">
          {post.title}
        </Link>
      </h2>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-500">
        {post.description}
      </p>
      <Link
        href={`/blog/${post.slug}`}
        className="mt-4 inline-block text-sm font-medium text-violet-300/90 hover:text-violet-200"
      >
        Read article →
      </Link>
    </article>
  );
}
