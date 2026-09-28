"use client";

import { usePathname } from "next/navigation";
import { getPlanDefinition } from "@/data/pricingPlans";

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Single-line Pro promo under the site header. Homepage only. */
export function HomeProOfferBar() {
  const pathname = usePathname();
  if (pathname !== "/") return null;

  const pro = getPlanDefinition("pro");
  const monthly = pro.billing?.monthly?.amountCents;
  const yearly = pro.billing?.yearly?.amountCents;
  if (monthly == null || yearly == null) return null;

  return (
    <div
      className="relative border-b border-cyan-300/30 bg-gradient-to-r from-violet-600/40 via-fuchsia-600/25 to-cyan-500/35"
      role="status"
    >
      <p className="mx-auto flex w-full min-w-0 items-center justify-center gap-x-0.5 overflow-x-auto whitespace-nowrap px-1.5 py-2 text-[11px] leading-none text-zinc-100 [scrollbar-width:none] sm:gap-x-3 sm:px-4 sm:text-[13px] [&::-webkit-scrollbar]:hidden">
        <span className="font-medium uppercase tracking-normal text-[10px] text-cyan-100/80 sm:text-[11px] sm:tracking-wide">
          <span className="sm:hidden">Code</span>
          <span className="hidden sm:inline">Promo code</span>
        </span>
        <span className="rounded-md border border-dashed border-cyan-100/70 bg-cyan-200/15 px-1 py-0.5 font-mono font-semibold tracking-normal text-cyan-50 sm:px-1.5 sm:tracking-wide">
          SUM50
        </span>
        <span>
          <span className="font-semibold text-white">50%</span>{" "}
          <span className="font-semibold text-cyan-100">discount</span>
        </span>
        <span className="text-white/35" aria-hidden>
          ·
        </span>
        <span>
          <span className="font-semibold text-white">Pro</span>{" "}
          <span className="sm:hidden">
            <span className="text-zinc-300 line-through">{formatUsd(monthly)}</span>{" "}
            <span className="font-semibold text-white">{formatUsd(Math.round(monthly / 2))}</span>
            /mo
          </span>
          <span className="hidden sm:inline">
            monthly{" "}
            <span className="text-zinc-300 line-through">{formatUsd(monthly)}</span>{" "}
            <span className="font-semibold text-white">{formatUsd(Math.round(monthly / 2))}</span>
          </span>
        </span>
        <span className="text-white/35" aria-hidden>
          ·
        </span>
        <span>
          <span className="font-semibold text-white">Pro</span>{" "}
          <span className="sm:hidden">
            <span className="text-zinc-300 line-through">{formatUsd(yearly)}</span>{" "}
            <span className="font-semibold text-white">{formatUsd(Math.round(yearly / 2))}</span>
            /yr
          </span>
          <span className="hidden sm:inline">
            yearly{" "}
            <span className="text-zinc-300 line-through">{formatUsd(yearly)}</span>{" "}
            <span className="font-semibold text-white">{formatUsd(Math.round(yearly / 2))}</span>
          </span>
        </span>
      </p>
    </div>
  );
}
