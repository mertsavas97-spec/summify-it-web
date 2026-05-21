"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { LearnCardOutput } from "@/types/text-analysis";

const KIND_LABELS: Partial<Record<LearnCardOutput["type"], string>> = {
  concept: "Concept",
  why_it_matters: "Why",
  why: "Why",
  memory_hook: "Hook",
  quiz: "Quiz",
  connection: "Link",
  misconception: "Myth",
};

type LockedLearnCardPreviewProps = {
  card: LearnCardOutput;
  index: number;
  lockedCount: number;
};

/** Non-interactive blurred preview — answers are not exposed. */
export function LockedLearnCardPreview({
  card,
  index,
  lockedCount,
}: LockedLearnCardPreviewProps) {
  const showUpsell = index === 0 && lockedCount > 0;

  return (
    <li
      className="relative list-none overflow-hidden rounded-lg border border-violet-500/15 bg-zinc-950/50"
      data-learn-card-locked
    >
      <div className="relative p-2.5 opacity-70">
        <div className="pointer-events-none select-none blur-[4px]">
          <div className="flex gap-2.5">
            <span className="flex h-7 w-7 shrink-0 rounded-md border border-white/[0.06] bg-zinc-900/80" />
            <div className="min-w-0 flex-1">
              <p className="text-[8px] font-medium uppercase tracking-wider text-violet-400/50">
                {KIND_LABELS[card.type] ?? card.type}
              </p>
              <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-zinc-400">{card.title}</p>
            </div>
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 bg-zinc-950/50 px-3"
          aria-hidden
        >
          <Lock className="h-4 w-4 text-violet-300/80" />
          <p className="text-center text-[10px] font-medium text-zinc-400">
            Unlock this practice card with Pro
          </p>
        </div>
      </div>

      {showUpsell ? (
        <div className="border-t border-violet-500/15 bg-gradient-to-br from-violet-950/35 to-zinc-950/90 px-3 py-3">
          <p className="text-xs font-medium text-zinc-200">
            Upgrade to Pro to unlock +{lockedCount} more learning cards from this analysis.
          </p>
          <Button
            href="/pricing?plan=pro"
            size="sm"
            className="mt-2.5 shadow-md shadow-violet-500/15"
          >
            Upgrade to Pro
          </Button>
        </div>
      ) : null}
    </li>
  );
}
