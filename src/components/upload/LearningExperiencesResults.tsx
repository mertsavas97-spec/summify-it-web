"use client";

import { type ReactNode } from "react";
import { Headphones, Mic } from "lucide-react";
import type { LearningExperienceId } from "@/types/learning-experience";
import { ListeningExperienceSuggestions } from "./ListeningExperienceSuggestions";
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
  onTryAudio?: () => void;
  onTryPodcast?: () => void;
  footerContent?: ReactNode;
};

function FocusedExperienceHeader({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: typeof Headphones;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-200">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h2>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>
    </div>
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
  onTryAudio,
  onTryPodcast,
  footerContent,
}: LearningExperiencesResultsProps) {
  if (initialExperience === "audio") {
    return (
      <section className="space-y-5" data-learning-experiences-results>
        <FocusedExperienceHeader
          icon={Headphones}
          title="Audio lesson"
          description="Listen to a teacher-style explanation built from this summary."
        />
        <div className="rounded-2xl border border-white/[0.07] bg-[#11141d]/75 p-4 sm:p-5">
          {audioContent}
        </div>
        <ListeningExperienceSuggestions
          onTryPodcast={onTryPodcast}
          showAudio={false}
          showPodcast
        />
        {footerContent}
      </section>
    );
  }

  if (initialExperience === "podcast") {
    return (
      <section className="space-y-5" data-learning-experiences-results>
        <FocusedExperienceHeader
          icon={Mic}
          title="Podcast"
          description="Two AI hosts discuss your source in a natural conversation."
        />
        <div className="rounded-2xl border border-white/[0.07] bg-[#11141d]/75 p-4 sm:p-5">
          {podcastContent}
        </div>
        <ListeningExperienceSuggestions onTryAudio={onTryAudio} showAudio showPodcast={false} />
        {footerContent}
      </section>
    );
  }

  return (
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
      onTryAudio={onTryAudio}
      onTryPodcast={onTryPodcast}
      footerContent={footerContent}
    />
  );
}
