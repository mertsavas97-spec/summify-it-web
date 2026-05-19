import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PublicAnalysisWorkspace } from "@/components/share/PublicAnalysisWorkspace";
import {
  getIntelligenceModeLabel,
  getSourceKindLabel,
} from "@/lib/saved-analysis-labels";
import { formatStableDate } from "@/lib/format-date";
import type { PublicSharedAnalysis } from "@/types/saved-analysis";
import type { AnalysisResult } from "@/types/text-analysis";

type PublicShareViewProps = {
  shared: PublicSharedAnalysis;
};

export function PublicShareView({ shared }: PublicShareViewProps) {
  const result: AnalysisResult = {
    title: shared.summary.title ?? shared.title,
    summary: shared.summary.summary,
    keyInsights: shared.summary.keyInsights ?? [],
    risksOrWarnings: shared.summary.risksOrWarnings ?? [],
    actionItems: shared.summary.actionItems ?? [],
    learnCards: shared.learn_cards ?? [],
  };

  const sharedDate = shared.shared_at ? formatStableDate(shared.shared_at) : null;

  return (
    <article className="print-share-article">
      <header className="print-hide border-b border-white/[0.06] bg-[#0e1016]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <BrandMark href="/" size="nav" />
          <Button href="/upload" size="sm">
            Create your own analysis
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <Badge variant="accent" className="mb-3">
          Shared intelligence
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {result.title}
        </h1>
        <dl className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500">
          <MetaChip label="Source" value={getSourceKindLabel(shared.source_kind)} />
          <MetaChip label="Mode" value={getIntelligenceModeLabel(shared.intelligence_mode)} />
          {sharedDate ? <MetaChip label="Shared" value={sharedDate} /> : null}
        </dl>

        <p className="mt-4 text-sm leading-relaxed text-zinc-500">
          Structured summary and Learn cards — no raw uploads or private files are included on
          this page.
        </p>

        <div className="mt-10">
          <PublicAnalysisWorkspace
            result={result}
            mindMapInput={{
              title: result.title,
              summary: result.summary,
              keyInsights: result.keyInsights,
              risksOrWarnings: result.risksOrWarnings,
              actionItems: result.actionItems,
              learnCards: result.learnCards,
              sourceKind: shared.source_kind,
            }}
          />
        </div>

        <footer className="print-hide mt-12 rounded-2xl border border-violet-500/15 bg-gradient-to-br from-violet-950/30 to-zinc-950/80 p-6 text-center">
          <p className="text-sm font-medium text-white">Turn your sources into intelligence</p>
          <p className="mt-2 text-xs text-zinc-500">
            Summify structures PDFs, decks, videos, and articles into summaries and Learn cards.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button href="/upload" size="sm">
              Create your own analysis
            </Button>
            <Button href="/pricing" size="sm" variant="secondary">
              View plans
            </Button>
          </div>
          <p className="mt-6 text-[10px] text-zinc-600">
            <Link href="/" className="hover:text-violet-400/80">
              Summify
            </Link>
            {" · "}
            <Link href="/privacy" className="hover:text-violet-400/80">
              Privacy
            </Link>
          </p>
        </footer>
      </div>
    </article>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-zinc-950/50 px-2.5 py-1">
      <dt className="text-[9px] font-medium uppercase tracking-wider text-zinc-600">{label}</dt>
      <dd className="mt-0.5 font-medium text-zinc-400">{value}</dd>
    </div>
  );
}
