import type {
  LearnCognitiveLevel,
  LearnRetrievalType,
  RecallDifficultyLevel,
} from "@/types/adaptive-learn";

type PracticeProgressionBadgesProps = {
  recallDifficulty?: RecallDifficultyLevel;
  retrievalType?: LearnRetrievalType;
  cognitiveLevel?: LearnCognitiveLevel;
};

function labelDifficulty(level?: RecallDifficultyLevel): string | null {
  if (!level) return null;
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function labelRetrieval(type?: LearnRetrievalType): string | null {
  if (!type) return null;
  const map: Record<LearnRetrievalType, string> = {
    recognition: "Recognition",
    recall: "Recall",
    synthesis: "Synthesis",
    comparison: "Compare",
    application: "Application",
    chronology: "Chronology",
    mechanism: "Mechanism",
  };
  return map[type] ?? null;
}

function labelCognitive(level?: LearnCognitiveLevel): string | null {
  if (!level) return null;
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function PracticeProgressionBadges({
  recallDifficulty,
  retrievalType,
  cognitiveLevel,
}: PracticeProgressionBadgesProps) {
  const chips = [
    labelDifficulty(recallDifficulty),
    labelRetrieval(retrievalType),
    labelCognitive(cognitiveLevel),
  ].filter(Boolean) as string[];

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <span
          key={chip}
          className="rounded border border-white/[0.06] bg-zinc-950/60 px-1.5 py-0.5 text-[9px] font-medium text-zinc-500"
        >
          {chip}
        </span>
      ))}
    </div>
  );
}
