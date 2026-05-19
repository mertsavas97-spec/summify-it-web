import Link from "next/link";
import { DeleteAnalysisButton } from "@/components/dashboard/DeleteAnalysisButton";
import { formatRelativeTime } from "@/lib/format-relative-time";
import {
  getIntelligenceModeLabel,
  getSavedAnalysisPreview,
  getSourceKindLabel,
} from "@/lib/saved-analysis-labels";
import type { SavedAnalysisListItem } from "@/types/saved-analysis";

function SourceIcon({ sourceKind }: { sourceKind: string | null }) {
  const label = getSourceKindLabel(sourceKind);
  const icon =
    sourceKind === "youtube"
      ? "▶"
      : sourceKind === "presentation"
        ? "◫"
        : sourceKind === "url"
          ? "⌁"
          : "▤";

  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-violet-950/40 to-zinc-950/80 text-sm text-violet-300/90 shadow-inner shadow-violet-500/5"
      aria-hidden
      title={label}
    >
      {icon}
    </span>
  );
}

type SavedAnalysisCardProps = {
  analysis: SavedAnalysisListItem;
  showDelete?: boolean;
};

export function SavedAnalysisCard({ analysis, showDelete = true }: SavedAnalysisCardProps) {
  const title = analysis.title ?? analysis.summary?.title ?? "Untitled analysis";
  const preview = getSavedAnalysisPreview(analysis.summary);
  const modeLabel = getIntelligenceModeLabel(analysis.intelligence_mode);
  const sourceLabel = analysis.source_label ?? getSourceKindLabel(analysis.source_kind);
  const createdLabel = formatRelativeTime(analysis.created_at);
  const createdExact = new Date(analysis.created_at).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <article className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-900/40 transition-all duration-200 hover:border-violet-500/30 hover:bg-zinc-900/70 hover:shadow-lg hover:shadow-violet-500/5">
      <Link
        href={`/dashboard/${analysis.id}`}
        className="flex gap-3.5 p-4 pr-3 transition-colors"
      >
        <SourceIcon sourceKind={analysis.source_kind} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-1 text-sm font-semibold text-zinc-100 group-hover:text-violet-100">
              {title}
            </h3>
            <time
              className="shrink-0 text-[10px] tabular-nums text-zinc-600"
              dateTime={analysis.created_at}
              title={createdExact}
            >
              {createdLabel}
            </time>
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]">
            <span className="rounded-md border border-white/[0.06] bg-zinc-950/60 px-1.5 py-0.5 text-zinc-400">
              {sourceLabel}
            </span>
            <span className="text-zinc-700">·</span>
            <span className="text-violet-300/70">{modeLabel}</span>
          </p>
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-500">{preview}</p>
          <p className="mt-3 text-[11px] font-medium text-violet-400/80 group-hover:text-violet-300">
            Open session →
          </p>
        </div>
      </Link>
      {showDelete && (
        <div className="flex items-center justify-end gap-1 border-t border-white/[0.04] bg-zinc-950/30 px-3 py-1.5">
          <DeleteAnalysisButton analysisId={analysis.id} redirectTo="/dashboard" />
        </div>
      )}
    </article>
  );
}
