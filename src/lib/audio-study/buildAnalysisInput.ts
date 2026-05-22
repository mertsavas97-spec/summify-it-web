import type { AudioStudyAnalysisInput } from "@/types/audio-study";
import type { AnalysisResult, LearnCardOutput } from "@/types/text-analysis";

export function buildAudioStudyInputFromResult(
  result: Pick<
    AnalysisResult,
    "title" | "summary" | "keyInsights" | "risksOrWarnings" | "actionItems" | "learnCards"
  >,
  options?: {
    sourceType?: string | null;
    intelligenceMode?: string | null;
    sourceLabel?: string | null;
    quizThemes?: string[];
  },
): AudioStudyAnalysisInput {
  return {
    title: result.title,
    summary: result.summary,
    keyInsights: result.keyInsights,
    risksOrWarnings: result.risksOrWarnings,
    actionItems: result.actionItems,
    learnCards: mapLearnCards(result.learnCards),
    sourceType: options?.sourceType,
    intelligenceMode: options?.intelligenceMode,
    sourceLabel: options?.sourceLabel,
    quizThemes: options?.quizThemes,
  };
}

function mapLearnCards(cards: LearnCardOutput[]): AudioStudyAnalysisInput["learnCards"] {
  return cards.map((c) => ({
    title: c.title,
    type: c.type,
    content: c.content,
  }));
}
