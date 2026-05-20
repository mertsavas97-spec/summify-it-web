import type { PersonaAdaptivePlan } from "@/types/adaptive-analysis";
import type { AdaptiveLearnProfile } from "@/types/adaptive-learn";

/**
 * Phase 11D — provider learnCards guidance from adaptive learn profile + plan.
 */
export function buildAdaptiveLearnPromptBlock(
  profile: AdaptiveLearnProfile,
  plan: PersonaAdaptivePlan,
): string {
  const groupLines = profile.groups.map(
    (g) =>
      `- [${g.id}] ${g.title}: ${g.purpose} (types: ${g.cardTypes.join(", ")}, max ~${g.maxCards})`,
  );

  return [
    "ADAPTIVE LEARN INTELLIGENCE (Phase 11D — DOMINANT over generic flashcard habits):",
    `Profile: ${profile.profileId} | Goal: ${profile.learningGoal}`,
    `Cognitive style: ${profile.cognitiveStyle} | Memory: ${profile.memoryStrategy} | Sequencing: ${profile.sequencingStrategy}`,
    profile.rationale,
    "",
    "Generate learnCards FROM the adaptive analysis plan sections and keyInsights — NOT from:",
    "- generic summary paraphrases",
    "- risksOrWarnings or actionItems unless the plan explicitly allows them",
    "- filler phrases ('further research', 'readers should', 'this could be important')",
    "",
    `Preferred cognitive patterns: ${profile.preferredCardPatterns.join(", ")}.`,
    plan.learnCardStrategy.providerTypeEmphasis,
    `Title style: ${plan.learnCardStrategy.titleStyle}`,
    `Avoid angles: ${plan.learnCardStrategy.avoidedAdaptiveTypes.join(", ") || "none"}.`,
    profile.groups.length > 0
      ? ["", "Organize cards mentally into these groups (titles should reflect group focus):", ...groupLines]
      : [],
    "",
    patternGuidance(profile.profileId),
    "",
    "Each learnCard must teach one concrete, source-grounded idea. Quiz cards: question then '---' then answer.",
  ]
    .flat()
    .filter(Boolean)
    .join("\n");
}

function patternGuidance(profileId: string): string {
  switch (profileId) {
    case "learn_historical_student_v1":
      return [
        "Historical learn emphasis:",
        "- memory_hook / concept: timeline steps, eras, turning points (use dates when present)",
        "- connection: cause → effect chains between events or figures",
        "- quiz: recall dates, sequence, or 'what led to what'",
        "- Avoid corporate strategy or generic 'why it matters' without a named event",
      ].join("\n");
    case "learn_scientific_student_v1":
      return [
        "Scientific learn emphasis:",
        "- concept: definitions, mechanisms, system parts (precise terms from source)",
        "- connection: how components interact or process steps link",
        "- quiz: apply a mechanism or define a term from the doc",
        "- Prefer process logic over vague importance statements",
      ].join("\n");
    case "learn_literary_student_v1":
      return [
        "Literary learn emphasis:",
        "- concept / memory_hook: themes, motifs, symbols, narrative voice",
        "- connection: link symbol to theme or character to tension",
        "- quiz: interpretation prompts grounded in quoted ideas (not plot spoilers alone)",
        "- Avoid risk/myth cards unless source states a false belief",
      ].join("\n");
    case "learn_technical_developer_v1":
      return [
        "Technical learn emphasis:",
        "- concept: components, interfaces, terminology",
        "- connection: dependency chains and workflow order",
        "- quiz: 'what happens if X fails' or 'what step follows Y' from source",
        "- misconception only for stated failure modes — not generic gaps",
      ].join("\n");
    case "learn_business_executive_v1":
      return [
        "Executive learn emphasis:",
        "- why_it_matters: tradeoffs, decision stakes, metric implications",
        "- concept: named metrics, initiatives, constraints from source",
        "- connection: risk ↔ opportunity or metric ↔ decision links",
      ].join("\n");
    default:
      return "Balanced learn cards: distinct roles (concept, why, hook, quiz) without repeating summary sentences.";
  }
}
