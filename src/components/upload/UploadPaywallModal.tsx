"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BillingStatusCopy } from "@/types/billing";
import type { BillingInterval } from "@/types/plan";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

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
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  const freeAuthHref = useMemo(() => {
    // Ensure this modal never routes users back to /upload.
    // We only open auth and then send them to pricing/account flows.
    return `/login?next=${encodeURIComponent("/pricing")}`;
  }, []);

  const plans = useMemo(
    () => [
      {
        id: "guest" as const,
        name: "Guest",
        badge: "Try once",
        price: "$0",
        period: "",
        bullets: ["1 analysis", "3 Learn Cards"],
        cta: { label: "Try once", kind: "close" as const },
      },
      {
        id: "free" as const,
        name: "Free",
        badge: "Best to start",
        price: "$0",
        period: "",
        bullets: ["5 analyses/day", "2 audio lessons/day", "1 podcast/day", "8 Learn Cards"],
        cta: {
          label: "Create free account",
          kind: "href" as const,
          href: freeAuthHref,
        },
      },
      {
        id: "scholar" as const,
        name: "Scholar",
        badge: "Students",
        price: interval === "yearly" ? "$39.99" : "$4.99",
        period: interval === "yearly" ? "/year" : "/month",
        bullets: ["10 analyses/day", "10 audio/day", "5 podcasts/day"],
        cta: { label: "Verify student", kind: "scholar" as const },
      },
      {
        id: "pro" as const,
        name: "Pro",
        badge: "Recommended",
        price: interval === "yearly" ? "$59.99" : "$7.99",
        period: interval === "yearly" ? "/year" : "/month",
        bullets: [
          "Full intelligence",
          "Audio Study Mode",
          "Unlimited audio",
          "Unlimited podcasts",
        ],
        cta: { label: "Start Pro", kind: "checkout" as const, plan: "pro" as const },
        highlighted: true,
      },
      {
        id: "team" as const,
        name: "Team",
        badge: "Teams",
        price: interval === "yearly" ? "$199.99" : "$24.99",
        period: interval === "yearly" ? "/year" : "/month",
        bullets: ["Multi-user", "Shared workspace", "Everything in Pro"],
        cta: { label: "Start Team", kind: "checkout" as const, plan: "team" as const },
      },
    ],
    [interval],
  );

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
        className="relative w-full max-w-6xl overflow-x-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-b from-zinc-900 to-zinc-950 p-5 shadow-2xl shadow-violet-500/10 outline-none sm:p-6"
        style={{ maxHeight: "85vh" }}
      >
        <header className="text-center">
          <h2 id="upload-paywall-title" className="text-xl font-semibold text-white sm:text-2xl">
            You’ve used your free daily analyses.
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Upgrade to continue analyzing documents, videos, articles, and long-form content.
          </p>
        </header>

        <div className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="text-xs text-zinc-400">
              Compact plan comparison. Details are on the pricing page.
            </div>

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

          <div className="grid items-stretch gap-3 md:grid-cols-2 xl:grid-cols-5">
            {plans.map((plan) => {
              const isPro = Boolean(plan.highlighted);
              const showScholarCheckout =
                plan.id === "scholar" && scholarCheckoutEligible && billing.enabled;

              return (
                <article
                  key={plan.id}
                  className={`relative flex min-h-[250px] flex-col rounded-xl border px-4 pb-4 pt-3 ${
                    isPro
                      ? "border-violet-500/45 bg-gradient-to-b from-violet-950/45 via-zinc-900/85 to-zinc-950 shadow-[0_0_40px_-10px_rgba(139,92,246,0.35)] ring-1 ring-violet-500/25"
                      : "border-white/[0.08] bg-zinc-900/45"
                  }`}
                >
                  {isPro ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-violet-400/30 bg-violet-600 px-3 py-0.5 text-[10px] font-semibold text-white shadow-lg shadow-violet-500/30">
                      Recommended
                    </div>
                  ) : null}

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">{plan.name}</h3>
                        {plan.badge ? <Badge variant={isPro ? "accent" : "muted"}>{plan.badge}</Badge> : null}
                      </div>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className={`font-semibold tracking-tight text-white ${isPro ? "text-2xl" : "text-xl"}`}>
                          {plan.price}
                        </span>
                        <span className="text-[11px] text-zinc-500">{plan.period}</span>
                      </div>
                    </div>
                  </div>

                  <ul className="mt-3 flex-1 space-y-1.5">
                    {plan.bullets.map((b) => (
                      <li key={b} className="flex gap-2 text-[11px] leading-snug text-zinc-300">
                        <span className={`mt-0.5 shrink-0 ${isPro ? "text-violet-400" : "text-zinc-500"}`} aria-hidden>
                          ✓
                        </span>
                        <span className="min-w-0 flex-1">{b}</span>
                      </li>
                    ))}
                    <li className="pt-1 text-[11px] text-zinc-500">+ more…</li>
                  </ul>

                  <div className="mt-3">
                    {plan.cta.kind === "close" ? (
                      <Button type="button" variant={isPro ? "primary" : "secondary"} className="w-full" size="md" onClick={onClose}>
                        {plan.cta.label}
                      </Button>
                    ) : plan.cta.kind === "href" ? (
                      <Button href={plan.cta.href} variant={isPro ? "primary" : "secondary"} className="w-full" size="md">
                        {plan.cta.label}
                      </Button>
                    ) : plan.cta.kind === "scholar" ? (
                      showScholarCheckout ? (
                        <CheckoutButton
                          plan="scholar"
                          interval={interval}
                          label={plan.cta.label}
                          variant="primary"
                          billing={billing}
                          allowScholarCheckout
                        />
                      ) : (
                        <Button
                          href={`/login?next=${encodeURIComponent("/pricing")}`}
                          variant={isPro ? "primary" : "secondary"}
                          className="w-full"
                          size="md"
                        >
                          {plan.cta.label}
                        </Button>
                      )
                    ) : (
                      <CheckoutButton
                        plan={plan.cta.plan}
                        interval={interval}
                        label={plan.cta.label}
                        variant={isPro ? "primary" : "secondary"}
                        billing={billing}
                      />
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="text-center">
            <a
              href="/pricing"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-zinc-400 underline decoration-zinc-500/50 underline-offset-4 hover:text-zinc-200"
            >
              View full plan comparison
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
