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
import { resolveMindMapLens } from "./resolveMindMapLens";

/**
 * Node budget follows the source, not a fixed ceiling: the analysis quotas
 * already scale with source length, so the map mirrors whatever came back.
 * Only absurd inputs (thousands of nodes) get trimmed to keep React Flow
 * interactive — that guard is ~10x above the current analysis hard caps.
 */
const ABSOLUTE_NODE_GUARD = 400;
const SUMMARY_SNIPPET_LEN = 120;
/** Full text kept per node for the tap-to-read panel (never unbounded). */
const DETAIL_MAX_LEN = 4_000;
/** Long sources earn a "flow" branch that walks the summary in order. */
const DEEP_SOURCE_CHAR_THRESHOLD = 18_000;

function clampDetail(text: string | null | undefined): string | undefined {
  const t = typeof text === "string" ? text.trim() : "";
  if (!t) return undefined;
  if (t.length <= DETAIL_MAX_LEN) return t;
  return `${t.slice(0, DETAIL_MAX_LEN - 1).trimEnd()}…`;
}

function slugId(prefix: string, index: number): string {
  return `${prefix}-${index}`;
}

function truncate(text: string | null | undefined, max: number): string {
  const t = typeof text === "string" ? text.trim() : "";
  if (!t) return "";
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
  const limited = items.filter(Boolean);
  if (limited.length === 0) return;

  nodes.push({
    id: groupId,
    title: groupLabel,
    insight: `${limited.length} connected ideas`,
    detail: `${groupLabel} — ${limited.length} connected ideas from this analysis.`,
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
      fullTitle: clampDetail(text),
      insight: truncate(text, 140),
      detail: clampDetail(text),
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
  const cards = learnCards.filter((card) =>
    Boolean(card?.title?.trim() || card?.content?.trim()),
  );
  if (cards.length === 0) return;

  const groupId = "group-learn";
  groups.push({ id: groupId, label: "Concepts", position: "east" });

  nodes.push({
    id: groupId,
    title: "Learn concepts",
    insight: `${cards.length} study anchors`,
    detail: `${cards.length} study anchors generated for this analysis.`,
    groupId,
    parentId: rootId,
    metadata: { type: "theme", importance: "primary" },
  });
  edges.push({ id: `e-${rootId}-${groupId}`, source: rootId, target: groupId });

  cards.forEach((card, i) => {
    const nodeId = slugId("learn", i);
    // `title` is the card's question; it is deliberately untruncated here so
    // the reader can show the whole prompt, never a mid-sentence cut.
    const rawTitle = typeof card.title === "string" ? card.title.trim() : "";
    const title = truncate(card.title, 64) || truncate(card.content, 64) || `Concept ${i + 1}`;
    const insight = truncate(card.content, 120) || truncate(card.title, 120);
    nodes.push({
      id: nodeId,
      title,
      fullTitle: clampDetail(rawTitle) ?? clampDetail(card.content) ?? title,
      insight: insight || undefined,
      detail: clampDetail(card.content || card.title),
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
    fullTitle: clampDetail(input.title) ?? truncate(input.title, 80),
    insight: truncate(input.summary, SUMMARY_SNIPPET_LEN),
    detail: clampDetail(input.summary) || clampDetail(input.title),
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
      detail: clampDetail(input.summary),
      groupId: themeId,
      parentId: rootId,
      // Typed as a root-level anchor so the chip picks up the lens label
      // ("Brief", "Topic"…) instead of the generic "Theme".
      metadata: { type: "root", importance: "primary" },
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

    case "executive":
      addBranch(
        nodes,
        edges,
        rootId,
        "group-decisions",
        "Decisions & implications",
        input.actionItems.length > 0 ? input.actionItems : input.keyInsights,
        "action",
      );
      addBranch(nodes, edges, rootId, "group-insights", "Leadership takeaways", input.keyInsights, "insight");
      if (input.risksOrWarnings.length > 0) {
        addBranch(nodes, edges, rootId, "group-risks", "Risks to goals", input.risksOrWarnings, "risk");
      }
      break;

    default:
      addBranch(nodes, edges, rootId, "group-insights", "Key insights", input.keyInsights, "insight");
      if (input.risksOrWarnings.length > 0) {
        addBranch(nodes, edges, rootId, "group-risks", "Risks", input.risksOrWarnings, "risk");
      }
      if (input.actionItems.length > 0) {
        addBranch(nodes, edges, rootId, "group-actions", "Next steps", input.actionItems, "action");
      }
      break;
  }

  // Single source of truth for the learn branch: educational and narrative
  // profiles add it inside their own case, everyone else gets it here —
  // never both, or nodes land with duplicate ids.
  if (profile !== "educational" && profile !== "narrative" && input.learnCards.length > 0) {
    addLearnBranch(nodes, edges, groups, rootId, input.learnCards);
  }

  // Long sources earn a chronological flow branch so depth is visible in the
  // map, not just in the number of nodes. Narrative profiles already have one.
  const sourceChars = typeof input.sourceChars === "number" ? input.sourceChars : 0;
  if (profile !== "narrative" && sourceChars >= DEEP_SOURCE_CHAR_THRESHOLD) {
    const beats = splitNarrativeBeats(input.summary);
    if (beats.length > 1) {
      groups.push({ id: "group-flow", label: "Source flow", position: "south" });
      addBranch(nodes, edges, rootId, "group-flow", "How the source unfolds", beats, "timeline", "timeline");
    }
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
  return sentences;
}

/** Derive a mind map graph from existing analysis output (no extra AI call). */
export function analysisToMindMap(
  input: MindMapGenerationInput,
): MindMapGenerationResult {
  const title = typeof input.title === "string" ? input.title : "";
  const summary = typeof input.summary === "string" ? input.summary : "";
  const keyInsights = Array.isArray(input.keyInsights)
    ? input.keyInsights.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const risksOrWarnings = Array.isArray(input.risksOrWarnings)
    ? input.risksOrWarnings.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const actionItems = Array.isArray(input.actionItems)
    ? input.actionItems.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const learnCards = Array.isArray(input.learnCards)
    ? input.learnCards
        .filter((card) => card && typeof card === "object")
        .map((card) => ({
          type: typeof card.type === "string" ? card.type : "concept",
          title: typeof card.title === "string" ? card.title : "",
          content: typeof card.content === "string" ? card.content : "",
        }))
        .filter((card) => card.title.trim().length > 0 || card.content.trim().length > 0)
    : [];

  const normalized: MindMapGenerationInput = {
    ...input,
    title: title || "Shared analysis",
    summary,
    keyInsights,
    risksOrWarnings,
    actionItems,
    learnCards,
  };

  const hasContent =
    normalized.summary.trim().length > 0 ||
    normalized.keyInsights.length > 0 ||
    normalized.learnCards.length > 0;

  if (!hasContent) {
    return { ok: false, reason: "Insufficient analysis content" };
  }

  try {
    const profile = resolveMindMapLens(
      normalized.intelligenceMode,
      normalized.documentTypeGuess,
      normalized.sourceKind,
    );
    let graph = buildProfileGraph(normalized, profile);

    if (graph.nodes.length > ABSOLUTE_NODE_GUARD) {
      // Keep React Flow interactive on pathological inputs; normal analysis
      // output stays far below this line.
      const keep = new Set(graph.nodes.slice(0, ABSOLUTE_NODE_GUARD).map((node) => node.id));
      graph = {
        ...graph,
        nodes: graph.nodes.filter((node) => keep.has(node.id)),
        edges: graph.edges.filter((edge) => keep.has(edge.source) && keep.has(edge.target)),
      };
    }

    if (graph.nodes.length < 2) {
      return { ok: false, reason: "Could not build graph" };
    }

    return { ok: true, graph };
  } catch (error) {
    console.error("[mindmap] analysisToMindMap_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, reason: "Mind map generation failed" };
  }
}
