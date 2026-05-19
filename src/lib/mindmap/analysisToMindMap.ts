import type {
  MindMapEdge,
  MindMapGenerationInput,
  MindMapGenerationResult,
  MindMapGraph,
  MindMapGraphProfile,
  MindMapGroup,
  MindMapNode,
  MindMapNodeImportance,
} from "@/types/mindmap";
import { resolveMindMapProfile } from "./resolveMindMapProfile";

const MAX_BRANCH_NODES = 6;
const MAX_LEARN_NODES = 8;
const SUMMARY_SNIPPET_LEN = 120;

function slugId(prefix: string, index: number): string {
  return `${prefix}-${index}`;
}

function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function importanceForIndex(index: number, total: number): MindMapNodeImportance {
  if (index === 0) return "primary";
  if (index < Math.ceil(total / 2)) return "secondary";
  return "tertiary";
}

function addBranch(
  nodes: MindMapNode[],
  edges: MindMapEdge[],
  rootId: string,
  groupId: string,
  groupLabel: string,
  items: string[],
  nodeType: MindMapNode["metadata"]["type"],
  edgeKind: MindMapEdge["kind"] = "hierarchy",
): void {
  const limited = items.filter(Boolean).slice(0, MAX_BRANCH_NODES);
  if (limited.length === 0) return;

  nodes.push({
    id: groupId,
    title: groupLabel,
    insight: `${limited.length} connected ideas`,
    groupId,
    parentId: rootId,
    metadata: { type: "theme", importance: "primary" },
  });
  edges.push({
    id: `e-${rootId}-${groupId}`,
    source: rootId,
    target: groupId,
    kind: edgeKind,
  });

  limited.forEach((text, i) => {
    const nodeId = slugId(groupId, i);
    nodes.push({
      id: nodeId,
      title: truncate(text, 72),
      insight: truncate(text, 140),
      groupId,
      parentId: groupId,
      metadata: {
        type: nodeType,
        importance: importanceForIndex(i, limited.length),
        sourceIndex: i,
      },
    });
    edges.push({
      id: `e-${groupId}-${nodeId}`,
      source: groupId,
      target: nodeId,
      kind: edgeKind,
    });
  });
}

function addLearnBranch(
  nodes: MindMapNode[],
  edges: MindMapEdge[],
  groups: MindMapGroup[],
  rootId: string,
  learnCards: MindMapGenerationInput["learnCards"],
): void {
  const cards = learnCards.slice(0, MAX_LEARN_NODES);
  if (cards.length === 0) return;

  const groupId = "group-learn";
  groups.push({ id: groupId, label: "Concepts", position: "east" });

  nodes.push({
    id: groupId,
    title: "Learn concepts",
    insight: `${cards.length} study anchors`,
    groupId,
    parentId: rootId,
    metadata: { type: "theme", importance: "primary" },
  });
  edges.push({ id: `e-${rootId}-${groupId}`, source: rootId, target: groupId });

  cards.forEach((card, i) => {
    const nodeId = slugId("learn", i);
    nodes.push({
      id: nodeId,
      title: truncate(card.title, 64),
      insight: truncate(card.content, 120),
      groupId,
      parentId: groupId,
      metadata: {
        type: "learn",
        importance: importanceForIndex(i, cards.length),
        sourceIndex: i,
      },
    });
    edges.push({
      id: `e-${groupId}-${nodeId}`,
      source: groupId,
      target: nodeId,
      kind: "hierarchy",
    });
  });
}

