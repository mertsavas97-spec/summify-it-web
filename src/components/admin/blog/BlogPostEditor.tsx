"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BLOG_CATEGORIES, type BlogCategoryId } from "@/data/blog-categories";
import { analyzeMarkdownContent } from "@/lib/blog/contentMetrics";
import { computeBlogSeoScore } from "@/lib/blog/seoScore";
import { adminArchiveBlogPost, adminSaveBlogPost } from "@/server/admin/blog/actions";
import type { CmsBlogPostInput, CmsBlogPostRecord, CmsBlogStatus } from "@/types/cms-blog";
import { MarkdownToolbar } from "@/components/admin/blog/MarkdownToolbar";
import { LinkInsertModal } from "@/components/admin/blog/LinkInsertModal";
import { InternalLinkPicker } from "@/components/admin/blog/InternalLinkPicker";
import { SeoPreviewPanel } from "@/components/admin/blog/SeoPreviewPanel";
import { SeoScorePanel } from "@/components/admin/blog/SeoScorePanel";
import { ContentQualityPanel } from "@/components/admin/blog/ContentQualityPanel";
import { MarkdownPreview } from "@/components/admin/blog/MarkdownPreview";

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const EMPTY: CmsBlogPostInput = {
  slug: "",
  title: "",
  excerpt: "",
  categoryId: "study-learning",
  tags: [],
  markdownBody: "",
  status: "draft",
  seoTitle: "",
  seoDescription: "",
  ogTitle: "",
  ogDescription: "",
  canonicalUrl: "",
  primaryKeyword: "",
  faqs: [],
  authorName: "Summify Editorial",
  authorRole: "Product & learning workflows",
};

type BlogPostEditorProps = {
  post: CmsBlogPostRecord | null;
  cmsConfigured: boolean;
  existingSlugs: string[];
  extraBlogSlugs: { slug: string; title: string }[];
};

