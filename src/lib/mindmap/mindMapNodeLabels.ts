import type { MindMapGraphProfile, MindMapNodeType } from "@/types/mindmap";

/**
 * Node chip labels ("THEME", "CONCEPT"…) follow the analysis lens, not a
 * fixed vocabulary. The graph profile is already lens-derived (see
 * resolveMindMapLens), so a student map talks about concepts and practice
 * while an executive map talks about decisions and takeaways.
 */
export type MindMapNodeLabels = Partial<Record<MindMapNodeType, string>>;

const LABELS: Record<MindMapGraphProfile, MindMapNodeLabels> = {
  general: {
    root: "Central idea",
    theme: "Theme",
    concept: "Concept",
    insight: "Insight",
    action: "Next step",
    risk: "Risk",
    obligation: "Obligation",
    evidence: "Evidence",
    topic: "Topic",
    timeline: "Step",
    dependency: "Builds on",
    learn: "Study card",
  },
  executive: {
    root: "Brief",
    theme: "Focus area",
    concept: "Factor",
    insight: "Takeaway",
    action: "Decision",
    risk: "Risk",
    obligation: "Constraint",
    evidence: "Evidence",
    topic: "Topic",
    timeline: "Milestone",
    dependency: "Blocks",
    learn: "Reference",
  },
  educational: {
    root: "Topic",
    theme: "Module",
    concept: "Concept",
    insight: "Key point",
    action: "Practice",
    risk: "Common mistake",
    obligation: "Rule",
    evidence: "Example",
    topic: "Theme",
    timeline: "Step",
    dependency: "Builds on",
    learn: "Memory anchor",
  },
  narrative: {
    root: "Core thread",
    theme: "Thread",
    concept: "Idea",
    insight: "Point",
    action: "Next step",
    risk: "Risk",
    obligation: "Constraint",
    evidence: "Source",
    topic: "Angle",
    timeline: "Beat",
    dependency: "Setup",
    learn: "Craft note",
  },
  contract: {
    root: "Agreement",
    theme: "Section",
    concept: "Clause",
    insight: "Implication",
    action: "Next step",
    risk: "Risk",
    obligation: "Obligation",
    evidence: "Evidence",
    topic: "Topic",
    timeline: "Timeline",
    dependency: "Conditional on",
    learn: "Reference",
  },
  meeting: {
    root: "Meeting",
    theme: "Agenda item",
    concept: "Topic",
    insight: "Discussion point",
    action: "Decision",
    risk: "Concern",
    obligation: "Commitment",
    evidence: "Evidence",
    topic: "Topic",
    timeline: "Order",
    dependency: "Depends on",
    learn: "Follow-up",
  },
  research: {
    root: "Research question",
    theme: "Theme",
    concept: "Concept",
    insight: "Finding",
    action: "Next step",
    risk: "Limitation",
    obligation: "Constraint",
    evidence: "Evidence",
    topic: "Topic",
    timeline: "Step",
    dependency: "Builds on",
    learn: "Recall hook",
  },
};

export function resolveMindMapNodeLabels(
  profile: MindMapGraphProfile | undefined | null,
): MindMapNodeLabels {
  return (profile && LABELS[profile]) || LABELS.general;
}
