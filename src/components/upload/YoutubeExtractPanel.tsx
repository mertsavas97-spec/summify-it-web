"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { IntelligenceLoadingStages } from "./IntelligenceLoadingStages";
import { YOUTUBE_PIPELINE_STAGES } from "@/lib/loading-stages";
import type { UploadExtractStatus } from "@/types/extraction";

type YoutubeExtractPanelProps = {
  status: UploadExtractStatus;
  error: string | null;
  analysisError: string | null;
  sourceUrl: string | null;
  pipelineActive: boolean;
  onUrlChange: (url: string) => void;
  onAnalyzeVideo: (url: string) => Promise<void>;
  onRetryAnalysis: () => Promise<void>;
  disabled?: boolean;
};

export function YoutubeExtractPanel({
  status,
  error,
  analysisError,
  sourceUrl,
  pipelineActive,
  onUrlChange,
  onAnalyzeVideo,
  onRetryAnalysis,
  disabled = false,
}: YoutubeExtractPanelProps) {
  const [urlInput, setUrlInput] = useState(sourceUrl ?? "");
  const isBusy = pipelineActive || status === "extracting";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onUrlChange(trimmed);
    await onAnalyzeVideo(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" data-workspace-youtube-input>
      <label className="block">
        <span className="text-xs font-medium text-zinc-400">YouTube URL</span>
        <input
          type="url"
          inputMode="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=…"
          disabled={disabled || isBusy}
          className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-black/25 px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30 disabled:opacity-50"
        />
      </label>
      <p className="text-[11px] leading-relaxed text-zinc-600">
        Transcript-only intelligence — no video download. Captions must be available.
      </p>
      <Button
        type="submit"
        size="sm"
        disabled={disabled || isBusy || urlInput.trim().length < 8}
      >
        {isBusy ? "Fetching transcript…" : "Add YouTube video"}
      </Button>

      {pipelineActive && (
        <IntelligenceLoadingStages
          key="youtube-pipeline"
          active
          stages={YOUTUBE_PIPELINE_STAGES}
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
            Transcript extracted. Analysis failed — you can retry or edit the transcript below.
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
