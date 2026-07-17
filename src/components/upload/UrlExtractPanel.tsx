"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { IntelligenceLoadingStages } from "./IntelligenceLoadingStages";
import { WEB_PIPELINE_STAGES } from "@/lib/loading-stages";
import type { UploadExtractStatus } from "@/types/extraction";

type UrlExtractPanelProps = {
  status: UploadExtractStatus;
  error: string | null;
  analysisError: string | null;
  sourceUrl: string | null;
  pipelineActive: boolean;
  onUrlChange: (url: string) => void;
  onAnalyzeArticle: (url: string) => Promise<void>;
  onRetryAnalysis: () => Promise<void>;
  disabled?: boolean;
};

export function UrlExtractPanel({
  status,
  error,
  analysisError,
  sourceUrl,
  pipelineActive,
  onUrlChange,
  onAnalyzeArticle,
  onRetryAnalysis,
  disabled = false,
}: UrlExtractPanelProps) {
  const [urlInput, setUrlInput] = useState(sourceUrl ?? "");
  const isBusy = pipelineActive || status === "extracting";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onUrlChange(trimmed);
    await onAnalyzeArticle(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" data-workspace-url-input>
      <label className="block">
        <span className="text-xs font-medium text-zinc-400">Article URL</span>
        <input
          type="url"
          inputMode="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://example.com/article"
          disabled={disabled || isBusy}
          className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-black/25 px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30 disabled:opacity-50"
        />
      </label>
      <p className="text-[11px] leading-relaxed text-zinc-600">
        Public http(s) articles only. Paywalled or login-only pages may fail.
      </p>
      <Button
        type="submit"
        size="sm"
        disabled={disabled || isBusy || urlInput.trim().length < 8}
      >
        {isBusy ? "Fetching article…" : "Add article"}
      </Button>

      {pipelineActive && (
        <IntelligenceLoadingStages
          key="web-pipeline"
          active
          stages={WEB_PIPELINE_STAGES}
        />
      )}

      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-950/30 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}

      {analysisError && status === "ready" && (
        <div className="space-y-2 rounded-lg border border-amber-500/25 bg-amber-950/20 px-3 py-2.5">
          <p className="text-xs text-amber-200/90">
            Article extracted. Analysis failed — retry or edit the article text below.
          </p>
          <p className="text-[11px] text-red-300/90">{analysisError}</p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={isBusy}
            onClick={() => onRetryAnalysis()}
          >
            Retry analysis
          </Button>
        </div>
      )}
    </form>
  );
}
