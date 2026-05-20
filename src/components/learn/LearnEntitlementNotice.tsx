import { Button } from "@/components/ui/Button";

type LearnEntitlementNoticeProps = {
  planLabel: string;
};

export function LearnEntitlementNotice({ planLabel }: LearnEntitlementNoticeProps) {
  return (
    <section className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-6">
      <h2 className="text-lg font-semibold text-white">Learn practice is a paid feature</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
        Your current plan ({planLabel}) does not include spaced repetition practice sets. Upgrade to
        Scholar or Pro to turn saved analyses into private practice cards.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button href="/pricing" size="sm">
          View plans
        </Button>
        <Button href="/dashboard" size="sm" variant="secondary">
          Back to dashboard
        </Button>
      </div>
    </section>
  );
}
