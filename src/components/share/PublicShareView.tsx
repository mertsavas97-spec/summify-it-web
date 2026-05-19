import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PublicAnalysisWorkspace } from "@/components/share/PublicAnalysisWorkspace";
import { ShareConversionSection } from "@/components/share/ShareConversionSection";
import { SharePageTracker } from "@/components/share/SharePageTracker";
import { ShareSocialActions } from "@/components/share/ShareSocialActions";
import { ShareStickyCta } from "@/components/share/ShareStickyCta";
import {
  getIntelligenceModeLabel,
  getSourceKindLabel,
} from "@/lib/saved-analysis-labels";
import { formatStableDate } from "@/lib/format-date";
import type { PublicSharedAnalysis } from "@/types/saved-analysis";
import type { AnalysisResult } from "@/types/text-analysis";

type PublicShareViewProps = {
  shared: PublicSharedAnalysis;
  shareId: string;
};

export function PublicShareView({ shared, shareId }: PublicShareViewProps) {
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
    <article className="print-share-article pb-24">
      <SharePageTracker
        shareId={shareId}
        sourceKind={shared.source_kind ?? undefined}
      />

      <header className="print-hide border-b border-white/[0.06] bg-[#0e1016]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <BrandMark href="/" size="nav" />
          <Button href="/upload" size="sm">
            Upload your own source
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <Badge variant="accent" className="mb-3">
          Shared intelligence
        </Badge>
        <p className="text-[11px] font-medium uppercase tracking-wider text-violet-400/70">
          Generated with Summify
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
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

        {shareId ? (
          <div className="print-hide mt-5">
            <ShareSocialActions shareId={shareId} title={result.title} />
          </div>
        ) : null}

        <aside className="print-hide mt-8 rounded-xl border border-white/[0.06] bg-zinc-950/40 p-4 text-sm text-zinc-500">
          <p className="font-medium text-zinc-300">
            Turn your own PDF into summaries, mind maps, and review cards.
          </p>
          <p className="mt-1 text-xs leading-relaxed">
            <Link href="/upload" className="text-violet-400/90 hover:text-violet-300">
              Upload your own source
            </Link>
            {" · "}
            <Link
              href="/guides/pdf-to-flashcards-workflow"
              className="text-violet-400/90 hover:text-violet-300"
            >
              Practice what you learn
            </Link>
          </p>
        </aside>

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

        {shareId ? (
          <ShareConversionSection shareId={shareId} title={result.title} />
        ) : null}
      </div>

      <ShareStickyCta />
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
