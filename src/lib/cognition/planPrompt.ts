import type { PersonaAdaptivePlan } from "@/types/adaptive-analysis";

const BANNED_GENERIC_FILLER = [
  "Further research is needed",
  "Approach critically",
  "Consider potential bias",
  "Readers should verify",
  "It is important to note",
  "This document discusses",
];

export function buildAdaptivePlanPromptBlock(plan: PersonaAdaptivePlan): string {
  const sectionLines = plan.sections.map(
    (s, i) =>
      `${i + 1}. [${s.priority}] ${s.title} — ${s.purpose} (render: ${s.renderAs}, max ~${s.maxItems}). Map to JSON: ${s.outputHint}`,
  );

  const suppressRisks = plan.suppressedDefaultSections.includes("risks");
  const suppressActions = plan.suppressedDefaultSections.includes("actions");

  return [
    "ADAPTIVE ANALYSIS PLAN (Phase 11B — follow this structure; keep the same JSON contract):",
    `Plan: ${plan.planId} | Family: ${plan.structureFamily} | Goal: ${plan.primaryGoal}`,
    `Persona: ${plan.personaId} | Domain: ${plan.documentDomain} | Confidence: ${plan.profileConfidence}`,
    plan.rationale,
    "",
    "Planned sections (organize content inside existing fields):",
    ...sectionLines,
    "",
    "JSON field mapping (required keys only):",
    "- title: reflect the document subject",
    "- summary: weave PRIMARY sections (especially those marked primary) — not a generic template",
    "- keyInsights: bullets for timeline, mechanisms, themes, hooks, obligations, etc. per plan",
    suppressRisks
      ? "- risksOrWarnings: use [] EMPTY unless the source explicitly discusses conflict, liability, danger, or material downside. Do NOT add generic study or bias warnings."
      : "- risksOrWarnings: only source-grounded risks (0–5). If none, use [] — never 'The source does not provide enough risk signals' unless truly zero signal and plan expects risks.",
    suppressActions
      ? "- actionItems: use [] OR only review/verification/practice questions from the plan — NOT business to-dos or generic advice."
      : "- actionItems: only when the plan and source support concrete next steps (may be empty).",
    "- learnCards: 3–5 cards following learn card strategy below",
    "",
    `Learn card strategy: ${plan.learnCardStrategy.summary}`,
    plan.learnCardStrategy.providerTypeEmphasis,
    `Title style: ${plan.learnCardStrategy.titleStyle}`,
    `Avoid card angles: ${plan.learnCardStrategy.avoidedAdaptiveTypes.join(", ") || "none"}.`,
    plan.learnCardStrategy.suppressMisconceptionUnlessExplicit
      ? "- Do NOT use misconception-style cards unless the source states a clear false belief or myth."
      : "",
    "",
    `Tone: ${plan.toneGuidance}`,
    plan.safetyGuidance ? `Safety: ${plan.safetyGuidance}` : "",
    "",
    "Anti-filler rules:",
    ...BANNED_GENERIC_FILLER.map((p) => `- Do not output generic phrase: "${p}" unless quoted from source.`),
    "- Do not invent details not supported by the source.",
    "- Empty arrays are preferred over generic filler.",
  ]
    .filter(Boolean)
    .join("\n");
}
