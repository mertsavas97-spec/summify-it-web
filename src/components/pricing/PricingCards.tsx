import { getPricingPlansForInterval } from "@/data/pricingPlans";
import { getPlanCheckoutLabel } from "@/lib/billing/provider";
import {
  getPricingPlanFootnote,
  isPlanCheckoutEnabled,
} from "@/lib/billing/plan-availability";
import type { BillingCheckoutPlanId, BillingStatusCopy } from "@/types/billing";
import type { BillingInterval } from "@/types/plan";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const SCHOLAR_EDU_UNAVAILABLE =
  "Only available for .edu email addresses.";
const SCHOLAR_EDU_FOOTNOTE =
  "Available for verified students — sign up with a .edu email address to unlock.";
const SCHOLAR_VERIFICATION_TITLE = "Student verification required";

type PricingCardsProps = {
  interval: BillingInterval;
  billing: BillingStatusCopy;
  scholarCheckoutEligible: boolean;
};

function isHighlightedPricingFeature(feature: string) {
  const normalized = feature.toLowerCase();

  return [
    "analyses per day",
    "audio lessons per day",
    "podcasts per day",
    "podcast per day",
    "learn cards per run",
    "audio study mode",
    "teacher-style audio lessons",
    "unlimited audio lessons",
    "unlimited podcasts",
  ].some((keyword) => normalized.includes(keyword));
}

function getHighlightedFeatureParts(feature: string) {
  const normalized = feature.toLowerCase();

  if (normalized.includes("audio study mode")) {
    return { highlighted: "Audio Study Mode", trailing: feature.replace(/audio study mode/i, "") };
  }

  if (normalized.includes("teacher-style audio lessons")) {
    return { highlighted: "Teacher-style audio lessons", trailing: "" };
  }

  if (normalized.includes("unlimited audio lessons")) {
    return { highlighted: "Unlimited audio lessons", trailing: "" };
  }

  if (normalized.includes("unlimited podcasts")) {
    return { highlighted: "Unlimited podcasts", trailing: "" };
  }

  const match = feature.match(/^(\d+|Unlimited)\s+(.*)$/i);
  if (match && isHighlightedPricingFeature(feature)) {
    return { highlighted: `${match[1]} ${match[2]}`, trailing: "" };
  }

  return { highlighted: feature, trailing: "" };
}

function renderFeatureWithHighlight(feature: string) {
  const normalized = feature.toLowerCase();
  const { highlighted, trailing } = getHighlightedFeatureParts(feature);
  const isUnlimited = normalized.includes("unlimited");

  return (
    <>
      <span
        className={`inline-flex max-w-full items-center rounded-md border px-2 py-0.5 text-sm leading-tight shadow-sm whitespace-normal break-words ${
          isUnlimited
            ? "border-violet-300/30 bg-violet-500/15 text-violet-100"
            : "border-violet-400/25 bg-violet-500/10 text-violet-100"
        } font-semibold`}
      >
        {highlighted}
      </span>
      {trailing ? <span className="text-zinc-300">{trailing}</span> : null}
    </>
  );
}

function PlanFootnote({ text }: { text: string }) {
  return (
    <p className="mt-2 text-center text-[11px] leading-relaxed text-zinc-500">{text}</p>
  );
}

function ScholarVerificationNote() {
  return (
    <div className="mt-4 rounded-xl border border-violet-400/20 bg-violet-500/[0.08] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <p className="text-xs font-semibold leading-relaxed text-violet-100">
        {SCHOLAR_VERIFICATION_TITLE}
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-zinc-300">
        {SCHOLAR_EDU_FOOTNOTE}
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
        {SCHOLAR_EDU_UNAVAILABLE}
      </p>
    </div>
  );
}

export function PricingCards({
  interval,
  billing,
  scholarCheckoutEligible,
}: PricingCardsProps) {
  const plans = getPricingPlansForInterval(interval);

  return (
    <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4 xl:gap-5">
      {plans.map((plan) => {
        const isPro = plan.highlighted;
        const isScholar = plan.id === "scholar";
        const footnote = isScholar ? null : getPricingPlanFootnote(plan.id);
        const checkoutEnabled =
          (plan.id === "pro" || plan.id === "team") && isPlanCheckoutEnabled(plan.id);
        const showScholarCheckout =
          isScholar && scholarCheckoutEligible && billing.enabled;

        return (
          <article
            key={`${plan.id}-${interval}`}
            className={`relative flex flex-col rounded-xl border p-5 ${
              isPro
                ? "z-10 border-violet-500/40 bg-gradient-to-b from-violet-950/50 via-zinc-900/90 to-zinc-950 shadow-[0_0_40px_-8px_rgba(139,92,246,0.35)] ring-1 ring-violet-500/25 xl:scale-[1.02]"
                : "border-white/[0.08] bg-zinc-900/50"
            }`}
          >
            {isPro && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-violet-400/30 bg-violet-600 px-3 py-0.5 text-[10px] font-semibold text-white shadow-lg shadow-violet-500/30">
                Recommended
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {plan.badge && (
                <Badge variant={isScholar ? "accent" : plan.comingSoon ? "muted" : "accent"}>
                  {plan.badge}
                </Badge>
              )}
              {plan.savings && (
                <span className="text-[11px] font-medium text-emerald-400">{plan.savings}</span>
              )}
            </div>

            <h3 className="mt-3 text-base font-semibold text-white">{plan.name}</h3>

            <p className="mt-1 flex items-baseline gap-1">
              <span
                className={`font-semibold tracking-tight text-white ${
                  isPro ? "text-3xl" : "text-2xl"
                }`}
              >
                {plan.displayPrice}
              </span>
              <span className="text-sm text-zinc-500">{plan.displayPeriod}</span>
            </p>

            <p className="mt-2 text-xs leading-relaxed text-zinc-500">{plan.tagline}</p>

            <ul className="mt-5 flex-1 space-y-2.5">
              {plan.featureBullets.map((feature) => (
                <li key={feature} className="flex gap-2 text-xs text-zinc-300">
                  <span
                    className={`mt-0.5 shrink-0 ${isPro ? "text-violet-400" : "text-zinc-500"}`}
                    aria-hidden
                  >
                    ✓
                  </span>
                  <span className="min-w-0 flex-1 leading-relaxed text-zinc-300">
                    {isHighlightedPricingFeature(feature) ? (
                      renderFeatureWithHighlight(feature)
                    ) : (
                      <span>{feature}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              {plan.id === "free" ? (
                <Button
                  href={plan.ctaHref ?? "/upload"}
                  variant={isPro ? "primary" : "secondary"}
                  className="w-full"
                  size="md"
                >
                  {plan.cta}
                </Button>
              ) : isScholar ? (
                showScholarCheckout ? (
                  <CheckoutButton
                    plan="scholar"
                    interval={interval}
                    label="Start Scholar"
                    variant="primary"
                    billing={billing}
                    allowScholarCheckout
                  />
                ) : (
                  <ScholarVerificationNote />
                )
              ) : checkoutEnabled ? (
                <CheckoutButton
                  plan={plan.id as "pro" | "team"}
                  interval={interval}
                  label={getPlanCheckoutLabel(plan.id as BillingCheckoutPlanId, billing)}
                  variant={isPro ? "primary" : "secondary"}
                  billing={billing}
                />
              ) : (
                <Button href="/upload" variant="secondary" className="w-full" size="md">
                  Open workspace
                </Button>
              )}
              {footnote ? <PlanFootnote text={footnote} /> : null}
              {isScholar && showScholarCheckout ? <ScholarVerificationNote /> : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
