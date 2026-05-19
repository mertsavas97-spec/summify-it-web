"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const FEEDBACK_FORM_URL = process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL?.trim() ?? "";

type FeedbackModalProps = {
  open: boolean;
  onClose: () => void;
};

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleClose() {
    setMessage("");
    setSent(false);
    onClose();
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function handleExternalFeedback() {
    if (FEEDBACK_FORM_URL) {
      window.open(FEEDBACK_FORM_URL, "_blank", "noopener,noreferrer");
      handleClose();
    }
  }

  function handleMailto() {
    const subject = encodeURIComponent("Summify beta feedback");
    const body = encodeURIComponent(message.trim() || "(Your feedback here)");
    window.location.href = `mailto:hello@summify.app?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/75 backdrop-blur-sm"
        aria-label="Close"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <h2 id="feedback-modal-title" className="text-lg font-semibold text-white">
            Send feedback
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1 text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-sm text-zinc-400">
          Help us improve the public beta. Share what worked, what confused you, or what you wish
          Summify did better.
        </p>

        {FEEDBACK_FORM_URL ? (
          <div className="mt-5 space-y-3">
            <Button type="button" size="md" className="w-full" onClick={handleExternalFeedback}>
              Open feedback form
            </Button>
            <p className="text-center text-[11px] text-zinc-600">
              Opens in a new tab — powered by your configured form provider.
            </p>
          </div>
        ) : (
          <div className="mt-5">
            <label htmlFor="feedback-message" className="text-xs font-medium text-zinc-400">
              Your message
            </label>
            <textarea
              id="feedback-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What should we improve?"
              className="mt-1.5 w-full resize-none rounded-lg border border-white/[0.08] bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
            />
            <Button
              type="button"
              size="md"
              className="mt-3 w-full"
              onClick={handleMailto}
              disabled={sent}
            >
              {sent ? "Opening email…" : "Send via email"}
            </Button>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3 border-t border-white/[0.06] pt-4 text-xs">
          <Link href="/status" className="text-violet-400/90 hover:text-violet-300">
            System status
          </Link>
          <span className="text-zinc-700" aria-hidden>
            ·
          </span>
          <button
            type="button"
            className="text-zinc-500 hover:text-zinc-300"
            onClick={() => {
              const subject = encodeURIComponent("Summify issue report");
              window.location.href = `mailto:hello@summify.app?subject=${subject}`;
            }}
          >
            Report an issue
          </button>
        </div>
      </div>
    </div>
  );
}
