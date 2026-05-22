"use client";

import { BlogMarkdownContent } from "@/components/blog/BlogMarkdownContent";
import { BlogHtmlContent } from "@/components/blog/BlogHtmlContent";
import { BlogProse } from "@/components/blog/BlogProse";
import type { CmsBlogBodyFormat } from "@/lib/blog/cmsBody";

type MarkdownPreviewProps = {
  markdown: string;
  bodyFormat: CmsBlogBodyFormat;
  title: string;
  viewport: "desktop" | "mobile";
};

export function MarkdownPreview({
  markdown,
  bodyFormat,
  title,
  viewport,
}: MarkdownPreviewProps) {
  const width = viewport === "mobile" ? "max-w-[390px]" : "w-full";

  return (
    <div
      className={`mx-auto overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-950/80 ${width}`}
    >
      <div className="border-b border-white/[0.06] px-4 py-3">
        <p className="text-[10px] uppercase tracking-wider text-zinc-600">
          {viewport === "mobile" ? "Mobile preview" : "Desktop preview"}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-white">{title || "Untitled"}</h2>
      </div>
      <BlogProse>
        {bodyFormat === "html" ? (
          <BlogHtmlContent html={markdown || "<p>No content yet.</p>"} />
        ) : (
          <BlogMarkdownContent markdown={markdown || "*No content yet.*"} />
        )}
      </BlogProse>
    </div>
  );
}
