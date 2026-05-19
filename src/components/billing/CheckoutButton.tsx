"use client";

import { useState } from "react";
import type { BillingInterval, PlanId } from "@/types/plan";
import { Button } from "@/components/ui/Button";

type CheckoutButtonProps = {
  plan: Exclude<PlanId, "beta">;
  interval: BillingInterval;
  label: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

export function CheckoutButton({
  plan,
  interval,
  label,
  variant = "primary",
  className,
}: CheckoutButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    if (plan === "free") {
      window.location.href = "/upload";
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        url?: string | null;
        error?: string;
      };

      if (!response.ok || !payload.success || !payload.url) {
        throw new Error(payload.error ?? "Checkout could not be started.");
      }

      window.location.href = payload.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout could not be started.");
      setPending(false);
    }
  }

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
