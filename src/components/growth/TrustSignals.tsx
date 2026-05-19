import { Shield, Sparkles, Lock } from "lucide-react";
import { TRUST_SIGNALS, PUBLIC_BETA_LABEL } from "@/lib/public-copy";
import { ProductDisclaimer } from "@/components/public/ProductDisclaimer";

type TrustSignalsProps = {
  variant?: "compact" | "full";
  className?: string;
};

export function TrustSignals({ variant = "compact", className = "" }: TrustSignalsProps) {
  if (variant === "compact") {
    return (
      <ul
        className={`flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-600 ${className}`}
        aria-label="Trust and privacy"
      >
        <li className="flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-violet-500/60" aria-hidden />
          {PUBLIC_BETA_LABEL}
        </li>
        <li className="flex items-center gap-1">
          <Lock className="h-3 w-3 text-violet-500/60" aria-hidden />
          {TRUST_SIGNALS.noTraining}
        </li>
      </ul>
    );
  }

  return (
    <aside
      className={`rounded-xl border border-white/[0.06] bg-zinc-950/40 p-4 ${className}`}
      aria-label="Trust and privacy"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {PUBLIC_BETA_LABEL}
      </p>
      <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-zinc-500">
        <li className="flex gap-2">
          <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500/70" aria-hidden />
          {TRUST_SIGNALS.uploadPrivacy}
        </li>
        <li className="flex gap-2">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500/70" aria-hidden />
          {TRUST_SIGNALS.secureProcessing}
        </li>
        <li className="flex gap-2">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500/70" aria-hidden />
          {TRUST_SIGNALS.aiDisclaimer}
        </li>
      </ul>
      <ProductDisclaimer className="mt-3" />
    </aside>
  );
}
