import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Checkout canceled",
  description: "Return to Summify pricing or continue using your current workspace.",
  path: "/billing/cancel",
  noIndex: true,
});

export default function BillingCancelPage() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-3xl place-items-center px-4 py-16 sm:px-6">
      <section className="w-full rounded-2xl border border-white/[0.08] bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-6 text-center sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-violet-400/20 bg-violet-400/10 text-violet-200">
          <ArrowLeft className="h-7 w-7" aria-hidden />
        </div>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300/80">
          Checkout canceled
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          No changes were made
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
          Your current Summify plan is still active. You can compare plans again or keep working in the workspace.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button href="/pricing">Compare plans</Button>
          <Button href="/dashboard" variant="secondary">
            Back to dashboard
          </Button>
        </div>
        <Link href="/account" className="mt-6 inline-flex text-xs text-zinc-500 hover:text-violet-300">
          Account settings
        </Link>
      </section>
    </main>
  );
}
