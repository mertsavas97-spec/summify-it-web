"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { trackEvent } from "@/lib/analytics/events";
import { trackProductEventClient } from "@/lib/analytics/trackProductEventClient";
import { getPlanDefinition } from "@/data/pricingPlans";
import { getModeAccessState } from "@/lib/mode-access";
import { getUpgradeModalContent } from "@/lib/plan-upgrade-ui";
import type { IntelligenceModeDefinition } from "@/types/modes";
import type { PlanId } from "@/types/plan";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type PlanUpgradeModalProps = {
  mode: IntelligenceModeDefinition | null;
  entitlementPlanId: PlanId;
  isAuthenticated: boolean;
  onClose: () => void;
};

export function PlanUpgradeModal({
  mode,
  entitlementPlanId,
  isAuthenticated,
  onClose,
}: PlanUpgradeModalProps) {
  useEffect(() => {
    if (!mode) return;
    const requiredPlanId =
      getModeAccessState(mode, entitlementPlanId).upgradePlanId ?? "pro";
    trackEvent("upgrade_modal_opened", {
      mode_id: mode.id,
      mode_label: mode.label,
    });
    trackProductEventClient({
      eventType: "upgrade_clicked",
      intelligenceMode: mode.id,
      metadata: {
        surface: "upgrade_modal",
        target_plan: requiredPlanId,
      },
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, entitlementPlanId, onClose]);

  const modalState = useMemo(() => {
    if (!mode) return null;

    const access = getModeAccessState(mode, entitlementPlanId);
    const requiredPlanId = access.upgradePlanId ?? "pro";
    const content = getUpgradeModalContent({
      requiredPlanId,
      isAuthenticated,
      isComingSoon: access.lockReason === "coming_soon",
      modeLabel: mode.label,
    });
    const upgradePlan = getPlanDefinition(requiredPlanId);

    return { access, content, upgradePlan, requiredPlanId };
  }, [mode, entitlementPlanId, isAuthenticated]);

  if (!mode || !modalState) return null;

  const { content, upgradePlan, access } = modalState;
  const proPlan = getPlanDefinition("pro");
  const showPlanBullets = access.lockReason !== "coming_soon";

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
          {content.badge}
        </Badge>
        <h2 id="upgrade-modal-title" className="text-lg font-semibold text-white">
          {content.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{mode.shortDescription}</p>
        <p className="mt-3 text-sm text-zinc-300">{content.description}</p>

        {showPlanBullets && (
          <div className="mt-5 rounded-xl border border-white/[0.08] bg-zinc-950/60 p-4">
            <p className="text-xs font-medium text-zinc-300">
              Unlock with {content.planName}
              {upgradePlan.id === "scholar" ? " or Pro" : ""}
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
            {upgradePlan.id === "scholar" && (
              <p className="mt-3 border-t border-white/[0.06] pt-3 text-[11px] text-zinc-600">
                Pro adds all{" "}
                {proPlan.featureBullets.find((f) => f.includes("29")) ?? "29 intelligence modes"},
                export, mind map, and fair-use analysis.
              </p>
            )}
          </div>
        )}

        {content.footnote && (
          <p className="mt-4 text-center text-[11px] leading-relaxed text-zinc-500">
            {content.footnote}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button href={content.primaryHref} size="md" className="flex-1">
            {content.primaryCta}
          </Button>
          <Button href={content.secondaryHref} variant="secondary" size="md" className="flex-1">
            {content.secondaryCta}
          </Button>
        </div>

        <p className="mt-4 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-zinc-500 hover:text-violet-300"
          >
            Continue with an available mode
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
