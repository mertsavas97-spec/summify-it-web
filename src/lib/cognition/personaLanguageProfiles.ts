/**
 * Phase 11C — persona-dominant language contract (tone, vocabulary, synthesis).
 * Prepended to cognition prompt block (included in system prompt).
 */

const STUDENT_DOMINANCE = `PERSONA LANGUAGE — STUDENT (DOMINANT):
- Write for learning and retention: clear definitions, timelines, contrasts, and recall cues.
- Explanatory and patient; assume the reader is studying the source, not briefing an executive.
- FORBIDDEN register: corporate strategy, KPIs, "stakeholder alignment", "next steps for the business", "market positioning", "synergies", "leverage", "deliverables" unless those exact concepts appear in the source.
- Prefer: who/what/when, cause–effect, compare–contrast, key terms, one concrete takeaway per idea.
- summary: follow the adaptive plan section intents (context, timeline, themes, mechanisms) — not a neutral executive précis.
- keyInsights: each bullet must teach something concrete from the text (dates, claims, mechanisms, motifs).
- Do not hedge with generic meta-advice ("consider bias", "read critically") unless the source discusses methodology or interpretation explicitly.`;

const EXECUTIVE_DOMINANCE = `PERSONA LANGUAGE — EXECUTIVE (DOMINANT):
- Concise, decision-oriented; lead with implications and choices.
- Prefer metrics, owners, deadlines, and tradeoffs when the source supplies them.
- Avoid emotional interpretation or literary commentary unless the document is narrative content.
- FORBIDDEN: student-style drill questions unless the doc is educational material.`;

const CREATOR_DOMINANCE = `PERSONA LANGUAGE — CREATOR (DOMINANT):
- Narrative-aware, vivid, angle-first; hooks and beats before abstract summary.
- Metaphor and cinematic framing allowed when grounded in the source.
- FORBIDDEN: dry syllabus tone, generic exam tips, corporate KPI framing unless present in source.`;

const RESEARCHER_DOMINANCE = `PERSONA LANGUAGE — RESEARCHER (DOMINANT):
- Evidence-first; separate claims from support; flag uncertainty where the source does.
- Methodology and limitations matter; avoid activist or promotional tone.
- FORBIDDEN: clickbait hooks, marketing angles unless analyzing promotional content.`;

const JOURNALIST_DOMINANCE = `PERSONA LANGUAGE — JOURNALIST (DOMINANT):
- Lead with what's new; attribute claims; note what's asserted vs evidenced.
- Public relevance and framing angles — still grounded in the document.
- FORBIDDEN: textbook drill tone unless the piece is instructional.`;

const LEGAL_DOMINANCE = `PERSONA LANGUAGE — LEGAL / POLICY INFORMATIONAL (DOMINANT):
- Neutral clause-oriented prose; parties, obligations, dates, scope.
- FORBIDDEN: legal advice, recommendations to sign/act, predicted outcomes — summarize text only.`;

const TECHNICAL_DOMINANCE = `PERSONA LANGUAGE — TECHNICAL (DOMINANT):
- Systems thinking: components, data flow, dependencies, failure modes from the source.
- Define jargon in plain English when the doc is dense.
- FORBIDDEN: executive strategy filler, creative hook language unless doc is UX/product narrative.`;

const DEFAULT_DOMINANCE = `PERSONA LANGUAGE — GENERAL (DOMINANT):
- Match the document's subject; avoid template openers ("This document discusses…").
- Prefer concrete nouns and source-specific phrasing over abstract business language.`;

const MODE_RULES: Array<{ test: (id: string) => boolean; block: string }> = [
  {
    test: (id) =>
      [
        "the-student",
        "exam-prep",
        "flashcard-builder",
        "quiz-generator",
        "concept-explainer",
        "smart-notes",
      ].includes(id),
    block: STUDENT_DOMINANCE,
  },
  {
    test: (id) =>
      [
        "executive-brief",
        "the-executive",
        "swot-analyzer",
        "market-analyst",
        "startup-advisor",
        "meeting-notes-ai",
        "action-items",
        "decision-mapper",
        "timeline-builder",
      ].includes(id),
    block: EXECUTIVE_DOMINANCE,
  },
  {
    test: (id) =>
      [
        "the-creator",
        "script-breakdown",
        "podcast-summary",
        "youtube-intelligence",
        "narrative-explorer",
      ].includes(id),
    block: CREATOR_DOMINANCE,
  },
  {
    test: (id) => ["the-researcher", "critical-thinking-mode", "deep-dive"].includes(id),
    block: RESEARCHER_DOMINANCE,
  },
  { test: (id) => id === "the-journalist", block: JOURNALIST_DOMINANCE },
  {
    test: (id) => id === "contract-analyzer" || id === "policy-interpreter",
    block: LEGAL_DOMINANCE,
  },
];

function resolveBlock(modeId: string): string {
  if (modeId === "technical-decoder") return TECHNICAL_DOMINANCE;
  for (const { test, block } of MODE_RULES) {
    if (test(modeId)) return block;
  }
  return DEFAULT_DOMINANCE;
}

/** Long-form block for cognition / system prompt (persona dominates generic summary defaults). */
export function buildPersonaLanguageBlock(modeId: string): string {
  const block = resolveBlock(modeId);
  return [
    "=== PERSONA LANGUAGE CONTRACT (DOMINANT) ===",
    "If generic 'balanced summary' instructions conflict with this contract or the ADAPTIVE ANALYSIS PLAN, THIS contract and the plan win.",
    block,
    "=== END PERSONA LANGUAGE ===",
  ].join("\n");
}
