"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpen, Loader2, Play } from "lucide-react";
import { learnPracticeStartHref } from "@/lib/learn/paths";
import { Button } from "@/components/ui/Button";

type AnalysisMemoryActionsProps = {
  analysisId: string;
};

export function AnalysisMemoryActions({ analysisId }: AnalysisMemoryActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createPracticeSet(andOpen = false) {
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/analyses/${analysisId}/memory`, {
        method: "POST",
        credentials: "same-origin",
      });
      const payload = (await response.json()) as {
        success: boolean;
        created?: number;
        skipped?: number;
        limit?: number | null;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Couldn't create a practice set. Try again.");
      }

      if (andOpen) {
        router.push(learnPracticeStartHref(analysisId));
        return;
      }

      if ((payload.created ?? 0) > 0) {
        setMessage(`${payload.created} cards added to Learn.`);
      } else if (payload.limit != null) {
        setMessage("Practice card limit reached for your plan.");
      } else {
        setMessage("Practice set is already up to date for this analysis.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create a practice set. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="print-hide mt-5 rounded-xl border border-violet-500/15 bg-violet-950/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <BookOpen className="h-4 w-4 text-violet-300" aria-hidden />
            Learn
          </p>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-500">
            Turn this saved analysis into private practice cards from Learn cards and key insights.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void createPracticeSet(false)}
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
            )}
            Add to Learn
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void createPracticeSet(true)} disabled={pending}>
            Create practice set
          </Button>
          <Button href={learnPracticeStartHref(analysisId)} size="sm">
            <Play className="h-3.5 w-3.5" aria-hidden />
            Practice
          </Button>
        </div>
      </div>
      {message ? <p className="mt-3 text-xs text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
    </section>
  );
}
