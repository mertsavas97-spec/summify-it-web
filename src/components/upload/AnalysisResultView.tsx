"use client";

import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import type { AnalysisResult } from "@/types/text-analysis";
import { AnalysisToolbar } from "./AnalysisToolbar";
import { LearnSection } from "./LearnSection";
import type { IntelligenceModeId } from "@/types/modes";

type AnalysisResultViewProps = {
  result: AnalysisResult;
  modeId: IntelligenceModeId;
  providerUsed: string;
  fallbackUsed: boolean;
};

export function AnalysisResultView({
  result,
  modeId,
  providerUsed,
  fallbackUsed,
}: AnalysisResultViewProps) {
  return (
    <article
      className="overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-950/60"
      data-workspace-analysis-output
    >
      <header className="border-b border-white/[0.06] px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 max-w-prose">
            <h3 className="text-base font-semibold leading-snug text-white">
              {result.title}
            </h3>
            <p className="mt-1 text-[10px] text-zinc-600">
              Provider:{" "}
              <span className="font-mono text-zinc-500">{providerUsed}</span>
              {fallbackUsed && (
                <span className="text-amber-400/90"> · fallback</span>
              )}
            </p>
          </div>
        </div>
        <div className="mt-3">
          <AnalysisToolbar result={result} />
        </div>
      </header>

      <div className="divide-y divide-white/[0.04] px-4">
        <CollapsibleSection title="Summary" defaultOpen>
          <p className="max-w-prose text-sm leading-[1.7] text-zinc-400">
            {result.summary}
          </p>
        </CollapsibleSection>

        <CollapsibleSection
          title="Key insights"
          count={result.keyInsights.length}
          defaultOpen
        >
          <InsightList items={result.keyInsights} />
        </CollapsibleSection>

        {result.risksOrWarnings.length > 0 && (
          <CollapsibleSection
            title="Risks & warnings"
            count={result.risksOrWarnings.length}
            defaultOpen
          >
            <InsightList items={result.risksOrWarnings} variant="warning" />
          </CollapsibleSection>
        )}

        {result.actionItems.length > 0 && (
          <CollapsibleSection
            title="Action items"
            count={result.actionItems.length}
            defaultOpen
          >
            <InsightList items={result.actionItems} variant="action" />
          </CollapsibleSection>
        )}

        {result.learnCards.length > 0 && (
          <div className="py-4">
            <LearnSection cards={result.learnCards} modeId={modeId} />
          </div>
        )}
      </div>
    </article>
  );
}

function InsightList({
  items,
  variant = "default",
}: {
  items: string[];
  variant?: "default" | "warning" | "action";
}) {
  const bulletClass =
    variant === "warning"
      ? "bg-amber-400/80"
      : variant === "action"
        ? "bg-emerald-400/80"
        : "bg-violet-400/80";

  return (
    <ul className="max-w-prose space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-zinc-400">
          <span
            className={`mt-2 h-1 w-1 shrink-0 rounded-full ${bulletClass}`}
            aria-hidden
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
