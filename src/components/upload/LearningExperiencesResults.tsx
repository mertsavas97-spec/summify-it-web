"use client";

import { useState, type ReactNode } from "react";
import { BookOpen, Headphones, Mic, HelpCircle } from "lucide-react";
import type { LearningExperienceId } from "@/types/learning-experience";
import { SummaryLearnResultsPanel } from "./SummaryLearnResultsPanel";
import type { AnalysisResult } from "@/types/text-analysis";
import type { DocumentProfileMetadata } from "@/types/intelligence";
import type { IntelligenceModeId } from "@/types/modes";
import type { PlanId } from "@/types/plan";
import type { PersonaUiSectionLabels } from "@/types/adaptive-analysis";

type LearningExperiencesResultsProps = {
  initialExperience: LearningExperienceId;
  result: AnalysisResult;
  modeId: IntelligenceModeId;
  providerUsed: string;
  fallbackUsed: boolean;
  uiSectionLabels?: PersonaUiSectionLabels;
  entitlementPlanId: PlanId;
  isPaidActive: boolean;
  sourceType?: string | null;
  sourceLabel?: string | null;
  modeLabel: string;
  sourceKindLabel: string;
  savedAnalysisId?: string | null;
  extractedCharacters?: number | null;
  estimatedPages?: number | null;
  slideCount?: number | null;
  sourceQuality?: DocumentProfileMetadata["sourceQuality"] | null;
  sourceQualityNote?: string | null;
  audioContent: ReactNode;
  podcastContent: ReactNode;
  onExperienceChange: (experience: LearningExperienceId) => void;
  footerContent?: ReactNode;
};

const EXPERIENCE_TABS: {
  id: LearningExperienceId;
  label: string;
  shortLabel: string;
  Icon: typeof BookOpen;
}[] = [
  { id: "summary-learn", label: "Summary", shortLabel: "Summary", Icon: BookOpen },
  { id: "audio", label: "Audio lesson", shortLabel: "Audio", Icon: Headphones },
  { id: "podcast", label: "Podcast", shortLabel: "Podcast", Icon: Mic },
];

function ExperienceSwitcher({
  active,
  onChange,
}: {
  active: LearningExperienceId;
  onChange: (id: LearningExperienceId) => void;
}) {
  return (
    <nav
      className="flex w-full rounded-xl border border-white/[0.08] bg-[#0d1018]/90 p-1"
      aria-label="Experience"
      data-experience-switcher
      role="tablist"
    >
      {EXPERIENCE_TABS.map(({ id, label, shortLabel, Icon }) => {
        const selected = active === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(id)}
            className={`relative inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-1.5 py-2.5 text-[11px] font-semibold transition-colors sm:gap-2 sm:px-2 sm:text-sm ${
              selected
                ? "bg-violet-500/20 text-violet-50 shadow-[inset_0_0_0_1px_rgba(167,139,250,0.35)]"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
            <span className="truncate sm:hidden">{shortLabel}</span>
            <span className="hidden truncate sm:inline">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function LearningExperiencesResults({
  initialExperience,
  result,
  modeId,
  providerUsed,
  fallbackUsed,
  uiSectionLabels,
  entitlementPlanId,
  isPaidActive,
  sourceType,
  sourceLabel,
  modeLabel,
  sourceKindLabel,
  savedAnalysisId,
  extractedCharacters,
  estimatedPages,
  slideCount,
  sourceQuality,
  sourceQualityNote,
  audioContent,
  podcastContent,
  onExperienceChange,
  footerContent,
}: LearningExperiencesResultsProps) {
  const experience = initialExperience;
  const [quizAvailable, setQuizAvailable] = useState(false);
  const [focusQuiz, setFocusQuiz] = useState(false);

  const handleQuizClick = () => {
    setFocusQuiz(true);
    if (experience !== "summary-learn") {
      onExperienceChange("summary-learn");
    }
  };

  return (
    <section className="space-y-4" data-learning-experiences-results data-experience={experience}>
      {quizAvailable && (
        <button
          type="button"
          onClick={handleQuizClick}
          className="w-full sm:w-auto rounded-xl border border-violet-400/30 bg-violet-500/15 px-4 py-2.5 text-sm font-semibold text-violet-100 hover:bg-violet-500/25 hover:border-violet-400/50 transition-colors flex items-center justify-center gap-2"
          aria-label="Open quiz"
        >
          <HelpCircle className="h-4 w-4" aria-hidden />
          <span>Quiz</span>
        </button>
      )}
      <ExperienceSwitcher active={experience} onChange={onExperienceChange} />

      {experience === "audio" ? (
        <div
          className="rounded-2xl border border-sky-400/20 bg-[#11141d]/80 p-4 sm:p-5"
          data-experience-panel="audio"
        >
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-500/10 text-sky-200">
              <Headphones className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Audio lesson</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Teacher-style narration from your summary. Generate when ready.
              </p>
            </div>
          </div>
          {audioContent}
          <button
            type="button"
            onClick={() => onExperienceChange("summary-learn")}
            className="mt-4 text-xs font-medium text-zinc-500 hover:text-zinc-300"
          >
            Back to summary
          </button>
        </div>
      ) : null}

      {experience === "podcast" ? (
        <div
          className="rounded-2xl border border-amber-400/20 bg-[#11141d]/80 p-4 sm:p-5"
          data-experience-panel="podcast"
        >
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-500/10 text-amber-200">
              <Mic className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Podcast</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Two AI hosts discuss this summary. Generate when ready.
              </p>
            </div>
          </div>
          {podcastContent}
          <button
            type="button"
            onClick={() => onExperienceChange("summary-learn")}
            className="mt-4 text-xs font-medium text-zinc-500 hover:text-zinc-300"
          >
            Back to summary
          </button>
        </div>
      ) : null}

      {experience === "summary-learn" ? (
        <SummaryLearnResultsPanel
          result={result}
          modeId={modeId}
          modeLabel={modeLabel}
          sourceKindLabel={sourceKindLabel}
          providerUsed={providerUsed}
          fallbackUsed={fallbackUsed}
          uiSectionLabels={uiSectionLabels}
          entitlementPlanId={entitlementPlanId}
          isPaidActive={isPaidActive}
          sourceType={sourceType}
          sourceLabel={sourceLabel}
          savedAnalysisId={savedAnalysisId}
          extractedCharacters={extractedCharacters}
          estimatedPages={estimatedPages}
          slideCount={slideCount}
          sourceQuality={sourceQuality}
          sourceQualityNote={sourceQualityNote}
          footerContent={footerContent}
          onQuizAvailabilityChange={setQuizAvailable}
          focusQuiz={focusQuiz}
          onFocusQuizHandled={() => setFocusQuiz(false)}
        />
      ) : (
        footerContent
      )}
    </section>
  );
}
