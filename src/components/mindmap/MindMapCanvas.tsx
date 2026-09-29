"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
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
import { X } from "lucide-react";
import type { MindMapGraph } from "@/types/mindmap";
import { splitReaderText } from "@/lib/mindmap/splitReaderText";
import { MindMapNodeCard, type MindMapFlowNodeData } from "./MindMapNodeCard";
import { mindMapGraphToFlow } from "./mindMapFlowAdapter";

const flowNodeTypes = { mindMap: MindMapNodeCard };

type MindMapCanvasInnerProps = {
  graph: MindMapGraph;
  onNodeSelect: (node: MindMapFlowNodeData) => void;
};

function MindMapCanvasInner({ graph, onNodeSelect }: MindMapCanvasInnerProps) {
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
      onNodeSelect(node.data);
      // Nudge the center point downward so the tapped card lands in the
      // upper half — the reader panel occupies the bottom of the canvas.
      setCenter(node.position.x + 110, node.position.y + 140, {
        zoom: 1.1,
        duration: 400,
      });
    },
    [onNodeSelect, setCenter],
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
      minZoom={0.3}
      maxZoom={1.6}
      /* Cards are read, not rearranged — dragging a node on touch would
         fight with panning the canvas. */
      nodesDraggable={false}
      onlyRenderVisibleElements
      zoomOnDoubleClick={false}
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

/**
 * Tap-to-read panel. Shows the full, unclamped text of the tapped card —
 * cards preview three lines only. Scrolls independently of the page.
 */
function MindMapNodeReader({
  data,
  onClose,
}: {
  data: MindMapFlowNodeData;
  onClose: () => void;
}) {
  const detail = data.detail?.trim() || data.insight?.trim() || "";
  const fullTitle = (data.fullTitle ?? data.title ?? "").trim();
  const { heading, body } = splitReaderText(detail, fullTitle);

  return (
    <div
      className="mindmap-reader absolute inset-x-2 bottom-2 z-20 flex max-h-[45%] min-h-[140px] flex-col overflow-hidden rounded-xl border border-violet-400/25 bg-zinc-950/95 shadow-[0_16px_48px_rgba(0,0,0,0.6)] backdrop-blur-sm sm:inset-x-4 sm:bottom-4"
      role="dialog"
      aria-label={fullTitle || data.title}
      style={{ touchAction: "pan-y" }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-3 py-2.5 sm:px-4">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-violet-300/70">
          {data.typeLabel ?? data.nodeType}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close card details"
          className="shrink-0 rounded-lg border border-white/10 bg-zinc-900/80 p-1.5 text-zinc-400 transition-colors hover:text-white"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4">
        {heading ? (
          <p className="mb-2 whitespace-pre-wrap break-words text-sm font-semibold leading-snug text-white">
            {heading}
          </p>
        ) : null}
        <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-zinc-300">
          {body || "No additional text for this card."}
        </p>
      </div>
      <p className="border-t border-white/[0.07] px-3 py-1.5 text-[10px] text-zinc-600 sm:px-4">
        Full text from this analysis. Drag the map to pan · pinch to zoom.
      </p>
    </div>
  );
}

type MindMapCanvasProps = {
  graph: MindMapGraph;
};

export function MindMapCanvas({ graph }: MindMapCanvasProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [sized, setSized] = useState(false);
  const [selected, setSelected] = useState<MindMapFlowNodeData | null>(null);

  // React Flow warns (and renders blank) when it mounts into a zero-size box.
  // Mount the flow only once the shell has real dimensions.
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const measure = () => {
      if (el.clientWidth > 0 && el.clientHeight > 0) setSized(true);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <ReactFlowProvider>
      <div
        ref={shellRef}
        className="mindmap-shell relative h-[min(68vh,640px)] min-h-[360px] w-full sm:h-[min(72vh,640px)]"
      >
        {sized ? (
          <MindMapCanvasInner graph={graph} onNodeSelect={setSelected} />
        ) : null}
        {selected ? (
          <MindMapNodeReader data={selected} onClose={() => setSelected(null)} />
        ) : null}
      </div>
    </ReactFlowProvider>
  );
}
