/**
 * SERVER ONLY — maps 29 intelligence modes → backend families + learn/prompt hooks.
 */

import {
  ACTIVE_INTELLIGENCE_MODE_IDS,
  getIntelligenceModeById,
  INTELLIGENCE_MODES,
  isActiveIntelligenceModeId,
  LEGACY_MODE_TO_INTELLIGENCE_ID,
} from "@/config/modes";
import type {
  IntelligenceModeId,
  LearnWeightingProfile,
  OutputDepthHint,
  OutputTone,
} from "@/types/modes";
import type { TextAnalysisMode } from "@/server/ai/schemas";
import type { LearnCardKind } from "@/server/learn/types";
import { getModeResultPromptGuidance } from "@/lib/mode-result-presentation";

export type ModeRoutingResult = {
  intelligenceModeId: IntelligenceModeId;
  label: string;
  backendFamily: TextAnalysisMode;
  promptAdjunct: string;
  learnWeighting: LearnWeightingProfile;
  outputTone: OutputTone;
  outputDepthHint: OutputDepthHint;
  availability: "active" | "locked" | "coming_soon";
};

function isLegacyBackendMode(value: string): value is TextAnalysisMode {
  return (
    value === "executive" ||
    value === "academic" ||
    value === "creator" ||
    value === "legal"
  );
}

function resolveIntelligenceModeId(input: string): IntelligenceModeId | null {
  if (INTELLIGENCE_MODES.some((m) => m.id === input)) {
    return input as IntelligenceModeId;
  }
  if (isLegacyBackendMode(input)) {
    return LEGACY_MODE_TO_INTELLIGENCE_ID[input];
  }
  return null;
}

/**
 * Resolve client/API mode string to routing config. Throws on unknown; caller validates active.
 */
export function resolveModeRouting(modeInput: string): ModeRoutingResult {
  const modeId = resolveIntelligenceModeId(modeInput);
  if (!modeId) {
    throw new Error(`Unknown intelligence mode: ${modeInput}`);
  }

  const def = getIntelligenceModeById(modeId);
  if (!def) {
    throw new Error(`Mode definition missing: ${modeId}`);
  }

  return {
    intelligenceModeId: def.id,
    label: def.label,
    backendFamily: def.intelligenceFamily,
    promptAdjunct: [def.promptAdjunct, getModeResultPromptGuidance(def.id)]
      .filter(Boolean)
      .join("\n\n"),
    learnWeighting: def.learnWeighting,
    outputTone: def.outputTone,
    outputDepthHint: def.outputDepth,
    availability: def.availability,
  };
}

export function assertModeIsRunnable(routing: ModeRoutingResult): void {
  if (routing.availability === "coming_soon") {
    throw new Error(`"${routing.label}" is coming soon. Choose an active mode to run analysis.`);
  }
  if (routing.availability === "locked") {
    throw new Error(
      `"${routing.label}" is part of Pro Intelligence and isn't available yet. Choose an active mode to run analysis.`,
    );
  }
  if (!isActiveIntelligenceModeId(routing.intelligenceModeId)) {
    throw new Error(
      "This intelligence mode isn't available for analysis. Choose an active mode from the lens selector.",
    );
  }
}

/** Build learn card kind targets from family + per-mode weighting. */
export function buildLearnKindTargets(
  family: TextAnalysisMode,
  learnWeighting: LearnWeightingProfile,
  targetCount: number,
): Partial<Record<LearnCardKind, number>> {
  const base = baseFamilyTargets(family, targetCount);
  const kinds: LearnCardKind[] = [
    "concept",
    "why_it_matters",
    "memory_hook",
    "quiz",
    "connection",
    "misconception",
  ];

  const weighted = kinds.map((kind) => ({
    kind,
    weight: learnWeighting[kind] ?? 1,
    base: base[kind] ?? 0,
  }));

  weighted.sort((a, b) => b.weight * (b.base || 0.5) - a.weight * (a.base || 0.5));

  const out: Partial<Record<LearnCardKind, number>> = { ...base };

  for (const { kind, weight, base: baseVal } of weighted) {
    if (weight >= 1.35) {
      out[kind] = Math.min(
        targetCount,
        Math.max(out[kind] ?? 0, Math.ceil((baseVal || 1) * weight)),
      );
    } else if (weight <= 0.65 && out[kind]) {
      out[kind] = Math.max(0, Math.floor((out[kind] ?? 1) * weight));
    }
  }

  return out;
}

function baseFamilyTargets(
  mode: TextAnalysisMode,
  targetCount: number,
): Partial<Record<LearnCardKind, number>> {
  switch (mode) {
    case "creator":
      return {
        connection: Math.min(2, Math.ceil(targetCount * 0.25)),
        memory_hook: Math.min(2, Math.ceil(targetCount * 0.22)),
        concept: 1,
        quiz: 1,
        why_it_matters: 1,
      };
    case "academic":
      return {
        concept: Math.min(3, Math.ceil(targetCount * 0.35)),
        misconception: Math.min(2, Math.ceil(targetCount * 0.22)),
        quiz: 1,
        why_it_matters: 1,
      };
    case "executive":
      return {
        why_it_matters: Math.min(3, Math.ceil(targetCount * 0.35)),
        concept: 2,
        memory_hook: 1,
        quiz: 1,
      };
    case "legal":
      return {
        concept: Math.min(3, Math.ceil(targetCount * 0.3)),
        why_it_matters: 2,
        misconception: 1,
        quiz: 1,
      };
    default:
      return {
        concept: 2,
        why_it_matters: 1,
        memory_hook: 1,
        quiz: 1,
      };
  }
}

export { ACTIVE_INTELLIGENCE_MODE_IDS, isActiveIntelligenceModeId };