export function BlogPostEditor({
  post,
  cmsConfigured,
  existingSlugs,
  extraBlogSlugs,
}: BlogPostEditorProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [form, setForm] = useState<CmsBlogPostInput>(() =>
    post
      ? {
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt ?? "",
          categoryId: post.categoryId,
          tags: post.tags,
          coverImageUrl: post.coverImageUrl,
          markdownBody: post.markdownBody,
          status: post.status,
          seoTitle: post.seoTitle ?? "",
          seoDescription: post.seoDescription ?? "",
          ogTitle: post.ogTitle ?? "",
          ogDescription: post.ogDescription ?? "",
          canonicalUrl: post.canonicalUrl ?? "",
          primaryKeyword: post.primaryKeyword ?? "",
          faqs: post.faqs,
          authorName: post.authorName,
          authorRole: post.authorRole,
          authorBio: post.authorBio,
          authorHref: post.authorHref,
        }
      : { ...EMPTY },
  );
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">("desktop");
  const [linkOpen, setLinkOpen] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const metrics = useMemo(
    () => analyzeMarkdownContent(form.markdownBody),
    [form.markdownBody],
  );

  const seoResult = useMemo(
    () =>
      computeBlogSeoScore({
        ...form,
        existingSlugs,
        ignoreSlug: post?.slug,
      }),
    [form, existingSlugs, post?.slug],
  );

  const insertAtCursor = useCallback((snippet: string, cursorOffset = 0) => {
    const el = textareaRef.current;
    if (!el) {
      setForm((f) => ({ ...f, markdownBody: f.markdownBody + snippet }));
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next =
      form.markdownBody.slice(0, start) + snippet + form.markdownBody.slice(end);
    setForm((f) => ({ ...f, markdownBody: next }));
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + snippet.length + cursorOffset;
      el.setSelectionRange(pos, pos);
    });
  }, [form.markdownBody]);

  const save = (status: CmsBlogStatus, force = false) => {
    setMessage(null);
    startTransition(async () => {
      const payload = { ...form, status };
      const result = await adminSaveBlogPost(post?.id ?? null, payload, {
        forcePublish: force,
      });
      if (result.ok && result.post) {
        setMessage("Saved.");
        router.push(`/dashboard/admin/blog/${result.post.id}`);
        router.refresh();
        return;
      }
      if ("needsConfirm" in result && result.needsConfirm) {
        const ok = window.confirm(
          `Publishing warnings:\n\n${result.warnings?.join("\n")}\n\nPublish anyway?`,
        );
        if (ok) save(status, true);
        return;
      }
      setMessage(result.error ?? "Save failed.");
    });
  };

  const archive = () => {
    if (!post) return;
    startTransition(async () => {
      await adminArchiveBlogPost(post.id);
      router.push("/dashboard/admin/blog");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {!cmsConfigured ? (
        <p className="rounded-lg border border-amber-500/25 bg-amber-950/20 px-4 py-3 text-sm text-amber-200/90">
          Run <code className="text-amber-100">docs/SUPABASE_MIGRATION_CMS_BLOG.sql</code> and
          configure <code>SUPABASE_SERVICE_ROLE_KEY</code> to enable CMS storage.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-zinc-500">
              Title
              <input
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((f) => ({
                    ...f,
                    title,
                    slug: f.slug || slugifyTitle(title),
                    seoTitle: f.seoTitle || title,
                  }));
                }}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
              />
            </label>
            <label className="block text-xs text-zinc-500">
              Slug
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
              />
            </label>
            <label className="block text-xs text-zinc-500">
              Category
              <select
                value={form.categoryId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoryId: e.target.value as BlogCategoryId }))
                }
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
              >
                {BLOG_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-zinc-500">
              Primary keyword
              <input
                value={form.primaryKeyword ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, primaryKeyword: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
              />
            </label>
          </div>

          <label className="block text-xs text-zinc-500">
            Excerpt
            <textarea
              value={form.excerpt ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              rows={2}
              className="mt-1 w-full rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            />
          </label>

          <div>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-zinc-500">Markdown body</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setLinkOpen(true)}
                  className="rounded-md px-2 py-1 text-[11px] text-violet-300 hover:bg-white/5"
                >
                  Link
                </button>
                <button
                  type="button"
                  onClick={() => setInternalOpen(true)}
                  className="rounded-md px-2 py-1 text-[11px] text-violet-300 hover:bg-white/5"
                >
                  Internal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = window.prompt("Image URL");
                    if (url) insertAtCursor(`\n![Alt text](${url})\n`);
                  }}
                  className="rounded-md px-2 py-1 text-[11px] text-violet-300 hover:bg-white/5"
                >
                  Image
                </button>
              </div>
            </div>
            <MarkdownToolbar onInsert={insertAtCursor} />
            <textarea
              ref={textareaRef}
              value={form.markdownBody}
              onChange={(e) => setForm((f) => ({ ...f, markdownBody: e.target.value }))}
              rows={18}
              className="w-full rounded-b-lg rounded-t-none border border-white/[0.08] bg-zinc-900/80 px-3 py-3 font-mono text-sm leading-relaxed text-zinc-200"
              spellCheck
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-zinc-500">
              SEO title
              <input
                value={form.seoTitle ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
              />
            </label>
            <label className="block text-xs text-zinc-500">
              Meta description
              <textarea
                value={form.seoDescription ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
              />
            </label>
            <label className="block text-xs text-zinc-500">
              OG title
              <input
                value={form.ogTitle ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, ogTitle: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
              />
            </label>
            <label className="block text-xs text-zinc-500">
              OG description
              <textarea
                value={form.ogDescription ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, ogDescription: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
            <button
              type="button"
              disabled={pending || !cmsConfigured}
              onClick={() => save("draft")}
              className="rounded-lg border border-white/[0.1] bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-700 disabled:opacity-40"
            >
              Save draft
            </button>
            <button
              type="button"
              disabled={pending || !cmsConfigured}
              onClick={() => save("published")}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40"
            >
              Publish
            </button>
            {post?.status === "published" ? (
              <Link
                href={`/blog/${post.slug}`}
                target="_blank"
                className="rounded-lg px-4 py-2 text-sm text-violet-300 hover:bg-white/5"
              >
                Preview live
              </Link>
            ) : null}
            {post ? (
              <button
                type="button"
                disabled={pending}
                onClick={archive}
                className="rounded-lg px-4 py-2 text-sm text-rose-300/90 hover:bg-rose-950/30"
              >
                Archive
              </button>
            ) : null}
          </div>
          {message ? <p className="text-sm text-zinc-400">{message}</p> : null}
        </div>

        <aside className="space-y-4">
          <SeoScorePanel result={seoResult} />
          <ContentQualityPanel metrics={metrics} />
          <SeoPreviewPanel
            seoTitle={form.seoTitle || form.title}
            slug={form.slug}
            seoDescription={form.seoDescription || form.excerpt || ""}
            ogTitle={form.ogTitle || form.seoTitle || form.title}
            ogDescription={form.ogDescription || form.seoDescription || ""}
            canonicalUrl={form.canonicalUrl || ""}
          />
        </aside>
      </div>

      <div>
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setPreviewViewport("desktop")}
            className={`rounded-lg px-3 py-1.5 text-xs ${previewViewport === "desktop" ? "bg-white/10 text-white" : "text-zinc-500"}`}
          >
            Desktop
          </button>
          <button
            type="button"
            onClick={() => setPreviewViewport("mobile")}
            className={`rounded-lg px-3 py-1.5 text-xs ${previewViewport === "mobile" ? "bg-white/10 text-white" : "text-zinc-500"}`}
          >
            Mobile
          </button>
        </div>
        <MarkdownPreview
          markdown={form.markdownBody}
          title={form.title}
          viewport={previewViewport}
        />
      </div>

      <LinkInsertModal
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        onConfirm={(md) => insertAtCursor(`\n${md}\n`)}
      />
      <InternalLinkPicker
        open={internalOpen}
        extraBlogSlugs={extraBlogSlugs}
        onClose={() => setInternalOpen(false)}
        onSelect={(md) => insertAtCursor(`\n${md}\n`)}
      />
    </div>
  );
}
