"use client";

import { absoluteUrl } from "@/lib/seo";

type SeoPreviewPanelProps = {
  seoTitle: string;
  slug: string;
  seoDescription: string;
  ogTitle: string;
  ogDescription: string;
  canonicalUrl: string;
};

export function SeoPreviewPanel({
  seoTitle,
  slug,
  seoDescription,
  ogTitle,
  ogDescription,
  canonicalUrl,
}: SeoPreviewPanelProps) {
  const displayUrl = canonicalUrl || (slug ? absoluteUrl(`/blog/${slug}`) : absoluteUrl("/blog"));

  return (
    <div className="space-y-4 rounded-xl border border-white/[0.08] bg-zinc-950/60 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        SEO preview
      </p>
      <div className="rounded-lg border border-white/[0.06] bg-white p-4">
        <p className="truncate text-xs text-[#202124]">{displayUrl}</p>
        <p className="mt-0.5 truncate text-lg text-[#1a0dab]">{seoTitle || "SEO title"}</p>
        <p className="mt-1 line-clamp-2 text-sm text-[#4d5156]">
          {seoDescription || "Meta description preview…"}
        </p>
      </div>
      <dl className="space-y-2 text-xs">
        <div>
          <dt className="text-zinc-600">OG title</dt>
          <dd className="text-zinc-300">{ogTitle || seoTitle || "—"}</dd>
        </div>
        <div>
          <dt className="text-zinc-600">OG description</dt>
          <dd className="text-zinc-400">{ogDescription || seoDescription || "—"}</dd>
        </div>
        <div>
          <dt className="text-zinc-600">Canonical</dt>
          <dd className="break-all text-violet-300/90">{displayUrl}</dd>
        </div>
      </dl>
    </div>
  );
}
