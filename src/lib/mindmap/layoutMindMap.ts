import type { MindMapGraph, MindMapNode } from "@/types/mindmap";

export type LayoutedMindMapNode = {
  id: string;
  x: number;
  y: number;
};

const NODE_WIDTH = 220;
/** Vertical distance between graph levels — must clear the tallest node card. */
const LEVEL_GAP_Y = 150;
/** Extra vertical distance between wrapped rows of the same level. */
const ROW_GAP_Y = 170;
const SIBLING_GAP_X = 240;
/** Horizontal gap between two root children (theme + groups) subtrees. */
const GROUP_GAP_X = 90;
/** Children per row before wrapping to the next row. */
const MAX_CHILDREN_PER_ROW = 4;

type RowPlacement = { id: string; x: number; y: number };

function wrapChildPlacements(
  children: MindMapNode[],
  centerX: number,
  startY: number,
): RowPlacement[] {
  const placements: RowPlacement[] = [];
  children.forEach((child, index) => {
    const row = Math.floor(index / MAX_CHILDREN_PER_ROW);
    const rowStartIndex = row * MAX_CHILDREN_PER_ROW;
    const rowCount = Math.min(MAX_CHILDREN_PER_ROW, children.length - rowStartIndex);
    const rowWidth = rowCount * NODE_WIDTH + (rowCount - 1) * (SIBLING_GAP_X - NODE_WIDTH);
    const rowStartX = centerX - rowWidth / 2;
    const column = index - rowStartIndex;
    placements.push({
      id: child.id,
      x: rowStartX + column * SIBLING_GAP_X,
      y: startY + row * ROW_GAP_Y,
    });
  });
  return placements;
}

function subtreeWidth(children: MindMapNode[]): number {
  if (children.length === 0) return NODE_WIDTH;
  const rowCount = Math.min(MAX_CHILDREN_PER_ROW, children.length);
  const rowWidth = rowCount * NODE_WIDTH + (rowCount - 1) * (SIBLING_GAP_X - NODE_WIDTH);
  return Math.max(NODE_WIDTH, rowWidth);
}

/**
 * Deterministic layout for React Flow.
 *
 * Root sits center-top; every direct child of the root (core theme + groups)
 * becomes its own centered column with its children wrapped into rows of
 * {@link MAX_CHILDREN_PER_ROW}. Nothing is capped by a fixed node count — the
 * map grows with the analysis instead of overlapping.
 */
export function layoutMindMapGraph(graph: MindMapGraph): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const root =
    graph.nodes.find((n) => n.id === "root") ??
    graph.nodes.find((n) => n.metadata.type === "root");
  if (!root) return positions;

  positions.set(root.id, { x: 0, y: 0 });

  const placed = new Set<string>([root.id]);
  const rootChildren = graph.nodes.filter((n) => n.parentId === root.id && n.id !== root.id);
  const childGroups = new Map<string, MindMapNode[]>();
  for (const node of graph.nodes) {
    if (!node.parentId || node.parentId === root.id || node.id === root.id) continue;
    const siblings = childGroups.get(node.parentId);
    if (siblings) siblings.push(node);
    else childGroups.set(node.parentId, [node]);
  }

  const widths = rootChildren.map((child) =>
    Math.max(NODE_WIDTH, subtreeWidth(childGroups.get(child.id) ?? [])),
  );
  const totalWidth =
    widths.reduce((sum, width) => sum + width, 0) +
    Math.max(0, widths.length - 1) * GROUP_GAP_X;

  let cursorX = -totalWidth / 2;
  rootChildren.forEach((child, index) => {
    const width = widths[index];
    const centerX = cursorX + width / 2;
    positions.set(child.id, { x: centerX - NODE_WIDTH / 2, y: LEVEL_GAP_Y });
    placed.add(child.id);

    const children = (childGroups.get(child.id) ?? []).filter((node) => !placed.has(node.id));
    for (const placement of wrapChildPlacements(children, centerX, LEVEL_GAP_Y * 2)) {
      positions.set(placement.id, { x: placement.x, y: placement.y });
      placed.add(placement.id);
    }
    cursorX += width + GROUP_GAP_X;
  });

  // Safety net: any node the walk missed (unexpected parent chain) gets a
  // staggered row below the map instead of stacking at a single point.
  const missed = graph.nodes.filter((node) => !placed.has(node.id));
  missed.forEach((node, index) => {
    positions.set(node.id, {
      x: (index % 6) * SIBLING_GAP_X - (5 * SIBLING_GAP_X) / 2,
      y: LEVEL_GAP_Y * 3 + Math.floor(index / 6) * ROW_GAP_Y,
    });
  });

  return positions;
}
