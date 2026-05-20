"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { learnDashboardHref } from "@/lib/learn/paths";
import { Button } from "@/components/ui/Button";

type LearnPracticeActionsProps = {
  analysisId: string;
  hasPracticeCards: boolean;
  backHref: string;
};

export function LearnPracticeActions({
  analysisId,
  hasPracticeCards,
  backHref,
}: LearnPracticeActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generatePracticeSet() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/analyses/${analysisId}/memory`, {
        method: "POST",
        credentials: "same-origin",
      });
      const payload = (await response.json()) as {
        success?: boolean;
        created?: number;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Couldn't create a practice set. Try again.");
      }

      router.push(learnDashboardHref(analysisId));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create a practice set. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {hasPracticeCards ? (
        <Button href={`${learnDashboardHref(analysisId)}#practice`} size="sm">
          Start practice
        </Button>
      ) : (
        <Button type="button" size="sm" disabled={pending} onClick={() => void generatePracticeSet()}>
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : null}
          Create practice set
        </Button>
      )}
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() => void generatePracticeSet()}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
        )}
        Regenerate practice set
      </Button>
      <Button href={backHref} size="sm" variant="ghost">
        Back to analysis
      </Button>
      {error ? <p className="w-full text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
