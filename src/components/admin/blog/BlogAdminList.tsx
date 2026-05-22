"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BLOG_CATEGORIES, type BlogCategoryId } from "@/data/blog-categories";
import { adminListBlogPosts } from "@/server/admin/blog/actions";
import type { CmsBlogListFilters, CmsBlogStatus } from "@/types/cms-blog";

type ListPost = {
  id: string;
  slug: string;
  title: string;
  categoryId: string;
  status: CmsBlogStatus;
  seoScore: number;
  updatedAt: string;
  publishedAt: string | null;
};

type BlogAdminListProps = {
  initialPosts: ListPost[];
  initialError?: string;
};

export function BlogAdminList({ initialPosts, initialError }: BlogAdminListProps) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [error, setError] = useState(initialError);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<BlogCategoryId | "all">("all");
  const [status, setStatus] = useState<CmsBlogStatus | "all">("all");
  const [pending, startTransition] = useTransition();

  const refresh = () => {
    startTransition(async () => {
      const filters: CmsBlogListFilters = {
        search,
        categoryId: category === "all" ? undefined : category,
        status: status === "all" ? "all" : status,
        sort: "updated_desc",
      };
      const result = await adminListBlogPosts(filters);
      setPosts(result.posts);
      setError(result.error);
      router.refresh();
    });
  };

  const filtered = useMemo(() => posts, [posts]);

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-amber-500/25 bg-amber-950/20 px-4 py-3 text-sm text-amber-200/90">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && refresh()}
          placeholder="Search title or slug…"
          className="min-w-[200px] flex-1 rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as BlogCategoryId | "all")}
          className="rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="all">All categories</option>
          {BLOG_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as CmsBlogStatus | "all")}
          className="rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <button
          type="button"
          onClick={refresh}
          disabled={pending}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40"
        >
          Apply
        </button>
        <Link
          href="/dashboard/admin/blog/new"
          className="rounded-lg border border-violet-500/30 bg-violet-950/40 px-4 py-2 text-sm font-medium text-violet-200 hover:bg-violet-950/60"
        >
          New post
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-white/[0.06] bg-zinc-900/60 text-[11px] uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">SEO</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  No posts yet. Create your first CMS article.
                </td>
              </tr>
            ) : (
              filtered.map((post) => (
                <tr key={post.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-200">{post.title}</p>
                    <p className="text-[11px] text-zinc-600">/blog/{post.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{post.categoryId}</td>
                  <td className="px-4 py-3 capitalize text-zinc-400">{post.status}</td>
                  <td className="px-4 py-3 tabular-nums text-zinc-300">{post.seoScore}/100</td>
                  <td className="px-4 py-3 text-[11px] text-zinc-500">
                    {new Date(post.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/admin/blog/${post.id}`}
                        className="text-violet-300 hover:text-violet-200"
                      >
                        Edit
                      </Link>
                      {post.status === "published" ? (
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="text-zinc-500 hover:text-zinc-300"
                        >
                          Preview
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
