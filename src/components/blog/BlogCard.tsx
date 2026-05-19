import Link from "next/link";
import type { BlogPost } from "@/data/blog-posts";

type BlogCardProps = {
  post: BlogPost;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <article className="group rounded-xl border border-white/[0.06] bg-zinc-950/50 p-5 transition-colors hover:border-violet-500/25 hover:bg-violet-950/10">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
        <span className="rounded border border-violet-500/20 bg-violet-950/30 px-1.5 py-px text-violet-300/80">
          {post.category}
        </span>
        <span>{formatDate(post.date)}</span>
        <span aria-hidden>·</span>
        <span>{post.readingTime}</span>
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
