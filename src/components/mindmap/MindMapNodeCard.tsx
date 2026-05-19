"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { MindMapNodeImportance, MindMapNodeType } from "@/types/mindmap";

export type MindMapFlowNodeData = {
  title: string;
  insight?: string;
  nodeType: MindMapNodeType;
  importance: MindMapNodeImportance;
  focused?: boolean;
};

const TYPE_LABELS: Partial<Record<MindMapNodeType, string>> = {
  root: "Core",
  theme: "Theme",
  concept: "Concept",
  insight: "Insight",
  action: "Action",
  risk: "Risk",
  obligation: "Obligation",
  evidence: "Evidence",
  topic: "Topic",
  timeline: "Beat",
  learn: "Learn",
};

const IMPORTANCE_STYLES: Record<MindMapNodeImportance, string> = {
  primary:
    "border-violet-400/35 bg-gradient-to-br from-violet-950/50 to-zinc-900/90 shadow-[0_0_24px_rgba(139,92,246,0.12)]",
  secondary: "border-white/12 bg-zinc-900/85",
  tertiary: "border-white/[0.06] bg-zinc-950/80 opacity-90",
};

function MindMapNodeCardComponent({ data, selected }: NodeProps) {
  const d = data as MindMapFlowNodeData;
  const typeLabel = TYPE_LABELS[d.nodeType] ?? "Node";
  const importance = d.importance ?? "secondary";

  return (
    <div
      className={`mindmap-node-card w-[200px] rounded-xl border px-3 py-2.5 transition-all duration-300 sm:w-[220px] ${
        IMPORTANCE_STYLES[importance]
      } ${selected || d.focused ? "ring-2 ring-violet-400/50 scale-[1.02]" : ""} ${
        d.nodeType === "root" ? "w-[240px] sm:w-[260px]" : ""
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-violet-400/60 !w-2 !h-2 !border-0" />
      <p className="text-[9px] font-semibold uppercase tracking-wider text-violet-300/70">{typeLabel}</p>
      <p
        className={`mt-1 font-semibold leading-snug text-white ${
          d.nodeType === "root" ? "text-sm" : "text-xs"
        }`}
      >
        {d.title}
      </p>
      {d.insight ? (
        <p className="mt-1.5 line-clamp-3 text-[10px] leading-relaxed text-zinc-500">{d.insight}</p>
      ) : null}
      <Handle type="source" position={Position.Bottom} className="!bg-violet-400/40 !w-2 !h-2 !border-0" />
    </div>
  );
}

export const MindMapNodeCard = memo(MindMapNodeCardComponent);
