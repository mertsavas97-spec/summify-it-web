"use client";

import { useMemo, useState } from "react";
import { Globe, Link2, PlaySquare, Type } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { UploadZone } from "./UploadZone";
import type { PlanId } from "@/types/plan";
import type { UploadExtractStatus } from "@/types/extraction";

type UnifiedSourceComposerProps = {
  fileName: string | null;
  extractStatus: UploadExtractStatus;
  extractStatusMessage?: string | null;
  extractError: string | null;
  limitNotice?: string | null;
  planId: PlanId;
  rawText: string;
  linkValue: string;
  pipelineBusy: boolean;
  showTextInput: boolean;
  disabled?: boolean;
  compact?: boolean;
  onFileSelected: (file: File) => void;
  onLinkChange: (url: string) => void;
  onLinkSubmit: (url: string) => Promise<void>;
  onRawTextChange: (text: string) => void;
  onShowTextInput: () => void;
};

function detectLinkKind(url: string): "youtube" | "url" | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be" || host.includes("youtube.com")) return "youtube";
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return "url";
  } catch {
    return null;
  }
  return null;
}

export { detectLinkKind };

export function UnifiedSourceComposer({
  fileName,
  extractStatus,
  extractStatusMessage,
  extractError,
  limitNotice,
  planId,
  rawText,
  linkValue,
  pipelineBusy,
  showTextInput,
  disabled = false,
  compact = false,
  onFileSelected,
  onLinkChange,
  onLinkSubmit,
  onRawTextChange,
  onShowTextInput,
}: UnifiedSourceComposerProps) {
  const [linkInput, setLinkInput] = useState(linkValue);
  const [linkError, setLinkError] = useState<string | null>(null);
  const charCount = rawText.trim().length;
  const isBusy =
    disabled || pipelineBusy || extractStatus === "uploading" || extractStatus === "extracting";
  const detectedKind = useMemo(() => detectLinkKind(linkInput), [linkInput]);

  async function handleLinkSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = linkInput.trim();
    if (!trimmed) return;

    const kind = detectLinkKind(trimmed);
    if (!kind) {
      setLinkError("Enter a valid http(s) article link or YouTube URL.");
      return;
    }

    setLinkError(null);
    onLinkChange(trimmed);
    await onLinkSubmit(trimmed);
  }

  const inputIcon =
    detectedKind === "youtube" ? (
      <PlaySquare className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-400" />
    ) : detectedKind === "url" ? (
      <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-400" />
    ) : (
      <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
    );

  const linkField = (
    <form
      onSubmit={(event) => void handleLinkSubmit(event)}
      className="flex h-full flex-col justify-center space-y-2"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={compact ? "text-[11px] font-medium text-zinc-500" : "sr-only"}>
          Article or YouTube URL
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors ${
              detectedKind === "url"
                ? "border-sky-400/35 bg-sky-500/15 text-sky-200"
                : "border-white/[0.06] bg-white/[0.03] text-zinc-500"
            }`}
          >
            <Globe className="h-3 w-3" aria-hidden />
            Web
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors ${
              detectedKind === "youtube"
                ? "border-red-400/35 bg-red-500/15 text-red-200"
                : "border-white/[0.06] bg-white/[0.03] text-zinc-500"
            }`}
          >
            <PlaySquare className="h-3 w-3" aria-hidden />
            YouTube
          </span>
        </div>
      </div>
      <label className="block">
        <span className="sr-only">Article or YouTube URL</span>
        <div className="relative">
          {inputIcon}
          <input
            type="url"
            inputMode="url"
            value={linkInput}
            onChange={(event) => {
              setLinkInput(event.target.value);
              setLinkError(null);
            }}
            placeholder="Paste article or YouTube URL"
            disabled={isBusy}
            className={`w-full rounded-xl border bg-black/25 py-2 pl-10 pr-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 disabled:opacity-50 ${
              detectedKind === "youtube"
                ? "border-red-400/25 focus:border-red-400/40 focus:ring-red-500/25"
                : detectedKind === "url"
                  ? "border-sky-400/25 focus:border-sky-400/40 focus:ring-sky-500/25"
                  : "border-white/[0.08] focus:border-violet-500/40 focus:ring-violet-500/30"
            }`}
          />
        </div>
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" disabled={isBusy || linkInput.trim().length < 8}>
          {pipelineBusy
            ? "Fetching…"
            : detectedKind === "youtube"
              ? "Add YouTube"
              : detectedKind === "url"
                ? "Add article"
                : "Add link"}
        </Button>
        {!compact ? (
          <p className="text-[11px] text-zinc-600">
            <span className="text-sky-300/80">Web articles</span>
            {" · "}
            <span className="text-red-300/80">YouTube transcripts</span>
          </p>
        ) : (
          <p className="text-[10px] text-zinc-600">
            {detectedKind === "youtube"
              ? "YouTube transcript will be extracted"
              : detectedKind === "url"
                ? "Web article will be extracted"
                : "Supports web articles & YouTube"}
          </p>
        )}
      </div>
      {linkError ? (
        <p className="rounded-lg border border-red-500/20 bg-red-950/30 px-3 py-1.5 text-xs text-red-300">
          {linkError}
        </p>
      ) : null}
    </form>
  );

  if (compact) {
    return (
      <div className="space-y-3" data-unified-source-composer>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-stretch">
          <UploadZone
            fileName={fileName}
            status={extractStatus}
            statusLabel={extractStatusMessage}
            error={extractError}
            disabled={isBusy}
            planId={planId}
            limitNotice={limitNotice}
            onFileSelected={onFileSelected}
            variant="compact"
          />
          <div
            className={`rounded-2xl border bg-black/20 p-3 sm:p-4 ${
              detectedKind === "youtube"
                ? "border-red-400/20"
                : detectedKind === "url"
                  ? "border-sky-400/20"
                  : "border-white/[0.08]"
            }`}
          >
            {linkField}
          </div>
        </div>

        {showTextInput ? (
          <div className="space-y-1.5">
            <textarea
              value={rawText}
              onChange={(event) => onRawTextChange(event.target.value)}
              rows={3}
              placeholder="Paste notes, transcripts, or long-form text…"
              disabled={isBusy}
              className="w-full resize-y rounded-xl border border-white/[0.08] bg-black/25 px-3 py-2.5 text-sm leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30 disabled:opacity-50"
            />
            <p className="text-[11px] text-zinc-600">{charCount} chars · min 100</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={onShowTextInput}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-300/80 transition-colors hover:text-violet-200 disabled:opacity-50"
          >
            <Type className="h-3.5 w-3.5" />
            Paste text instead
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5" data-unified-source-composer>
      <UploadZone
        fileName={fileName}
        status={extractStatus}
        statusLabel={extractStatusMessage}
        error={extractError}
        disabled={isBusy}
        planId={planId}
        limitNotice={limitNotice}
        onFileSelected={onFileSelected}
      />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/[0.08]" />
        <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-600">
          or paste a link
        </span>
        <div className="h-px flex-1 bg-white/[0.08]" />
      </div>

      {linkField}

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/[0.08]" />
        <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-600">
          or paste text
        </span>
        <div className="h-px flex-1 bg-white/[0.08]" />
      </div>

      {showTextInput ? (
        <div className="space-y-2">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
              <Type className="h-3.5 w-3.5" />
              Text source
            </span>
            <textarea
              value={rawText}
              onChange={(event) => onRawTextChange(event.target.value)}
              rows={6}
              placeholder="Paste notes, transcripts, or long-form text…"
              disabled={isBusy}
              className="w-full resize-y rounded-xl border border-white/[0.08] bg-black/25 px-3 py-2.5 text-sm leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30 disabled:opacity-50"
            />
          </label>
          <p className="text-[11px] text-zinc-600">{charCount} characters · minimum 100</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={onShowTextInput}
          disabled={isBusy}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-300/80 transition-colors hover:text-violet-200 disabled:opacity-50"
        >
          <Type className="h-3.5 w-3.5" />
          Paste text instead
        </button>
      )}
    </div>
  );
}
