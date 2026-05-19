import Link from "next/link";
import { LockIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";

const proPreviewFeatures = [
  "Generous fair-use analyses",
  "All 29 intelligence modes",
  "Export & mind map (roadmap)",
  "Spaced repetition (roadmap)",
];

export function AdvancedAnalysisLock() {
  return (
    <section className="rounded-lg border border-white/[0.05] bg-zinc-950/40 px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Pro · Power features
            </span>
            <LockIcon className="h-3 w-3 text-zinc-600" />
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">
            Export, mind map, spaced repetition, and fair-use analysis — on the Pro roadmap.
          </p>
        </div>
        <Button href="/pricing" variant="ghost" size="sm" className="shrink-0 text-[11px]">
          View plans
        </Button>
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {proPreviewFeatures.map((feature) => (
          <li key={feature} className="text-[11px] text-zinc-600">
            · {feature}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-zinc-600">
        <Link href="/pricing" className="text-violet-400/80 hover:text-violet-300">
          Public beta pricing preview
        </Link>
        <span className="text-zinc-700"> · </span>
        Checkout coming soon
      </p>
    </section>
  );
}
