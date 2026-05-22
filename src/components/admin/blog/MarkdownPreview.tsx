"use client";

import { BlogMarkdownContent } from "@/components/blog/BlogMarkdownContent";
import { BlogProse } from "@/components/blog/BlogProse";

type MarkdownPreviewProps = {
  markdown: string;
  title: string;
  viewport: "desktop" | "mobile";
};

export function MarkdownPreview({ markdown, title, viewport }: MarkdownPreviewProps) {
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
        <BlogMarkdownContent markdown={markdown || "*No content yet.*"} />
      </BlogProse>
    </div>
  );
}
