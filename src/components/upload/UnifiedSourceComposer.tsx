"use client";

import { useMemo, useState } from "react";
import { FileUp, Globe, Link2, PlaySquare, Type } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { UploadZone } from "./UploadZone";
import type { PlanId } from "@/types/plan";
import type { UploadExtractStatus } from "@/types/extraction";

type SourceChoice = "file" | "link" | "text";

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

const CHOICE_CARDS: {
  id: SourceChoice;
  title: string;
  blurb: string;
  Icon: typeof FileUp;
}[] = [
  { id: "file", title: "Upload file", blurb: "PDF, DOCX, PPTX", Icon: FileUp },
  { id: "link", title: "Paste a link", blurb: "Article or YouTube", Icon: Link2 },
  { id: "text", title: "Paste text", blurb: "Notes or transcript", Icon: Type },
];

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
  onFileSelected,
  onLinkChange,
  onLinkSubmit,
  onRawTextChange,
  onShowTextInput,
}: UnifiedSourceComposerProps) {
  const hasActiveFile =
    Boolean(fileName) || extractStatus === "uploading" || extractStatus === "extracting" || extractStatus === "ready";
  const hasActiveText = showTextInput || rawText.trim().length > 0;

  const [choice, setChoice] = useState<SourceChoice | null>(() => {
    if (hasActiveFile) return "file";
    if (linkValue.trim()) return "link";
    if (hasActiveText) return "text";
    return null;
  });
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

  function pickChoice(next: SourceChoice) {
    setChoice(next);
    if (next === "text") onShowTextInput();
  }

  // Choice grid — mutual exclusive, not parallel required fields
  if (!choice) {
    return (
      <div className="space-y-3" data-unified-source-composer data-source-choice-grid>
        <p className="text-xs text-zinc-500">File, link, or text — pick one.</p>
        <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Source type">
          {CHOICE_CARDS.map(({ id, title, blurb, Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={false}
              disabled={isBusy}
              onClick={() => pickChoice(id)}
              className="flex flex-col items-start gap-3 rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-4 text-left transition-all hover:border-violet-400/35 hover:bg-violet-950/20 disabled:opacity-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-200">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-semibold text-white">{title}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">{blurb}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-unified-source-composer data-source-choice={choice}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-zinc-400">
          {choice === "file" ? "Upload file" : choice === "link" ? "Paste a link" : "Paste text"}
        </p>
        <button
          type="button"
          disabled={isBusy}
          onClick={() => setChoice(null)}
          className="text-[11px] font-medium text-violet-300/90 hover:text-violet-200 disabled:opacity-50"
        >
          Change source type
        </button>
      </div>

      {choice === "file" ? (
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
      ) : null}

      {choice === "link" ? (
        <form
          onSubmit={(event) => void handleLinkSubmit(event)}
          className="space-y-2 rounded-2xl border border-white/[0.08] bg-black/20 p-3 sm:p-4"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                detectedKind === "url"
                  ? "border-sky-400/35 bg-sky-500/15 text-sky-200"
                  : "border-white/[0.06] text-zinc-500"
              }`}
            >
              <Globe className="h-3 w-3" aria-hidden />
              Web
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                detectedKind === "youtube"
                  ? "border-red-400/35 bg-red-500/15 text-red-200"
                  : "border-white/[0.06] text-zinc-500"
              }`}
            >
              <PlaySquare className="h-3 w-3" aria-hidden />
              YouTube
            </span>
          </div>
          <label className="block">
            <span className="sr-only">Article or YouTube URL</span>
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
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
                autoFocus
                className="w-full rounded-xl border border-white/[0.08] bg-black/25 py-2.5 pl-10 pr-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30 disabled:opacity-50"
              />
            </div>
          </label>
          <Button type="submit" size="sm" disabled={isBusy || linkInput.trim().length < 8}>
            {pipelineBusy
              ? "Fetching…"
              : detectedKind === "youtube"
                ? "Add YouTube"
                : detectedKind === "url"
                  ? "Add article"
                  : "Add link"}
          </Button>
          {linkError ? (
            <p className="rounded-lg border border-red-500/20 bg-red-950/30 px-3 py-1.5 text-xs text-red-300">
              {linkError}
            </p>
          ) : null}
        </form>
      ) : null}

      {choice === "text" ? (
        <div className="space-y-1.5">
          <textarea
            value={rawText}
            onChange={(event) => onRawTextChange(event.target.value)}
            rows={5}
            placeholder="Paste notes, transcripts, or long-form text…"
            disabled={isBusy}
            autoFocus
            className="w-full resize-y rounded-xl border border-white/[0.08] bg-black/25 px-3 py-2.5 text-sm leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30 disabled:opacity-50"
          />
          <p className="text-[11px] text-zinc-600">{charCount} chars · min 100</p>
        </div>
      ) : null}
    </div>
  );
}
