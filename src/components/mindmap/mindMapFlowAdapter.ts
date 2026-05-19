import type { Edge, Node } from "@xyflow/react";
import { layoutMindMapGraph } from "@/lib/mindmap/layoutMindMap";
import type { MindMapGraph } from "@/types/mindmap";
import type { MindMapFlowNodeData } from "./MindMapNodeCard";

export function mindMapGraphToFlow(graph: MindMapGraph): {
  nodes: Node<MindMapFlowNodeData>[];
  edges: Edge[];
} {
  const positions = layoutMindMapGraph(graph);

  const nodes: Node<MindMapFlowNodeData>[] = graph.nodes.map((n) => {
    const pos = positions.get(n.id) ?? { x: 0, y: 0 };
    return {
      id: n.id,
      type: "mindMap",
      position: pos,
      data: {
        title: n.title,
        insight: n.insight,
        nodeType: n.metadata.type,
        importance: n.metadata.importance ?? "secondary",
      },
    };
  });

  const edges: Edge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: "smoothstep",
    animated: e.kind === "timeline" || e.kind === "dependency",
    label: e.label,
    style: {
      stroke: "rgba(139, 92, 246, 0.35)",
      strokeWidth: e.kind === "hierarchy" ? 1.5 : 1,
    },
    labelStyle: { fill: "#a1a1aa", fontSize: 10 },
  }));

  return { nodes, edges };
}
