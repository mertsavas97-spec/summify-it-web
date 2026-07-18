"use client";

import { useCallback, useMemo, useState, type MouseEvent } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { MindMapGraph } from "@/types/mindmap";
import { MindMapNodeCard, type MindMapFlowNodeData } from "./MindMapNodeCard";
import { mindMapGraphToFlow } from "./mindMapFlowAdapter";

const flowNodeTypes = { mindMap: MindMapNodeCard };

type MindMapCanvasInnerProps = {
  graph: MindMapGraph;
};

function MindMapCanvasInner({ graph }: MindMapCanvasInnerProps) {
  const { fitView, setCenter } = useReactFlow();
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => mindMapGraphToFlow(graph),
    [graph],
  );

  const nodes = useMemo(
    () =>
      initialNodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          focused: n.id === focusedId,
        },
      })),
    [initialNodes, focusedId],
  );

  const onNodeClick = useCallback(
    (_: MouseEvent, node: Node<MindMapFlowNodeData>) => {
      setFocusedId(node.id);
      setCenter(node.position.x + 110, node.position.y + 40, {
        zoom: 1.1,
        duration: 400,
      });
    },
    [setCenter],
  );

  const onInit = useCallback(() => {
    void fitView({ padding: 0.2, duration: 500 });
  }, [fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={initialEdges}
      nodeTypes={flowNodeTypes}
      onNodeClick={onNodeClick}
      onInit={onInit}
      fitView
      minZoom={0.35}
      maxZoom={1.6}
      proOptions={{ hideAttribution: true }}
      className="mindmap-flow rounded-xl"
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1}
        color="rgba(139, 92, 246, 0.12)"
      />
      <Controls
        showInteractive={false}
        className="!rounded-lg !border-white/10 !bg-zinc-900/90 !shadow-lg [&>button]:!border-white/10 [&>button]:!bg-zinc-800 [&>button]:!text-zinc-300 [&>button:hover]:!bg-zinc-700"
      />
    </ReactFlow>
  );
}

type MindMapCanvasProps = {
  graph: MindMapGraph;
};

export function MindMapCanvas({ graph }: MindMapCanvasProps) {
  return (
    <ReactFlowProvider>
      <div className="h-[min(72vh,640px)] w-full min-h-[360px]">
        <MindMapCanvasInner graph={graph} />
      </div>
    </ReactFlowProvider>
  );
}
