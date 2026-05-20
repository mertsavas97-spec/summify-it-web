"use client";

import { useState } from "react";
import type { BillingStatusCopy } from "@/types/billing";
import type { BillingInterval } from "@/types/plan";
import { PricingCards } from "./PricingCards";

type PricingSectionProps = {
  billing: BillingStatusCopy;
  scholarCheckoutEligible: boolean;
};

export function PricingSection({ billing, scholarCheckoutEligible }: PricingSectionProps) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  return (
    <div>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <p className="text-xs text-zinc-500">Billing</p>
        <div
          className="inline-flex rounded-lg border border-white/[0.08] bg-zinc-950/80 p-0.5"
          role="group"
          aria-label="Billing interval"
        >
          {(["monthly", "yearly"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setInterval(key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                interval === key
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {key === "monthly" ? "Monthly" : "Yearly"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <PricingCards
          interval={interval}
          billing={billing}
          scholarCheckoutEligible={scholarCheckoutEligible}
        />
      </div>
    </div>
  );
}
