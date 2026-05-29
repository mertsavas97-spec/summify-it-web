import Link from "next/link";

type PricingPreviewPlan = {
  id: "guest" | "free" | "pro";
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
    id: "guest",
    name: "Guest",
    price: "$0",
    tagline: "Try Summify once",
    bullets: ["1 analysis", "3 Learn Cards"],
    cta: { label: "Try once", href: "/upload", variant: "secondary" },
  },
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/month",
    tagline: "Best for getting started",
    bullets: ["5 analyses/day", "8 Learn Cards", "Audio lessons included"],
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
    tagline: "For power users",
    bullets: [
      "More daily analysis capacity",
      "Advanced learning workflows",
      "Audio + Podcast modes",
    ],
    cta: { label: "Start Pro", href: "/pricing?plan=pro", variant: "primary" },
    highlighted: true,
  },
];

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
      className={`${base} border border-white/[0.10] bg-zinc-950/40 text-zinc-100 hover:border-violet-500/25 hover:bg-zinc-950/55`}
    >
      {label}
    </Link>
  );
}

export function HomePricingPreview() {
  return (
    <section className="border-b border-white/[0.04] px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-400/80">
              Pricing
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Start free — upgrade when you need more
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-500">
              Choose the entry point that fits you today. Guest is a one-time try, Free is daily access,
              and Pro unlocks the full learning workflow.
            </p>
          </div>
          <Link
            href="/pricing"
            className="text-sm font-medium text-zinc-300 underline decoration-white/10 underline-offset-4 hover:text-white hover:decoration-violet-400/40"
          >
            View full pricing
          </Link>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={
                plan.highlighted
                  ? "relative flex h-full flex-col rounded-2xl border border-violet-500/35 bg-gradient-to-b from-violet-950/38 via-zinc-950/55 to-zinc-950/65 p-6 shadow-[0_30px_110px_-80px_rgba(124,58,237,0.9)]"
                  : "relative flex h-full flex-col rounded-2xl border border-white/[0.06] bg-zinc-950/45 p-6"
              }
            >
              {plan.highlighted ? (
                <div className="absolute -top-3 left-6 rounded-full border border-violet-400/30 bg-violet-600 px-3 py-0.5 text-[10px] font-semibold text-white shadow-lg shadow-violet-500/30">
                  Recommended
                </div>
              ) : null}

              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-base font-semibold text-white">{plan.name}</h3>
                <p className="text-right">
                  <span className="text-3xl font-semibold tracking-tight text-white">{plan.price}</span>
                  {plan.period ? <span className="ml-1 text-sm text-zinc-500">{plan.period}</span> : null}
                </p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">{plan.tagline}</p>

              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.bullets.map((b) => (
                  <li key={b} className="flex gap-2 text-xs text-zinc-300">
                    <span className={plan.highlighted ? "text-violet-400" : "text-zinc-500"} aria-hidden>
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
