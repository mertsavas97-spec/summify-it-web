import type { CognitionContext } from "@/types/cognition";
import type { PersonaAdaptivePlan } from "@/types/adaptive-analysis";
import type { IntelligenceModeId } from "@/types/modes";
import { classifyDocumentProfile, type ClassifyDocumentProfileInput } from "./documentProfile";
import { resolveCognitiveDimensions } from "./dimensions";
import { resolveLearnCardBias } from "./learnCardBias";
import { getPersonaBrain } from "./personaRegistry";
import { buildCognitionSafetyRules } from "./safety";
import {
  applyPlanToLearnCardBias,
  buildAdaptiveAnalysisPlan,
} from "./adaptivePlanner";
import { buildAdaptivePlanPromptBlock } from "./planPrompt";

export type BuildCognitionContextInput = ClassifyDocumentProfileInput & {
  modeId: IntelligenceModeId | string;
};

export type CognitionContextWithPlan = CognitionContext & {
  personaAdaptivePlan: PersonaAdaptivePlan;
};

function formatCognitionPromptBlock(
  ctx: Omit<CognitionContext, "promptBlock" | "debugSummary">,
  plan: PersonaAdaptivePlan,
): string {
  const { documentProfile: doc, personaBrain: brain, dimensions: dim, learnCardBias: bias } =
    ctx;

  return [
    buildAdaptivePlanPromptBlock(plan),
    "",
    "COGNITION CONTEXT (Phase 11A — emphasis only):",
    `Document profile: domain=${doc.domain}; subType=${doc.subType}; complexity=${doc.complexity}; density=${doc.density}; structure=${doc.primaryStructure}; confidence=${doc.confidence}.`,
    `Persona lens: ${brain.id} (${brain.family}) — ${brain.reasoningStyle}.`,
    `Primary cognitive dimensions: ${dim.primaryDimensions.join(", ")}.`,
    `Secondary dimensions: ${dim.secondaryDimensions.join(", ")}.`,
    `De-emphasize dimensions: ${dim.suppressedDimensions.slice(0, 6).join(", ")}.`,
    `Learn card density: ${bias.maxDensity}.`,
    buildCognitionSafetyRules(doc),
    "Keep JSON keys: title, summary, keyInsights, risksOrWarnings, actionItems, learnCards.",
  ].join("\n");
}

export function buildCognitionContext(input: BuildCognitionContextInput): CognitionContextWithPlan {
  const documentProfile = classifyDocumentProfile(input);
  const personaBrain = getPersonaBrain(input.modeId);
  const dimensions = resolveCognitiveDimensions(personaBrain, documentProfile);
  const baseBias = resolveLearnCardBias(personaBrain, documentProfile, dimensions);

  const personaAdaptivePlan = buildAdaptiveAnalysisPlan({
    personaBrain,
    documentProfile,
    dimensions,
    learnCardBias: baseBias,
    modeId: input.modeId,
    sourceKind: input.sourceKind ?? documentProfile.sourceKind,
  });

  const learnCardBias = applyPlanToLearnCardBias(baseBias, personaAdaptivePlan);

  const base = { documentProfile, personaBrain, dimensions, learnCardBias };
  const promptBlock = formatCognitionPromptBlock(base, personaAdaptivePlan);

  return {
    ...base,
    promptBlock,
    debugSummary: personaAdaptivePlan.adaptationLabel,
    personaAdaptivePlan,
  };
}

export { buildAdaptivePlanPromptBlock } from "./planPrompt";
