"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BillingStatusCopy } from "@/types/billing";
import type { BillingInterval, PlanId } from "@/types/plan";
import {
  consumeCheckoutIntent,
  saveCheckoutIntent,
  type CheckoutIntent,
} from "@/lib/billing/checkout-intent";
import { isPlanCheckoutEnabled } from "@/lib/billing/plan-availability";
import { readCheckoutApiError } from "@/lib/billing/polar/api-error";
import { trackProductEventClient } from "@/lib/analytics/trackProductEventClient";
import { Button } from "@/components/ui/Button";

type CheckoutButtonProps = {
  plan: Extract<PlanId, "pro" | "team" | "scholar">;
  interval: BillingInterval;
  label: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  billing: BillingStatusCopy;
  /** Pricing page: Scholar checkout for verified .edu accounts only. */
  allowScholarCheckout?: boolean;
};

function isCheckoutPlanAllowed(
  planId: CheckoutIntent["planId"],
  allowScholarCheckout: boolean,
): boolean {
  if (planId === "scholar") return allowScholarCheckout;
  return isPlanCheckoutEnabled(planId);
}

function devLog(message: string, data?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    console.info(`[summify.checkout] ${message}`, data ?? "");
  }
}

function devWarn(message: string, data?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[summify.checkout] ${message}`, data ?? "");
  }
}

/** Polar: always use checkout API. None: workspace only. */
function shouldCallCheckoutApi(billing: BillingStatusCopy): boolean {
  if (billing.provider === "polar") return true;
  return billing.enabled && billing.provider !== "none";
}

export function CheckoutButton({
  plan,
  interval,
  label,
  variant = "primary",
  className,
  billing,
  allowScholarCheckout = false,
}: CheckoutButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resumedRef = useRef(false);

  const runCheckout = useCallback(
    async (target: CheckoutIntent) => {
      if (!isCheckoutPlanAllowed(target.planId, allowScholarCheckout)) {
        devWarn("checkout blocked — plan not available", { planId: target.planId });
        return;
      }

      if (!shouldCallCheckoutApi(billing)) {
        devWarn("checkout blocked — billing not enabled", {
          provider: billing.provider,
          enabled: billing.enabled,
        });
        window.location.href = "/upload";
        return;
      }

      setPending(true);
      setError(null);

      const payload = { planId: target.planId, interval: target.interval };
      devLog("request", {
        provider: billing.provider,
        enabled: billing.enabled,
        payload,
      });

      try {
        const response = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(payload),
        });

        const body: unknown = await response.json();
        const parsed = body as {
          success?: boolean;
          url?: string | null;
          error?: unknown;
          details?: unknown;
          provider?: string;
        };

        devLog("response", {
          status: response.status,
          success: parsed.success,
          provider: parsed.provider,
          hasUrl: Boolean(parsed.url),
          error: parsed.error,
          details: parsed.details,
        });

        if (response.status === 401) {
          saveCheckoutIntent(target);
          window.location.href = `/login?next=${encodeURIComponent("/pricing")}`;
          return;
        }

        if (!response.ok || !parsed.success || !parsed.url) {
          throw new Error(
            readCheckoutApiError(body, "Checkout could not be started."),
          );
        }

        window.location.href = parsed.url;
      } catch (err) {
        devWarn("failed", {
          message: err instanceof Error ? err.message : String(err),
        });
        setError(err instanceof Error ? err.message : "Checkout could not be started.");
        setPending(false);
      }
    },
    [billing, allowScholarCheckout],
  );

  const startCheckout = useCallback(() => {
    if (!isCheckoutPlanAllowed(plan as CheckoutIntent["planId"], allowScholarCheckout)) return;

    trackProductEventClient({
      eventType: "upgrade_clicked",
      metadata: { surface: "pricing_checkout", target_plan: plan, interval },
    });

    const intent: CheckoutIntent = {
      planId: plan as CheckoutIntent["planId"],
      interval,
    };
    if (shouldCallCheckoutApi(billing)) {
      saveCheckoutIntent(intent);
    }
    void runCheckout(intent);
  }, [plan, interval, billing, allowScholarCheckout, runCheckout]);

  useEffect(() => {
    devLog("billing status", {
      provider: billing.provider,
      enabled: billing.enabled,
      shouldCallCheckoutApi: shouldCallCheckoutApi(billing),
    });
  }, [billing]);

  useEffect(() => {
    if (resumedRef.current || !shouldCallCheckoutApi(billing)) return;

    const intent = consumeCheckoutIntent();
    if (!intent || !isCheckoutPlanAllowed(intent.planId, allowScholarCheckout)) return;

    resumedRef.current = true;
    const timer = window.setTimeout(() => {
      devLog("resuming checkout after login", intent);
      void runCheckout(intent);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [billing, allowScholarCheckout, runCheckout]);

  return (
    <div className={className}>
      <Button
        type="button"
        variant={variant}
        className="w-full"
        size="md"
        disabled={pending}
        onClick={startCheckout}
      >
        {pending ? "Opening checkout..." : label}
      </Button>
      {error ? <p className="mt-2 text-center text-[11px] text-rose-300">{error}</p> : null}
    </div>
  );
}
