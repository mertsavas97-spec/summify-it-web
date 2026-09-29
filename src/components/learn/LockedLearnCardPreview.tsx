"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { lockedFlashcardUpsellLabel } from "@/lib/learn/practiceCardAccess";

type LockedLearnCardPreviewProps = {
  index: number;
  lockedCount: number;
};

/** Non-interactive blurred shell. Answer and title text stay out of the DOM. */
export function LockedLearnCardPreview({
  index,
  lockedCount,
}: LockedLearnCardPreviewProps) {
  const showUpsell = index === 0 && lockedCount > 0;

  return (
    <li className="list-none" data-learn-card-locked>
      {showUpsell ? (
        <div className="mb-2 rounded-xl border border-amber-300/50 bg-gradient-to-r from-amber-400/20 via-amber-500/10 to-violet-500/15 px-3 py-3 shadow-[0_0_28px_-8px_rgba(251,191,36,0.95)]">
          <p className="text-sm font-semibold tracking-tight text-amber-50" data-locked-flashcard-count>
            {lockedFlashcardUpsellLabel(lockedCount)}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-100/80">
            These extra study cards stay blurred until you upgrade.
          </p>
          <Button
            href="/pricing?plan=pro"
            size="sm"
            className="mt-2.5 shadow-md shadow-amber-500/20"
          >
            Upgrade to Pro
          </Button>
        </div>
      ) : null}
      <div className="relative overflow-hidden rounded-lg border border-amber-400/25 bg-zinc-950/60">
        <div className="pointer-events-none select-none p-3 blur-md" aria-hidden>
          <div className="h-2 w-14 rounded-full bg-zinc-600/90" />
          <div className="mt-2.5 h-3 w-4/5 rounded bg-zinc-500/80" />
          <div className="mt-1.5 h-3 w-3/5 rounded bg-zinc-600/80" />
          <div className="mt-1.5 h-3 w-2/5 rounded bg-zinc-700/80" />
        </div>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-zinc-950/35">
          <Lock className="h-4 w-4 text-amber-200/90" aria-hidden />
        </div>
      </div>
    </li>
  );
}
