"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/types/text-analysis";

type AnalysisToolbarProps = {
  result: AnalysisResult;
};

function buildCopyText(result: AnalysisResult): string {
  const lines = [
    result.title,
    "",
    result.summary,
    "",
    "Key insights",
    ...result.keyInsights.map((i) => `• ${i}`),
  ];

  if (result.risksOrWarnings.length > 0) {
    lines.push("", "Risks & warnings", ...result.risksOrWarnings.map((i) => `• ${i}`));
  }
  if (result.actionItems.length > 0) {
    lines.push("", "Action items", ...result.actionItems.map((i) => `• ${i}`));
  }

  return lines.join("\n");
}

type ToolbarAction = {
  id: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  locked?: boolean;
  title?: string;
};

export function AnalysisToolbar({ result }: AnalysisToolbarProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildCopyText(result));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  const actions: ToolbarAction[] = [
    {
      id: "copy",
      label: copied ? "Copied" : "Copy summary",
      onClick: handleCopy,
    },
    {
      id: "export",
      label: "Export",
      disabled: true,
      title: "Export coming soon",
    },
    {
      id: "save",
      label: "Save to workspace",
      disabled: true,
      locked: true,
      title: "Pro — workspace persistence coming soon",
    },
    {
      id: "compare",
      label: "Compare",
      disabled: true,
      title: "Compare mode coming soon",
    },
  ];

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 rounded-lg border border-white/[0.06] bg-zinc-950/60 p-1"
      data-workspace-toolbar
      role="toolbar"
      aria-label="Analysis actions"
    >
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          disabled={action.disabled}
          title={action.title}
          onClick={action.onClick}
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
            action.disabled
              ? "cursor-not-allowed text-zinc-600"
              : "text-zinc-300 hover:bg-white/5 hover:text-white"
          } ${action.locked ? "opacity-70" : ""}`}
        >
          {action.locked && (
            <svg className="h-3 w-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          )}
          {action.label}
        </button>
      ))}
    </div>
  );
}
