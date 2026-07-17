import type { PersonaUiSectionLabels } from "@/types/adaptive-analysis";
import type { IntelligenceModeId } from "@/types/modes";

export type ModeResultSectionLabels = Required<PersonaUiSectionLabels>;

const MODE_RESULT_LABELS: Record<IntelligenceModeId, ModeResultSectionLabels> = {
  "general-summary": {
    summary: "Summary",
    keyInsights: "Key insights",
    risks: "Caveats & limitations",
    actions: "Useful follow-ups",
  },
  "key-points": {
    summary: "Quick overview",
    keyInsights: "Key points",
    risks: "Important caveats",
    actions: "Follow-ups",
  },
  "executive-brief": {
    summary: "Executive brief",
    keyInsights: "Decisions & implications",
    risks: "Risks & tradeoffs",
    actions: "Recommended next steps",
  },
  "deep-dive": {
    summary: "Deep-dive synthesis",
    keyInsights: "Arguments & evidence",
    risks: "Gaps & tensions",
    actions: "Questions for further analysis",
  },
  "the-student": {
    summary: "Study summary",
    keyInsights: "Core concepts & explanations",
    risks: "Clarifications & common pitfalls",
    actions: "Review questions",
  },
  "the-researcher": {
    summary: "Research synthesis",
    keyInsights: "Claims, methods & evidence",
    risks: "Limitations & contradictions",
    actions: "Research follow-ups",
  },
  "exam-prep": {
    summary: "Exam-ready overview",
    keyInsights: "High-yield facts & contrasts",
    risks: "Common traps",
    actions: "Practice prompts",
  },
  "flashcard-builder": {
    summary: "Learning overview",
    keyInsights: "Flashcard-ready concepts",
    risks: "Confusing distinctions",
    actions: "Recall prompts",
  },
  "quiz-generator": {
    summary: "Topic overview",
    keyInsights: "Quiz-worthy knowledge",
    risks: "Likely misconceptions",
    actions: "Practice questions",
  },
  "concept-explainer": {
    summary: "Concept overview",
    keyInsights: "Definitions & connections",
    risks: "Common misunderstandings",
    actions: "Check your understanding",
  },
  "the-executive": {
    summary: "Leadership brief",
    keyInsights: "Strategic implications",
    risks: "Risks & tradeoffs",
    actions: "Decision agenda",
  },
  "swot-analyzer": {
    summary: "SWOT overview",
    keyInsights: "Strengths & opportunities",
    risks: "Weaknesses & threats",
    actions: "Strategic priorities",
  },
  "market-analyst": {
    summary: "Market overview",
    keyInsights: "Market signals & positioning",
    risks: "Threats & uncertainties",
    actions: "Market questions to validate",
  },
  "startup-advisor": {
    summary: "Startup brief",
    keyInsights: "Problem, solution & traction",
    risks: "Gaps & venture risks",
    actions: "Founder priorities",
  },
  "meeting-notes-ai": {
    summary: "Meeting recap",
    keyInsights: "Decisions & discussion points",
    risks: "Open questions & blockers",
    actions: "Action items & owners",
  },
  "the-journalist": {
    summary: "Editorial brief",
    keyInsights: "Claims, context & stakes",
    risks: "Verification gaps",
    actions: "Reporting follow-ups",
  },
  "the-creator": {
    summary: "Creator brief",
    keyInsights: "Hooks, story angles & moments",
    risks: "Audience tensions & weak spots",
    actions: "Repurposing ideas",
  },
  "script-breakdown": {
    summary: "Script overview",
    keyInsights: "Scenes, beats & character turns",
    risks: "Story gaps & weak beats",
    actions: "Revision opportunities",
  },
  "podcast-summary": {
    summary: "Episode overview",
    keyInsights: "Themes, guests & quotable moments",
    risks: "Unclear claims & missing context",
    actions: "Follow-up & clip ideas",
  },
  "youtube-intelligence": {
    summary: "Video brief",
    keyInsights: "Argument flow & key moments",
    risks: "Claim gaps & caveats",
    actions: "Viewer & creator takeaways",
  },
  "action-items": {
    summary: "Execution overview",
    keyInsights: "Decisions & commitments",
    risks: "Blockers & dependencies",
    actions: "Actions, owners & deadlines",
  },
  "smart-notes": {
    summary: "Structured notes",
    keyInsights: "Key ideas & connections",
    risks: "Unclear or missing context",
    actions: "Review prompts",
  },
  "decision-mapper": {
    summary: "Decision overview",
    keyInsights: "Options & criteria",
    risks: "Tradeoffs & uncertainties",
    actions: "Decision next steps",
  },
  "timeline-builder": {
    summary: "Timeline overview",
    keyInsights: "Events & milestones",
    risks: "Gaps & dependencies",
    actions: "Next milestones",
  },
  "contract-analyzer": {
    summary: "Contract overview",
    keyInsights: "Key clauses & obligations",
    risks: "Risks & points to review",
    actions: "Verification checklist",
  },
  "technical-decoder": {
    summary: "Plain-English overview",
    keyInsights: "Components & mechanisms",
    risks: "Dependencies & failure points",
    actions: "Terms to verify",
  },
  "policy-interpreter": {
    summary: "Policy overview",
    keyInsights: "Rules, scope & responsibilities",
    risks: "Exceptions & points to review",
    actions: "Compliance checks",
  },
  "narrative-explorer": {
    summary: "Narrative overview",
    keyInsights: "Themes, arcs & motifs",
    risks: "Interpretive tensions",
    actions: "Discussion prompts",
  },
  "critical-thinking-mode": {
    summary: "Argument overview",
    keyInsights: "Claims, assumptions & evidence",
    risks: "Contradictions & weak reasoning",
    actions: "Questions to challenge",
  },
};

export function getModeResultSectionLabels(
  modeId: IntelligenceModeId,
  adaptiveLabels?: PersonaUiSectionLabels,
): ModeResultSectionLabels {
  return {
    ...MODE_RESULT_LABELS[modeId],
    ...adaptiveLabels,
  };
}

/**
 * The API shape remains stable, while each field gets mode-specific semantics.
 * Empty arrays are still preferred when the source does not support a section.
 */
export function getModeResultPromptGuidance(modeId: IntelligenceModeId): string {
  const labels = MODE_RESULT_LABELS[modeId];
  return [
    "Map the shared JSON fields to this mode-specific result structure:",
    `- summary → "${labels.summary}"`,
    `- keyInsights → "${labels.keyInsights}"`,
    `- risksOrWarnings → "${labels.risks}"`,
    `- actionItems → "${labels.actions}"`,
    "- Populate each field only with source-grounded content matching that meaning.",
    "- Use [] for risksOrWarnings or actionItems when the source does not support that section; never add generic filler.",
  ].join("\n");
}
