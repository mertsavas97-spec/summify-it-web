"use client";

import { useEffect, useRef } from "react";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { trackProductEventV2Client } from "@/lib/analytics/trackProductEventV2Client";
import { ProductDisclaimer } from "@/components/public/ProductDisclaimer";
import type { AnalysisResult } from "@/types/text-analysis";
import type { IntelligenceModeId } from "@/types/modes";
import type { PlanId } from "@/types/plan";
import type { PersonaUiSectionLabels } from "@/types/adaptive-analysis";
import { AnalysisToolbar } from "./AnalysisToolbar";
import { LearnSection } from "./LearnSection";
import { getModeResultSectionLabels } from "@/lib/mode-result-presentation";

type AnalysisResultViewProps = {
  result: AnalysisResult;
  modeId: IntelligenceModeId;
  providerUsed: string;
  fallbackUsed: boolean;
  embedded?: boolean;
  sections?: "all" | "summary" | "insights" | "deep" | "overview";
  showToolbar?: boolean;
  showHeader?: boolean;
  /** Phase 11C — adaptive headings from persona plan (optional). */
  uiSectionLabels?: PersonaUiSectionLabels;
  entitlementPlanId?: PlanId;
  collapseDeepSecondarySections?: boolean;
};

export function AnalysisResultView({
  result,
  modeId,
  providerUsed,
  fallbackUsed,
  embedded = false,
  sections = "all",
  showToolbar = true,
  showHeader = true,
  uiSectionLabels,
  entitlementPlanId = "free",
  collapseDeepSecondarySections = false,
}: AnalysisResultViewProps) {
  const showLearn = sections === "all" && result.learnCards.length > 0;
  const showSummary = sections !== "deep" && sections !== "insights";
  const showInsights =
    sections === "all" || sections === "overview" || sections === "insights" || sections === "deep";
  const showRisks = sections !== "summary" && result.risksOrWarnings.length > 0;
  const showActions = sections !== "summary" && result.actionItems.length > 0;
  const insightTracked = useRef(false);

  useEffect(() => {
    if (insightTracked.current) return;
    if (sections !== "all") return;
    if (result.keyInsights.length === 0) return;
    insightTracked.current = true;
    trackProductEventV2Client("insight_opened", {
      metadata: { insights: result.keyInsights.length },
    });
  }, [sections, result.keyInsights.length]);

  const sectionLabels = getModeResultSectionLabels(modeId, uiSectionLabels);

  const body = (
    <>
      {showHeader ? (
        <header className="border-b border-white/[0.06] px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 max-w-prose">
              <h3 className="text-base font-semibold leading-snug text-white">{result.title}</h3>
              <p className="mt-1 text-[10px] text-zinc-600">
                Provider:{" "}
                <span className="font-mono text-zinc-500">{providerUsed}</span>
                {fallbackUsed ? (
                  <span className="text-amber-400/90"> · fallback</span>
                ) : null}
              </p>
            </div>
          </div>
          {showToolbar ? (
            <div className="mt-3">
              <AnalysisToolbar
                result={result}
                modeId={modeId}
                uiSectionLabels={uiSectionLabels}
              />
            </div>
          ) : null}
        </header>
      ) : null}

      <div className={embedded ? "" : "divide-y divide-white/[0.04] px-4"}>
        {showSummary ? (
          <CollapsibleSection title={sectionLabels.summary} defaultOpen>
            <p className="max-w-prose text-sm leading-[1.7] text-zinc-400">{result.summary}</p>
          </CollapsibleSection>
        ) : null}

        {showInsights ? (
          <CollapsibleSection
            title={sectionLabels.keyInsights}
            count={result.keyInsights.length}
            defaultOpen
          >
            <InsightList items={result.keyInsights} />
          </CollapsibleSection>
        ) : null}

        {showRisks ? (
          <CollapsibleSection
            title={sectionLabels.risks}
            count={result.risksOrWarnings.length}
            defaultOpen={!collapseDeepSecondarySections}
          >
            <InsightList items={result.risksOrWarnings} variant="warning" />
          </CollapsibleSection>
        ) : null}

        {showActions ? (
          <CollapsibleSection
            title={sectionLabels.actions}
            count={result.actionItems.length}
            defaultOpen={!collapseDeepSecondarySections}
          >
            <InsightList items={result.actionItems} variant="action" />
          </CollapsibleSection>
        ) : null}

        {showLearn ? (
          <div className="py-4">
            <LearnSection
              cards={result.learnCards}
              modeId={modeId}
              entitlementPlanId={entitlementPlanId}
            />
          </div>
        ) : null}

        {sections === "all" ? (
          <div className="py-4">
            <ProductDisclaimer />
          </div>
        ) : null}
      </div>
    </>
  );

  if (embedded) {
    return <div data-workspace-analysis-output>{body}</div>;
  }

  return (
    <article
      className="overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-950/60"
      data-workspace-analysis-output
    >
      {body}
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
          <span className={`mt-2 h-1 w-1 shrink-0 rounded-full ${bulletClass}`} aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
