"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { FeedbackModal } from "@/components/growth/FeedbackModal";

type FeedbackTriggerProps = {
  variant?: "footer" | "inline";
  className?: string;
};

export function FeedbackTrigger({ variant = "footer", className = "" }: FeedbackTriggerProps) {
  const [open, setOpen] = useState(false);

  if (variant === "inline") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-violet-300 ${className}`}
        >
          <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden />
          Send feedback
        </button>
        <FeedbackModal open={open} onClose={() => setOpen(false)} />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-xs text-zinc-500 transition-colors hover:text-violet-300 ${className}`}
      >
        Send feedback
      </button>
      <FeedbackModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
