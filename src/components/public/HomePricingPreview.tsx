import Link from "next/link";

type PricingPreviewPlan = {
  id: "guest" | "free" | "pro" | "team";
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
    tagline: "Try the learning workflow once",
    bullets: ["1 source to try", "Audio lesson preview", "3 study cards", "No account required"],
    cta: { label: "Try once", href: "/upload", variant: "secondary" },
  },
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/month",
    tagline: "Daily study, free forever",
    bullets: ["1 source per day", "Summary + audio lesson", "Study cards + quick quiz", "Cloud history"],
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
    tagline: "Audio lessons, study cards, quizzes, and memory reviews.",
    bullets: [
      "Full Audio Lessons",
      "Podcast mode enabled",
      "Unlimited history",
      "All 29+ study modes",
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
  tagline: "Shared library + team memory",
  bullets: ["Shared Library", "Team Memory", "Admin Controls"],
  cta: { label: "Start Team", href: "/pricing?plan=team", variant: "secondary" },
};

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
              Start free — upgrade as your learning workflow grows
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-zinc-500">
              Choose the entry point that fits you today. Guest is a one-time try, Free is daily access,
              and Pro unlocks the full learning workflow.
            </p>
          </div>
          <Link
            href="/pricing"
            className="text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-900 hover:decoration-violet-400/60 dark:text-zinc-300 dark:decoration-white/10 dark:hover:text-white dark:hover:decoration-violet-400/40"
          >
            View full pricing
          </Link>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-4">
          {[...PLANS, TEAM_PLAN].map((plan) => (
            <article
              key={plan.id}
              className={
                plan.highlighted
                  ? "relative flex h-full flex-col rounded-2xl border border-violet-500/35 bg-gradient-to-b from-violet-950/38 via-zinc-950/55 to-zinc-950/65 p-6 shadow-[0_30px_110px_-80px_rgba(124,58,237,0.9)]"
                  : "relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/[0.06] dark:bg-zinc-950/45"
              }
            >
              {plan.highlighted ? (
                <div className="absolute -top-3 left-6 rounded-full border border-violet-400/30 bg-violet-600 px-3 py-0.5 text-[10px] font-semibold text-white shadow-lg shadow-violet-500/30">
                  Recommended
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
