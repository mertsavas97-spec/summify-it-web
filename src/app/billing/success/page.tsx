import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Billing activated",
  description: "Your Summify subscription is being activated.",
  path: "/billing/success",
  noIndex: true,
});

export default function BillingSuccessPage() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-3xl place-items-center px-4 py-16 sm:px-6">
      <section className="w-full rounded-2xl border border-emerald-400/20 bg-gradient-to-b from-emerald-950/20 via-zinc-950/70 to-zinc-950 p-6 text-center shadow-2xl shadow-emerald-500/10 sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10 text-emerald-200">
          <CheckCircle2 className="h-7 w-7" aria-hidden />
        </div>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300/80">
          Checkout complete
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          Billing confirmation received
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
          When a billing provider is enabled, this page will confirm checkout and return you to the workspace.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button href="/dashboard">Open dashboard</Button>
          <Button href="/account" variant="secondary">
            View billing
          </Button>
        </div>
        <Link href="/upload" className="mt-6 inline-flex text-xs text-zinc-500 hover:text-violet-300">
          Start a new analysis
        </Link>
      </section>
    </main>
  );
}
