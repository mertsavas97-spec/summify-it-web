import Link from "next/link";
import { DeleteAnalysisButton } from "@/components/dashboard/DeleteAnalysisButton";
import { learnDashboardHref } from "@/lib/learn/paths";
import { formatStableDate, formatStableDateTime } from "@/lib/format-date";
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
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-200 bg-gradient-to-br from-violet-100 to-slate-100 text-sm text-violet-700 shadow-inner shadow-violet-500/10 dark:border-white/[0.08] dark:from-violet-950/40 dark:to-zinc-950/80 dark:text-violet-300/90 dark:shadow-violet-500/5"
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
  const title = analysis.title ?? analysis.summary?.title ?? "Untitled learning session";
  const preview = getSavedAnalysisPreview(analysis.summary);
  const modeLabel = getIntelligenceModeLabel(analysis.intelligence_mode);
  const sourceLabel = analysis.source_label ?? getSourceKindLabel(analysis.source_kind);
  const createdLabel = formatStableDate(analysis.created_at);
  const createdExact = formatStableDateTime(analysis.created_at);
  const hasAudio = !!(analysis.metadata?.audioStudy || analysis.metadata?.podcastDiscussion);

  return (
    <article className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:border-violet-300 hover:bg-slate-50 hover:shadow-lg hover:shadow-violet-500/10 dark:border-white/[0.08] dark:bg-zinc-900/40 dark:hover:border-violet-500/30 dark:hover:bg-zinc-900/70 dark:hover:shadow-violet-500/5">
      <Link
        href={`/dashboard/${analysis.id}`}
        className="flex gap-3.5 p-4 pr-3 transition-colors"
      >
        <SourceIcon sourceKind={analysis.source_kind} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-1 text-sm font-semibold text-slate-900 group-hover:text-violet-700 dark:text-zinc-100 dark:group-hover:text-violet-100">
              {title}
            </h3>
            <time
              className="shrink-0 text-[10px] tabular-nums text-slate-500 dark:text-zinc-600"
              dateTime={analysis.created_at}
              title={createdExact}
            >
              {createdLabel}
            </time>
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]">
            <span className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-slate-600 dark:border-white/[0.06] dark:bg-zinc-950/60 dark:text-zinc-400">
              {sourceLabel}
            </span>
            <span className="text-slate-300 dark:text-zinc-700">·</span>
            <span className="text-violet-300/70">{modeLabel}</span>
            {hasAudio && (
              <>
                <span className="text-slate-300 dark:text-zinc-700">·</span>
                <span className="flex items-center gap-1 text-emerald-400/90">
                  <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                  Audio Ready
                </span>
              </>
            )}
          </p>
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-zinc-500">{preview}</p>
          <p className="mt-3 text-[11px] font-medium text-violet-400/80 group-hover:text-violet-300">
            {hasAudio ? "Listen to lesson →" : "Continue learning →"}
          </p>
        </div>
      </Link>
      <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-white/[0.04] dark:bg-zinc-950/30">
        <Link
          href={learnDashboardHref(analysis.id)}
          onClick={(e) => e.stopPropagation()}
          className="rounded-md px-2 py-1 text-[11px] font-medium text-violet-400/90 transition-colors hover:bg-violet-500/10 hover:text-violet-300"
        >
          Review
        </Link>
        {showDelete ? (
          <DeleteAnalysisButton analysisId={analysis.id} redirectTo="/dashboard" />
        ) : null}
      </div>
    </article>
  );
}
