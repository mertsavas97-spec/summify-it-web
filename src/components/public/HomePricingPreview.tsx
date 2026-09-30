"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";

type PricingPreviewPlan = {
  id: "free" | "pro" | "team";
  name: string;
  price: string;
  period?: string;
  tagline: string;
  bullets: string[];
  cta: { label: string; href: string; variant?: "primary" | "secondary" };
  highlighted?: boolean;
};

const PLANS: PricingPreviewPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/month",
    tagline: "Daily summaries and study cards",
    bullets: [
      "5 analyses per day",
      "12 Learn cards and a quiz",
      "4 core lenses, including Study",
      "Up to 10 saved analyses",
    ],
    cta: {
      label: "Create free account",
      href: `/login?next=${encodeURIComponent("/upload")}`,
      variant: "secondary",
    },
  },
  {
    id: "pro",
    name: "Pro",
    price: "$7.99",
    period: "/month",
    tagline: "The full study workflow",
    bullets: [
      "Unlimited analyses (fair use)",
      "Unlimited audio lessons and podcasts",
      "All intelligence lenses",
      "Mind maps and spaced repetition",
    ],
    cta: { label: "Start Pro", href: "/pricing?plan=pro", variant: "primary" },
    highlighted: true,
  },
];

const TEAM_PLAN: PricingPreviewPlan = {
  id: "team",
  name: "Team",
  price: "$24.99",
  period: "/month",
  tagline: "Pro for a group",
  bullets: ["Everything in Pro", "Up to 5 seats", "Shared library"],
  cta: { label: "Start Team", href: "/pricing?plan=team", variant: "secondary" },
};

const COMPARISON_ROWS = [
  { feature: "Analyses per day", free: "5", pro: "Unlimited*", team: "Unlimited*" },
  { feature: "Learn cards per analysis", free: "12", pro: "Unlimited", team: "Unlimited" },
  { feature: "Quiz questions", free: "✓", pro: "Unlimited", team: "Unlimited" },
  { feature: "Intelligence modes", free: "4 (incl. Study)", pro: "All 6", team: "All 6" },
  { feature: "Mind maps", free: "✗", pro: "✓", team: "✓" },
  { feature: "Audio lessons", free: "✗", pro: "Unlimited", team: "Unlimited" },
  { feature: "Podcasts", free: "✗", pro: "Unlimited", team: "Unlimited" },
  { feature: "Spaced repetition", free: "✗", pro: "✓", team: "✓" },
  { feature: "Saved analyses", free: "Up to 10", pro: "Unlimited", team: "Unlimited" },
  { feature: "Team seats", free: "1", pro: "1", team: "Up to 5" },
  { feature: "Shared library", free: "✗", pro: "✗", team: "✓" },
  { feature: "Invoicing", free: "✗", pro: "✗", team: "✓" },
] as const;

function FeatureCell({ value }: { value: string }) {
  if (value === "✓") return <CheckCircle className="h-5 w-5 text-emerald-400 mx-auto" aria-label="Included" />;
  if (value === "✗") return <XCircle className="h-5 w-5 text-zinc-500 mx-auto" aria-label="Not included" />;
  if (value.startsWith("Unlimited")) return <span className="text-emerald-600 dark:text-emerald-400 font-medium">{value}</span>;
  return <span className="text-slate-700 dark:text-zinc-300">{value}</span>;
}

function CardCta({ href, label, variant }: { href: string; label: string; variant?: "primary" | "secondary" }) {
  const base =
    "inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors";

  if (variant === "primary") {
    return (
      <Link
        href={href}
        className={`${base} bg-gradient-to-r from-violet-500 to-cyan-400 text-white shadow-[0_16px_60px_-38px_rgba(124,58,237,0.9)] hover:from-violet-400 hover:to-cyan-300`}
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`${base} border border-slate-300/80 bg-white text-slate-800 hover:border-violet-400/50 hover:bg-slate-50 dark:border-white/[0.10] dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:border-violet-500/25 dark:hover:bg-zinc-950/55`}
    >
      {label}
    </Link>
  );
}

