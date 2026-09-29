"use client";

import type { ComponentType } from "react";
import { Sparkles, Lock, FileText, Shield, CheckCircle, Globe, Zap } from "lucide-react";

type TrustItem = {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

const ITEMS: TrustItem[] = [
  { icon: Sparkles, value: "Free to start", label: "No account required to try" },
  { icon: Lock, value: "Private by design", label: "No AI training on your uploads" },
  { icon: FileText, value: "PDF · PPTX · YouTube · Web", label: "One workspace for every source" },
  { icon: Globe, value: "100+ languages", label: "Multilingual sources & output" },
  { icon: Zap, value: "Sub-minute results", label: "Structured summary in seconds" },
  { icon: Shield, value: "Encrypted transit", label: "TLS 1.3 + encrypted storage" },
  { icon: CheckCircle, value: "No data retention", label: "Files deleted after processing" },
  { icon: Zap, value: "Source-grounded AI", label: "Every answer traces to your doc" },
] as const;

export function HomeTrustBar() {
  return (
    <section className="border-b border-white/[0.04] px-4 py-10 sm:px-6 lg:px-8" aria-labelledby="trust-heading">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h2 id="trust-heading" className="sr-only">
            Why trust Summify
          </h2>
          <p className="text-sm font-medium text-violet-400 uppercase tracking-[0.1em]">
            Built for trust
          </p>
          <p className="mt-2 text-lg text-zinc-300 max-w-2xl mx-auto">
            Every feature designed around privacy, accuracy, and source fidelity.
          </p>
        </div>

        {/* Trust Badges Grid */}
        <ul
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto"
          aria-label="Product trust highlights"
        >
          {ITEMS.map((item) => (
            <li
              key={`${item.value}-${item.label}`}
              className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-zinc-950/45 px-4 py-3.5 shadow-[0_18px_60px_-44px_rgba(124,58,237,0.30)] hover:border-violet-500/20 transition-colors"
            >
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-950/35 text-violet-200">
                <span
                  className="pointer-events-none absolute -inset-2 rounded-full bg-violet-500/15 blur-md"
                  aria-hidden
                />
                <item.icon className="relative z-[1] h-4.5 w-4.5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug text-zinc-100">
                  {item.value}
                </p>
                <p className="mt-0.5 text-[12px] leading-snug text-zinc-500">{item.label}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}