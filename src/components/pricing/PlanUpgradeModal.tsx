"use client";

import Link from "next/link";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/events";
import { getPlanDefinition } from "@/data/pricingPlans";
import { getUpgradePlanForMode } from "@/lib/plan-features";
import type { IntelligenceModeDefinition } from "@/types/modes";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type PlanUpgradeModalProps = {
  mode: IntelligenceModeDefinition | null;
  onClose: () => void;
};

export function PlanUpgradeModal({ mode, onClose }: PlanUpgradeModalProps) {
  useEffect(() => {
    if (!mode) return;
    trackEvent("upgrade_modal_opened", {
      mode_id: mode.id,
      mode_label: mode.label,
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, onClose]);

  if (!mode) return null;

  const upgradePlanId = getUpgradePlanForMode(mode);
  const upgradePlan = getPlanDefinition(upgradePlanId);
  const proPlan = getPlanDefinition("pro");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-violet-500/25 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 shadow-2xl shadow-violet-500/10">
        <Badge variant="accent" className="mb-3">
          {mode.availability === "coming_soon" ? "Coming soon" : "Pro Intelligence"}
        </Badge>
        <h2 id="upgrade-modal-title" className="text-lg font-semibold text-white">
          {mode.label}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{mode.shortDescription}</p>

        <div className="mt-5 rounded-xl border border-white/[0.08] bg-zinc-950/60 p-4">
          <p className="text-xs font-medium text-zinc-300">
            Unlock with {upgradePlan.name}
            {upgradePlanId === "scholar" ? " or Pro" : ""}
          </p>
          <ul className="mt-3 space-y-2 text-xs text-zinc-500">
            {upgradePlan.featureBullets.slice(0, 4).map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-violet-400" aria-hidden>
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
          {upgradePlanId === "scholar" && (
            <p className="mt-3 border-t border-white/[0.06] pt-3 text-[11px] text-zinc-600">
              Pro adds all {proPlan.featureBullets.find((f) => f.includes("29")) ?? "29 modes"},
              export, mind map, and fair-use analysis.
            </p>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-zinc-600">
          Upgrade options are coming soon. Continue with one of the active free modes today.
        </p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button href="/pricing" size="md" className="flex-1">
            Upgrade options coming soon
          </Button>
          <Button href="/modes" variant="secondary" size="md" className="flex-1">
            Browse modes
          </Button>
        </div>

        <p className="mt-4 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-zinc-500 hover:text-ziolet-300"
          >
            Continue with an active mode
          </button>
          {" · "}
          <Link href="/upload" className="text-xs text-violet-400/80 hover:text-violet-300">
            Workspace
          </Link>
        </p>
      </div>
    </div>
  );
}
