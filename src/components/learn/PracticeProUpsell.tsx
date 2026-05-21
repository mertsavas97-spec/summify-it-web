"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";

type PracticeProUpsellProps = {
  lockedCount: number;
  variant?: "overlay" | "continuation" | "compact";
  analysisId?: string;
  onFinishSession?: () => void;
  onBackToAnalysis?: () => void;
};

export function PracticeProUpsell({
  lockedCount,
  variant = "overlay",
  analysisId,
  onFinishSession,
  onBackToAnalysis,
}: PracticeProUpsellProps) {
  if (lockedCount <= 0) return null;

  const headline =
    variant === "continuation"
      ? `Continue with ${lockedCount} more practice card${lockedCount === 1 ? "" : "s"}`
      : `Unlock ${lockedCount} more practice card${lockedCount === 1 ? "" : "s"} with Pro`;

  const body =
    variant === "continuation"
      ? "Upgrade to Pro to unlock the full practice set generated from this analysis."
      : "Deeper review sessions, longer retention workflows, and advanced learning sets.";

  const benefits =
    variant === "continuation"
      ? [
          "Deeper review sessions",
          "More source-backed practice cards",
          "Advanced learning workflows",
        ]
      : null;

  const shellClass =
    variant === "continuation"
      ? "rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-950/30 via-zinc-950/80 to-zinc-950/95 p-5 sm:p-6 text-center"
      : variant === "compact"
        ? "relative rounded-lg border border-violet-500/20 bg-violet-950/25 px-3 py-3"
        : "relative overflow-hidden rounded-lg border border-violet-500/25 bg-gradient-to-br from-violet-950/40 via-zinc-950/90 to-zinc-950 px-4 py-4";

  return (
    <div className={shellClass} data-practice-pro-upsell>
      {variant !== "compact" && (
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-violet-600/10 to-transparent"
          aria-hidden
        />
      )}
      <div className={variant === "continuation" ? "" : "relative"}>
        {variant === "overlay" && (
          <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/10 text-violet-300/90">
            <Lock className="h-4 w-4" aria-hidden />
          </span>
        )}
        <p
          className={
            variant === "continuation"
              ? "text-lg font-semibold text-white"
              : "text-sm font-semibold text-zinc-100"
          }
        >
          {headline}
        </p>
        {body ? (
          <p className="mt-1.5 mx-auto max-w-md text-[11px] leading-relaxed text-zinc-500">{body}</p>
        ) : null}
        {benefits ? (
          <ul className="mx-auto mt-4 max-w-sm space-y-1.5 text-left text-[11px] text-zinc-500">
            {benefits.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-violet-400/80" aria-hidden>
                  ·
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div
          className={`flex flex-col gap-2 ${variant === "continuation" ? "mt-6 sm:flex-row sm:flex-wrap sm:justify-center" : "mt-4 sm:flex-row sm:flex-wrap"}`}
        >
          <Button href="/pricing?plan=pro" size="sm" className="shadow-md shadow-violet-500/15">
            Upgrade to Pro
          </Button>
          {variant === "continuation" && onFinishSession ? (
            <Button type="button" size="sm" variant="secondary" onClick={onFinishSession}>
              Finish session
            </Button>
          ) : null}
          {variant === "continuation" && (analysisId || onBackToAnalysis) ? (
            onBackToAnalysis ? (
              <Button type="button" size="sm" variant="ghost" onClick={onBackToAnalysis}>
                Back to analysis
              </Button>
            ) : (
              <Button href={`/dashboard/${analysisId}`} size="sm" variant="ghost">
                Back to analysis
              </Button>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
