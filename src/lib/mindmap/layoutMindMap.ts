import type { MindMapGraph } from "@/types/mindmap";

export type LayoutedMindMapNode = {
  id: string;
  x: number;
  y: number;
};

const LEVEL_GAP_Y = 140;
const SIBLING_GAP_X = 220;
const GROUP_GAP_X = 320;

/**
 * Deterministic tree-ish layout for React Flow.
 * Positions root at center-top; groups fan outward; leaves below groups.
 */
export function layoutMindMapGraph(graph: MindMapGraph): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const root = graph.nodes.find((n) => n.metadata.type === "root");
  if (!root) return positions;

  positions.set(root.id, { x: 0, y: 0 });

  const groupNodes = graph.nodes.filter(
    (n) => n.metadata.type === "theme" && n.id.startsWith("group-"),
  );
  const groupCount = groupNodes.length;
  const startX = (-(groupCount - 1) * GROUP_GAP_X) / 2;

  groupNodes.forEach((group, gi) => {
    const gx = groupCount === 1 ? 0 : startX + gi * GROUP_GAP_X;
    positions.set(group.id, { x: gx, y: LEVEL_GAP_Y });

    const children = graph.nodes.filter((n) => n.parentId === group.id);
    const childStartX = (-(children.length - 1) * SIBLING_GAP_X) / 2;
    children.forEach((child, ci) => {
      positions.set(child.id, {
        x: gx + childStartX + ci * SIBLING_GAP_X,
        y: LEVEL_GAP_Y * 2,
      });
    });
  });

  const themeCore = graph.nodes.find((n) => n.id === "theme-core");
  if (themeCore && !positions.has(themeCore.id)) {
    positions.set(themeCore.id, { x: 0, y: LEVEL_GAP_Y * 0.65 });
  }

  graph.nodes.forEach((node) => {
    if (!positions.has(node.id)) {
      positions.set(node.id, { x: 0, y: LEVEL_GAP_Y * 2.5 });
    }
  });

  return positions;
}
