"use client";

import { useMemo, useState } from "react";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { SavedAnalysisCard } from "@/components/dashboard/SavedAnalysisCard";
import {
  getIntelligenceModeLabel,
  getSavedAnalysisPreview,
} from "@/lib/saved-analysis-labels";
import type { SavedAnalysisListItem } from "@/types/saved-analysis";

type DashboardAnalysesExplorerProps = {
  analyses: SavedAnalysisListItem[];
};

const SOURCE_FILTERS = [
  { value: "all", label: "All sources" },
  { value: "youtube", label: "YouTube" },
  { value: "presentation", label: "Presentation" },
  { value: "url", label: "Web article" },
  { value: "file", label: "Upload" },
  { value: "text", label: "Text" },
] as const;

const selectClassName =
  "rounded-lg border border-white/[0.08] bg-zinc-950/80 px-3 py-2 text-xs text-zinc-200 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30";

export function DashboardAnalysesExplorer({ analyses }: DashboardAnalysesExplorerProps) {
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [modeFilter, setModeFilter] = useState<string>("all");

  const modeOptions = useMemo(() => {
    const ids = new Set<string>();
    for (const a of analyses) {
      if (a.intelligence_mode) ids.add(a.intelligence_mode);
    }
    return Array.from(ids).sort();
  }, [analyses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return analyses.filter((item) => {
      if (sourceFilter !== "all" && item.source_kind !== sourceFilter) return false;
      if (modeFilter !== "all" && item.intelligence_mode !== modeFilter) return false;
      if (!q) return true;

      const title = (item.title ?? item.summary?.title ?? "").toLowerCase();
      const preview = getSavedAnalysisPreview(item.summary, 500).toLowerCase();
      const sourceLabel = (item.source_label ?? "").toLowerCase();
      const modeLabel = getIntelligenceModeLabel(item.intelligence_mode).toLowerCase();

      return (
        title.includes(q) ||
        preview.includes(q) ||
        sourceLabel.includes(q) ||
        modeLabel.includes(q)
      );
    });
  }, [analyses, query, sourceFilter, modeFilter]);

  if (analyses.length === 0) {
    return (
      <DashboardEmptyState
        title="No saved analyses yet"
        description="Complete an analysis in the workspace while signed in — your summary and Learn cards will appear here automatically."
        primaryAction={{ href: "/upload", label: "Start a new summary" }}
      />
    );
  }

  return (
    <section className="mt-8 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="min-w-[12rem] flex-1">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Search
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Title, summary, source…"
            className={`mt-1 w-full ${selectClassName}`}
          />
        </label>
        <label>
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Source
          </span>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className={`mt-1 block min-w-[9rem] ${selectClassName}`}
          >
            {SOURCE_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Mode
          </span>
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className={`mt-1 block min-w-[9rem] ${selectClassName}`}
          >
            <option value="all">All modes</option>
            {modeOptions.map((id) => (
              <option key={id} value={id}>
                {getIntelligenceModeLabel(id)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-[11px] text-zinc-600">
        Showing {filtered.length} of {analyses.length} saved{" "}
        {analyses.length === 1 ? "session" : "sessions"}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-4 py-8 text-center">
          <p className="text-sm text-zinc-400">No analyses match your filters.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSourceFilter("all");
              setModeFilter("all");
            }}
            className="mt-3 text-xs text-violet-400/90 hover:text-violet-300"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((analysis) => (
            <li key={analysis.id}>
              <SavedAnalysisCard analysis={analysis} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
