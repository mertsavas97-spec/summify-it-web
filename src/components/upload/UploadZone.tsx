"use client";

import { UploadCloudIcon } from "@/components/icons";
import { FormatBadges } from "./FormatBadges";
import { acceptFileExtensions } from "@/data/fileTypes";
import { getUploadZoneCopy } from "@/lib/plans/uploadCopy";
import type { PlanId } from "@/types/plan";
import type { UploadExtractStatus } from "@/types/extraction";

type UploadZoneProps = {
  fileName: string | null;
  status: UploadExtractStatus;
  statusLabel?: string | null;
  error: string | null;
  disabled?: boolean;
  planId: PlanId;
  limitNotice?: string | null;
  onFileSelected: (file: File) => void;
  variant?: "default" | "compact";
};

const STATUS_LABELS: Record<UploadExtractStatus, string> = {
  idle: "Awaiting document",
  uploading: "Uploading…",
  extracting: "Extracting text…",
  ready: "Ready for analysis",
  failed: "Extraction failed",
};

const STATUS_STYLES: Record<UploadExtractStatus, string> = {
  idle: "border border-white/[0.06] bg-white/[0.03] text-zinc-500",
  uploading: "bg-violet-500/20 text-violet-300",
  extracting: "bg-violet-500/20 text-violet-300",
  ready: "bg-emerald-500/15 text-emerald-400",
  failed: "bg-red-500/15 text-red-400",
};

const EMPTY_FORMATS = ["PDF", "DOCX", "PPTX", "TXT"];

export function UploadZone({
  fileName,
  status,
  statusLabel,
  error,
  disabled = false,
  planId,
  limitNotice,
  onFileSelected,
  variant = "default",
}: UploadZoneProps) {
  const copy = getUploadZoneCopy(planId);
  const compact = variant === "compact";
  const isDraggingAllowed = status === "idle" || status === "ready" || status === "failed";
  const isBusy = status === "uploading" || status === "extracting";
  const showEmptyDropState = !fileName && status === "idle";

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDraggingAllowed || disabled) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDraggingAllowed || disabled) return;
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFileSelected(dropped);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) onFileSelected(selected);
    e.target.value = "";
  };

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {!showEmptyDropState && (
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-medium text-zinc-300">
            Document upload
          </label>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[status]}`}
          >
            {statusLabel ?? STATUS_LABELS[status]}
          </span>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative rounded-2xl border border-dashed transition-all duration-200 ${
          status === "ready"
            ? "border-emerald-500/30 bg-emerald-950/10"
            : status === "failed"
              ? "border-red-500/25 bg-red-950/10"
            : isBusy
                ? "border-violet-400/40 bg-violet-500/10"
                : "border-white/[0.1] bg-black/20 hover:border-violet-400/35 hover:bg-violet-950/10"
        } ${disabled || isBusy ? "pointer-events-none opacity-80" : ""}`}
      >
        <input
          type="file"
          accept={acceptFileExtensions}
          onChange={handleFileSelect}
          disabled={disabled || isBusy}
          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          aria-label="Upload document"
        />
        <div
          className={
            showEmptyDropState
              ? compact
                ? "flex min-h-[108px] flex-col items-center justify-center px-4 py-5 text-center sm:min-h-[116px] sm:flex-row sm:gap-3 sm:text-left"
                : "flex min-h-[260px] flex-col items-center justify-center px-6 py-10 text-center sm:min-h-[300px]"
              : "flex items-center gap-4 px-4 py-5 sm:px-5"
          }
        >
          <span
            className={`flex shrink-0 items-center justify-center rounded-xl border ${
              status === "ready"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-violet-400/20 bg-violet-500/10 text-violet-200"
            } ${showEmptyDropState ? (compact ? "h-10 w-10" : "h-14 w-14") : "h-11 w-11"}`}
          >
            <UploadCloudIcon className={showEmptyDropState ? (compact ? "h-4 w-4" : "h-6 w-6") : "h-5 w-5"} />
          </span>
          <div className={showEmptyDropState ? (compact ? "sm:min-w-0 sm:flex-1" : "mt-5") : "min-w-0 flex-1 text-left"}>
            <p
              className={
                showEmptyDropState
                  ? compact
                    ? "text-sm font-semibold text-white"
                    : "text-lg font-semibold text-white"
                  : "truncate text-sm font-medium text-white"
              }
            >
              {fileName ?? (compact ? "Drop file or click to browse" : "Drag & drop your file here")}
            </p>
            <p
              className={
                showEmptyDropState
                  ? compact
                    ? "mt-0.5 text-xs text-zinc-500"
                    : "mt-1 text-sm text-violet-200/80"
                  : "mt-0.5 text-xs text-zinc-500"
              }
            >
              {showEmptyDropState
                ? compact
                  ? "PDF · DOCX · PPTX · TXT"
                  : "or click to browse"
                : copy.limitLine}
            </p>
            {showEmptyDropState && !compact && (
              <>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {EMPTY_FORMATS.map((format) => (
                    <span
                      key={format}
                      className="rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 font-mono text-[11px] font-medium text-zinc-400"
                    >
                      {format}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-xs text-zinc-500">Long-form documents supported.</p>
              </>
            )}
          </div>
        </div>
      </div>

      {!showEmptyDropState && <FormatBadges formats={copy.formats} />}
      {limitNotice && (
        <p className="rounded-lg border border-amber-500/20 bg-amber-950/20 px-3 py-2 text-xs text-amber-200/90">
          {limitNotice}
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-950/30 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}
      {!compact ? (
        <p className="text-[11px] text-zinc-600">
          Files are processed on the server for text extraction only — nothing is stored.
        </p>
      ) : null}
    </div>
  );
}
