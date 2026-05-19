"use client";

import { useState } from "react";
import {
  buildJsonExport,
  buildMarkdownExport,
  buildTxtExport,
  downloadTextFile,
  sanitizeExportFilename,
  type AnalysisExportContext,
} from "@/lib/export/analysisExport";
import type { AnalysisResult } from "@/types/text-analysis";

type AnalysisExportToolbarProps = {
  result: AnalysisResult;
  exportContext?: AnalysisExportContext;
  className?: string;
};

type ToolbarAction = {
  id: string;
  label: string;
  onClick: () => void | Promise<void>;
};

export function AnalysisExportToolbar({
  result,
  exportContext = {},
  className = "",
}: AnalysisExportToolbarProps) {
  const [copied, setCopied] = useState<"markdown" | null>(null);
  const baseName = sanitizeExportFilename(result.title);

  async function handleCopyMarkdown() {
    try {
      await navigator.clipboard.writeText(buildMarkdownExport(result, exportContext));
      setCopied("markdown");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  function handleExportTxt() {
    downloadTextFile(`${baseName}.txt`, buildTxtExport(result, exportContext), "text/plain");
  }

  function handleExportJson() {
    downloadTextFile(
      `${baseName}.json`,
      buildJsonExport(result, exportContext),
      "application/json",
    );
  }

  function handlePrint() {
    window.print();
  }

  const actions: ToolbarAction[] = [
    {
      id: "copy-md",
      label: copied === "markdown" ? "Copied" : "Copy as Markdown",
      onClick: handleCopyMarkdown,
    },
    { id: "txt", label: "Export as TXT", onClick: handleExportTxt },
    { id: "json", label: "Export as JSON", onClick: handleExportJson },
    { id: "print", label: "Print / Save PDF", onClick: handlePrint },
  ];

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 rounded-lg border border-white/[0.06] bg-zinc-950/60 p-1 ${className}`}
      data-analysis-export-toolbar
      role="toolbar"
      aria-label="Export insight"
    >
      <span className="hidden px-2 text-[10px] font-medium uppercase tracking-wider text-zinc-600 sm:inline">
        Export insight
      </span>
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => void action.onClick()}
          className="inline-flex items-center rounded-md px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