export function HomePricingPreview() {
  return (
    <section className="border-b border-slate-200/70 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 dark:border-white/[0.04]">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-400/80">
              Pricing
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Start free — Pro is the full workflow
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-zinc-500">
              Free covers daily summaries and study cards. Pro adds unlimited audio lessons, podcasts,
              and every lens. Team is Pro for up to 5 people.
            </p>
          </div>
          <Link
            href="/pricing"
            className="text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-900 hover:decoration-violet-400/60 dark:text-zinc-300 dark:decoration-white/10 dark:hover:text-white dark:hover:decoration-violet-400/40"
          >
            View full pricing
          </Link>
        </div>

        {/* Comparison Table */}
        <div className="mt-10 overflow-x-auto rounded-2xl border border-slate-200/50 bg-white/50 dark:border-white/[0.06] dark:bg-zinc-950/50">
          <table className="w-full min-w-[640px]" role="table">
            <thead>
              <tr className="border-b border-slate-200/50 bg-slate-50/50 dark:border-white/[0.06] dark:bg-zinc-900/50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Feature</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900 dark:text-white">
                  Free
                  <span className="ml-1 text-xs font-normal text-slate-500">$0/mo</span>
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-white">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-2 py-0.5 text-[10px] font-semibold">
                    Pro
                  </span>
                  <span className="ml-1 text-xs font-normal text-violet-300">$7.99/mo</span>
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900 dark:text-white">
                  Team
                  <span className="ml-1 text-xs font-normal text-slate-500">$24.99/mo</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr key={i} className="border-b border-slate-200/30 dark:border-white/[0.04] hover:bg-slate-50/30 dark:hover:bg-zinc-900/30">
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-zinc-300">{row.feature}</td>
                  <td className="px-4 py-3 text-center"><FeatureCell value={row.free} /></td>
                  <td className="px-4 py-3 text-center"><FeatureCell value={row.pro} /></td>
                  <td className="px-4 py-3 text-center"><FeatureCell value={row.team} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-center text-xs text-slate-500 dark:text-zinc-500">
          * Fair use policy applies. Unlimited means no daily caps within reasonable limits.
        </p>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {[...PLANS, TEAM_PLAN].map((plan) => (
            <article
              key={plan.id}
              className={
                plan.highlighted
                  ? "relative order-first flex h-full flex-col rounded-2xl border border-violet-400/45 bg-gradient-to-b from-violet-950/55 via-zinc-950/55 to-zinc-950/70 p-6 shadow-[0_30px_110px_-60px_rgba(124,58,237,0.95)] ring-1 ring-violet-400/30 lg:order-none"
                  : "relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/[0.06] dark:bg-zinc-950/45"
              }
            >
              {plan.highlighted ? (
                <div className="absolute -top-3 left-6 rounded-full border border-violet-400/30 bg-violet-600 px-3 py-0.5 text-[10px] font-semibold text-white shadow-lg shadow-violet-500/30">
                  Most popular
                </div>
              ) : null}

              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">{plan.name}</h3>
                <p className="text-right">
                  <span className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{plan.price}</span>
                  {plan.period ? <span className="ml-1 text-sm text-slate-500 dark:text-zinc-500">{plan.period}</span> : null}
                </p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-zinc-500">{plan.tagline}</p>

              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.bullets.map((b) => (
                  <li key={b} className="flex gap-2 text-xs text-slate-700 dark:text-zinc-300">
                    <span className={plan.highlighted ? "text-violet-500 dark:text-violet-400" : "text-slate-400 dark:text-zinc-500"} aria-hidden>
                      ✓
                    </span>
                    <span className="leading-relaxed">{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <CardCta href={plan.cta.href} label={plan.cta.label} variant={plan.cta.variant} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
