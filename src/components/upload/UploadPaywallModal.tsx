"use client";

import { useEffect, useRef } from "react";
import { PricingSection } from "@/components/pricing/PricingSection";
import type { BillingStatusCopy } from "@/types/billing";

type UploadPaywallModalProps = {
  open: boolean;
  billing: BillingStatusCopy;
  scholarCheckoutEligible: boolean;
  onClose: () => void;
};

export function UploadPaywallModal({
  open,
  billing,
  scholarCheckoutEligible,
  onClose,
}: UploadPaywallModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    // Focus the panel so screen readers land in the modal.
    panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-paywall-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto overflow-x-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 shadow-2xl shadow-violet-500/10 outline-none sm:p-8"
      >
        <header className="text-center">
          <h2 id="upload-paywall-title" className="text-xl font-semibold text-white sm:text-2xl">
            You’ve used your free daily analyses.
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Upgrade to continue analyzing documents, videos, articles, and long-form content.
          </p>
        </header>

        <div className="mt-8">
          <PricingSection billing={billing} scholarCheckoutEligible={scholarCheckoutEligible} />
        </div>
      </div>
    </div>
  );
}
