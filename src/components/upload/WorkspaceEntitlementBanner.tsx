"use client";

import { LockIcon } from "@/components/icons";
import { PortalButton } from "@/components/billing/PortalButton";
import { isBillingEnabled } from "@/lib/billing/provider";
import { getWorkspaceEntitlementBannerContent } from "@/lib/plan-upgrade-ui";
import type { WorkspaceEntitlement } from "@/hooks/useWorkspaceEntitlement";
import { Button } from "@/components/ui/Button";

type WorkspaceEntitlementBannerProps = {
  entitlement: WorkspaceEntitlement;
};

export function WorkspaceEntitlementBanner({ entitlement }: WorkspaceEntitlementBannerProps) {
  const billingEnabled = isBillingEnabled();
  const content = getWorkspaceEntitlementBannerContent({
    entitlementPlanId: entitlement.entitlementPlanId,
    isAuthenticated: entitlement.isAuthenticated,
    isPaidActive: entitlement.isPaidActive,
    billingEnabled,
  });

  return (
    <section className="rounded-lg border border-white/[0.05] bg-zinc-950/40 px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              {content.eyebrow} · Power features
            </span>
            {content.showLock && <LockIcon className="h-3 w-3 text-zinc-600" />}
          </p>
          <p className="mt-0.5 text-xs font-medium text-zinc-300">{content.title}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">{content.description}</p>
        </div>
        {content.primaryAction === "portal" ? (
          <PortalButton className="shrink-0 text-[11px]" />
        ) : (
          <Button
            href={content.primaryHref ?? "/pricing"}
            variant="ghost"
            size="sm"
            className="shrink-0 text-[11px]"
          >
            {content.primaryCta}
          </Button>
        )}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {content.features.map((feature) => (
          <li key={feature} className="text-[11px] text-zinc-600">
            · {feature}
          </li>
        ))}
      </ul>
    </section>
  );
}