function buildProfileGraph(
  input: MindMapGenerationInput,
  profile: MindMapGraphProfile,
): MindMapGraph {
  const nodes: MindMapNode[] = [];
  const edges: MindMapEdge[] = [];
  const groups: MindMapGroup[] = [];
  const rootId = "root";

  nodes.push({
    id: rootId,
    title: truncate(input.title, 80),
    insight: truncate(input.summary, SUMMARY_SNIPPET_LEN),
    parentId: null,
    metadata: { type: "root", importance: "primary" },
  });

  const summarySnippet = truncate(input.summary, SUMMARY_SNIPPET_LEN);
  if (summarySnippet) {
    const themeId = "theme-core";
    groups.push({ id: themeId, label: "Core thesis", position: "center" });
    nodes.push({
      id: themeId,
      title: "Central thesis",
      insight: summarySnippet,
      groupId: themeId,
      parentId: rootId,
      metadata: { type: "theme", importance: "primary" },
    });
    edges.push({ id: `e-${rootId}-${themeId}`, source: rootId, target: themeId });
  }

  switch (profile) {
    case "meeting":
      groups.push({ id: "group-decisions", label: "Decisions", position: "west" });
      groups.push({ id: "group-insights", label: "Discussion", position: "east" });
      addBranch(
        nodes,
        edges,
        rootId,
        "group-decisions",
        "Decisions & actions",
        input.actionItems,
        "action",
      );
      addBranch(
        nodes,
        edges,
        rootId,
        "group-insights",
        "Key discussion",
        input.keyInsights,
        "insight",
      );
      if (input.risksOrWarnings.length > 0) {
        addBranch(
          nodes,
          edges,
          rootId,
          "group-risks",
          "Blockers",
          input.risksOrWarnings,
          "risk",
        );
      }
      break;

    case "research":
      groups.push({ id: "group-themes", label: "Themes", position: "north" });
      groups.push({ id: "group-evidence", label: "Evidence", position: "south" });
      addBranch(nodes, edges, rootId, "group-themes", "Research themes", input.keyInsights, "theme");
      addBranch(
        nodes,
        edges,
        rootId,
        "group-evidence",
        "Supporting points",
        input.actionItems.length > 0 ? input.actionItems : input.keyInsights.slice(1),
        "evidence",
        "relation",
      );
      break;

    case "contract":
      groups.push({ id: "group-obligations", label: "Obligations", position: "west" });
      groups.push({ id: "group-risks", label: "Risk surface", position: "east" });
      addBranch(
        nodes,
        edges,
        rootId,
        "group-obligations",
        "Obligations",
        input.actionItems.length > 0 ? input.actionItems : input.keyInsights,
        "obligation",
      );
      addBranch(nodes, edges, rootId, "group-risks", "Risks & clauses", input.risksOrWarnings, "risk");
      addBranch(nodes, edges, rootId, "group-insights", "Interpretation", input.keyInsights, "insight");
      break;

    case "educational":
      addLearnBranch(nodes, edges, groups, rootId, input.learnCards);
      addBranch(nodes, edges, rootId, "group-concepts", "Core concepts", input.keyInsights, "concept");
      if (input.actionItems.length > 0) {
        addBranch(nodes, edges, rootId, "group-practice", "Practice", input.actionItems, "action");
      }
      break;

    case "narrative": {
      groups.push({ id: "group-topics", label: "Topics", position: "north" });
      groups.push({ id: "group-flow", label: "Narrative", position: "south" });
      addBranch(nodes, edges, rootId, "group-topics", "Topics", input.keyInsights, "topic");
      const flowItems = splitNarrativeBeats(input.summary);
      addBranch(nodes, edges, rootId, "group-flow", "Story flow", flowItems, "timeline", "timeline");
      addLearnBranch(nodes, edges, groups, rootId, input.learnCards);
      break;
    }

    default:
      addBranch(nodes, edges, rootId, "group-insights", "Key insights", input.keyInsights, "insight");
      if (input.risksOrWarnings.length > 0) {
        addBranch(nodes, edges, rootId, "group-risks", "Risks", input.risksOrWarnings, "risk");
      }
      if (input.actionItems.length > 0) {
        addBranch(nodes, edges, rootId, "group-actions", "Next steps", input.actionItems, "action");
      }
      addLearnBranch(nodes, edges, groups, rootId, input.learnCards);
      break;
  }

  if (profile !== "educational" && profile !== "narrative" && input.learnCards.length > 0) {
    addLearnBranch(nodes, edges, groups, rootId, input.learnCards);
  }

  return {
    version: 1,
    profile,
    title: input.title,
    nodes,
    edges,
    groups,
    generatedAt: new Date().toISOString(),
  };
}

function splitNarrativeBeats(summary: string): string[] {
  const sentences = summary
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
  return sentences.slice(0, MAX_BRANCH_NODES);
}

/** Derive a mind map graph from existing analysis output (no extra AI call). */
export function analysisToMindMap(
  input: MindMapGenerationInput,
): MindMapGenerationResult {
  const hasContent =
    input.summary.trim().length > 0 ||
    input.keyInsights.length > 0 ||
    input.learnCards.length > 0;

  if (!hasContent) {
    return { ok: false, reason: "Insufficient analysis content" };
  }

  const profile = resolveMindMapProfile(input.documentTypeGuess, input.sourceKind);
  const graph = buildProfileGraph(input, profile);

  if (graph.nodes.length < 2) {
    return { ok: false, reason: "Could not build graph" };
  }

  return { ok: true, graph };
}
