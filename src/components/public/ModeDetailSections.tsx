import { getIntelligenceModeById } from "@/config/modes";
import { formatRecommendedSources, getCategoryLabelForMode } from "@/lib/mode-groups";
import { getModeMarketingPreview } from "@/data/mode-marketing";
import type { IntelligenceModeId } from "@/types/modes";
import { Button } from "@/components/ui/Button";
import { ProductDisclaimer } from "@/components/public/ProductDisclaimer";
import { ProductMockCard } from "./ProductMockCard";
import { CTASection } from "./CTASection";

type ModeDetailSectionsProps = {
  modeId: IntelligenceModeId;
};

export function ModeDetailSections({ modeId }: ModeDetailSectionsProps) {
  const mode = getIntelligenceModeById(modeId);
  if (!mode || mode.availability !== "active") return null;

  const preview = getModeMarketingPreview(modeId);

  return (
    <>
      <section className="border-b border-white/[0.04] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-400/80">
              {getCategoryLabelForMode(modeId)} · Active mode
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {mode.label}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-zinc-400">
              {mode.intelligenceLens}
            </p>
            <p className="mt-3 text-sm text-zinc-500">{mode.shortDescription}</p>
            <p className="mt-4 text-xs text-zinc-600">
              Best for: {formatRecommendedSources(mode.recommendedSources)}
            </p>
            {mode.id === "contract-analyzer" ? (
              <ProductDisclaimer className="mt-4 max-w-prose" />
            ) : null}
            <div className="mt-6">
              <Button href="/upload" size="md">
                Try {mode.label} in workspace
              </Button>
            </div>
          </div>
          <ProductMockCard variant="learn" />
        </div>
      </section>

      {preview && (
        <section className="border-b border-white/[0.04] px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-white">What you get</h2>
            <p className="mt-2 text-sm text-zinc-500">{mode.outputStylePreview}</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {preview.sampleBullets.map((bullet) => (
                <li
                  key={bullet}
                  className="rounded-lg border border-white/[0.06] bg-zinc-950/50 px-4 py-3 text-xs text-zinc-400"
                >
                  {bullet}
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <h3 className="text-sm font-medium text-violet-200">Learn layer preview</h3>
              <p className="mt-1 text-xs text-zinc-500">{mode.learnEmphasis}</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {preview.learnPreview.map((card) => (
                  <li
                    key={card.title}
                    className="rounded-lg border border-violet-500/15 bg-violet-950/15 px-4 py-3"
                  >
                    <span className="text-[9px] font-medium uppercase text-violet-400/80">
                      {card.type}
                    </span>
                    <p className="mt-1 text-sm text-zinc-200">{card.title}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <CTASection
        title={`Run ${mode.label} on your next document`}
        description="Upload a PDF, article, video, or deck — pick this mode in the workspace and get structured intelligence plus Learn cards."
        primaryLabel="Open workspace"
        secondaryHref="/modes"
        secondaryLabel="All modes"
      />
    </>
  );
}
