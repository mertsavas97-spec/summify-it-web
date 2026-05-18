"use client";

import { UploadCloudIcon } from "@/components/icons";
import { FormatBadges } from "./FormatBadges";
import {
  acceptFileExtensions,
  maxPagesWebPreview,
  maxUploadSizeMb,
} from "@/data/fileTypes";
import type { UploadExtractStatus } from "@/types/extraction";

type UploadZoneProps = {
  fileName: string | null;
  status: UploadExtractStatus;
  error: string | null;
  disabled?: boolean;
  onFileSelected: (file: File) => void;
};

const STATUS_LABELS: Record<UploadExtractStatus, string> = {
  idle: "Awaiting document",
  uploading: "Uploading…",
  extracting: "Extracting text…",
  ready: "Ready for analysis",
  failed: "Extraction failed",
};

const STATUS_STYLES: Record<UploadExtractStatus, string> = {
  idle: "bg-zinc-800 text-zinc-500",
  uploading: "bg-violet-500/20 text-violet-300",
  extracting: "bg-violet-500/20 text-violet-300",
  ready: "bg-emerald-500/15 text-emerald-400",
  failed: "bg-red-500/15 text-red-400",
};

export function UploadZone({
  fileName,
  status,
  error,
  disabled = false,
  onFileSelected,
}: UploadZoneProps) {
  const isDraggingAllowed = status === "idle" || status === "ready" || status === "failed";
  const isBusy = status === "uploading" || status === "extracting";

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
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-zinc-400">
          Document upload
        </label>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[status]}`}
        >
          {STATUS_LABELS[status]}
        </span>
      </div>

      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative rounded-xl border border-dashed transition-all duration-200 ${
          status === "ready"
            ? "border-emerald-500/30 bg-emerald-950/10"
            : status === "failed"
              ? "border-red-500/25 bg-red-950/10"
              : isBusy
                ? "border-violet-400/40 bg-violet-500/10"
                : "border-white/12 bg-zinc-950/40 hover:border-white/20 hover:bg-zinc-900/50"
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
        <div className="flex items-center gap-4 px-4 py-5 sm:px-5">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${
              status === "ready"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-white/[0.06] bg-zinc-900 text-zinc-500"
            }`}
          >
            <UploadCloudIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-medium text-white">
              {fileName ?? "Drop PDF, DOCX, TXT, or PPTX — or click to browse"}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Max {maxUploadSizeMb} MB · up to {maxPagesWebPreview} pages after
              extraction
            </p>
          </div>
        </div>
      </div>

      <FormatBadges />
      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-950/30 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}
      <p className="text-[10px] text-zinc-600">
        Files are processed on the server for text extraction only — nothing is
        stored.
      </p>
    </div>
  );
}
