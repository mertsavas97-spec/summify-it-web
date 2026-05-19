"use client";

import { useState } from "react";
import { Brain, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

type AnalysisMemoryActionsProps = {
  analysisId: string;
};

export function AnalysisMemoryActions({ analysisId }: AnalysisMemoryActionsProps) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generateReviewSet() {
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/analyses/${analysisId}/memory`, { method: "POST" });
      const payload = (await response.json()) as {
        success: boolean;
        created?: number;
        skipped?: number;
        limit?: number | null;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Could not generate review set.");
      }

      if ((payload.created ?? 0) > 0) {
        setMessage(`${payload.created} cards added to memory.`);
      } else if (payload.limit != null) {
        setMessage("Memory limit reached for this plan preview.");
      } else {
        setMessage("This analysis is already in memory.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate review set.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="print-hide mt-5 rounded-xl border border-violet-500/15 bg-violet-950/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <Brain className="h-4 w-4 text-violet-300" aria-hidden />
            Memory
          </p>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-500">
            Add this saved analysis to private spaced repetition using existing Learn cards and insights.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={generateReviewSet} disabled={pending}>
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Brain className="h-3.5 w-3.5" aria-hidden />}
            Add to memory
          </Button>
          <Button size="sm" variant="ghost" onClick={generateReviewSet} disabled={pending}>
            Generate review set
          </Button>
          <Button href="/dashboard/memory" size="sm" variant="ghost">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Review
          </Button>
        </div>
      </div>
      {message ? <p className="mt-3 text-xs text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
    </section>
  );
}
