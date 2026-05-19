import Link from "next/link";
import { getIntelligenceModeById } from "@/config/modes";
import { getModeSeoContent } from "@/data/mode-seo-content";
import type { IntelligenceModeId } from "@/types/modes";
import { FAQSection } from "./FAQSection";
import { InternalTextLink } from "./InternalTextLink";

type ModeSeoExpansionProps = {
  modeId: IntelligenceModeId;
};

export function ModeSeoExpansion({ modeId }: ModeSeoExpansionProps) {
  const mode = getIntelligenceModeById(modeId);
  const seo = getModeSeoContent(modeId);
  if (!mode || !seo || mode.availability !== "active") return null;

  return (
    <section className="border-b border-white/[0.04] px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-xl font-semibold text-white">About {mode.label}</h2>
        <div className="mt-6 max-w-3xl space-y-4 text-sm leading-relaxed text-zinc-500">
          {seo.introParagraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-10">
          <h3 className="text-sm font-medium text-zinc-300">Related intelligence modes</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {seo.relatedModeIds.map((relatedId) => {
              const related = getIntelligenceModeById(relatedId);
              if (!related) return null;
              return (
                <li key={relatedId}>
                  <Link
                    href={`/modes/${relatedId}`}
                    className="rounded-lg border border-white/[0.06] bg-zinc-950/50 px-3 py-1.5 text-xs text-violet-300/90 hover:border-violet-500/25"
                  >
                    {related.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs text-zinc-600">
            Explore formats:{" "}
            <InternalTextLink href="/summarize-pdf">PDF</InternalTextLink>
            {" · "}
            <InternalTextLink href="/summarize-web-articles">Articles</InternalTextLink>
            {" · "}
            <InternalTextLink href="/summarize-youtube-video">YouTube</InternalTextLink>
          </p>
        </div>

        <div className="mt-12">
          <FAQSection items={seo.faqs} title={`${mode.label} FAQ`} />
        </div>
      </div>
    </section>
  );
}
