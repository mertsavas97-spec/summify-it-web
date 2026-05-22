"use client";

import type { BlogContentMetrics } from "@/lib/blog/contentMetrics";

type ContentQualityPanelProps = {
  metrics: BlogContentMetrics;
};

const rows: { key: keyof BlogContentMetrics; label: string }[] = [
  { key: "wordCount", label: "Words" },
  { key: "readingTimeLabel", label: "Reading time" },
  { key: "h2Count", label: "H2 headings" },
  { key: "h3Count", label: "H3 headings" },
  { key: "internalLinkCount", label: "Internal links" },
  { key: "externalLinkCount", label: "External links" },
  { key: "faqCount", label: "FAQ blocks" },
  { key: "ctaCount", label: "CTA blocks" },
  { key: "imageCount", label: "Images" },
];

export function ContentQualityPanel({ metrics }: ContentQualityPanelProps) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-zinc-950/60 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Content quality
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        {rows.map((row) => (
          <div key={row.key}>
            <dt className="text-zinc-600">{row.label}</dt>
            <dd className="font-medium tabular-nums text-zinc-200">
              {String(metrics[row.key])}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
