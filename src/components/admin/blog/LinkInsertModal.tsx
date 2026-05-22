"use client";

import { useMemo, useState } from "react";
import { isValidUrl } from "@/lib/blog/linkUtils";

type LinkInsertModalProps = {
  open: boolean;
  initialUrl?: string;
  initialLabel?: string;
  onClose: () => void;
  onConfirm: (markdown: string) => void;
};

export function LinkInsertModal({
  open,
  initialUrl = "https://",
  initialLabel = "",
  onClose,
  onConfirm,
}: LinkInsertModalProps) {
  const [url, setUrl] = useState(initialUrl);
  const [label, setLabel] = useState(initialLabel);
  const [openInNewTab, setOpenInNewTab] = useState(true);

  const validation = useMemo(() => {
    if (!label.trim()) return "Link text is required.";
    if (!url.trim()) return "URL is required.";
    if (!isValidUrl(url)) return "Enter a valid http(s) or relative URL.";
    return null;
  }, [url, label]);

  if (!open) return null;

  const isExternal = url.startsWith("http");
  const finalUrl = openInNewTab && isExternal ? url : url;
  const markdown = `[${label.trim()}](${finalUrl.trim()})`;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/70" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-white/[0.1] bg-zinc-950 p-5 shadow-2xl">
        <h3 className="text-sm font-semibold text-white">Insert link</h3>
        <p className="mt-1 text-xs text-zinc-500">
          {isExternal ? "External link" : "Internal link"} — markdown compatible
        </p>
        <label className="mt-4 block text-xs text-zinc-500">
          Link text
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          />
        </label>
        <label className="mt-3 block text-xs text-zinc-500">
          URL
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          />
        </label>
        <label className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
          <input
            type="checkbox"
            checked={openInNewTab}
            onChange={(e) => setOpenInNewTab(e.target.checked)}
            disabled={!isExternal}
          />
          Open external links in new tab (rendered on site)
        </label>
        {validation ? <p className="mt-2 text-xs text-rose-300/90">{validation}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={Boolean(validation)}
            onClick={() => {
              onConfirm(markdown);
              onClose();
            }}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40"
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}
