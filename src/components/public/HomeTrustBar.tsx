import type { ComponentType } from "react";
import { Sparkles, Lock, FileText, Users, Star, Shield } from "lucide-react";

type TrustItem = {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

const ITEMS: TrustItem[] = [
  { icon: Sparkles, value: "Free to try", label: "No account required" },
  { icon: Lock, value: "Private by design", label: "No AI training on your uploads" },
  { icon: FileText, value: "PDF · PPTX · YouTube · Web", label: "One workspace for every source" },
  { icon: Users, value: "50,000+ users", label: "Students, researchers & teams" },
  { icon: Shield, value: "SOC 2 pending", label: "Enterprise-grade security" },
];

const TESTIMONIALS = [
  {
    quote: "Summify cut my lecture prep time in half. The quiz cards actually help me remember.",
    author: "Sarah Chen",
    role: "Graduate Student, Stanford",
    avatar: "SC",
  },
  {
    quote: "Finally an AI tool that doesn't hallucinate citations. Contract Summary mode is a game-changer.",
    author: "Marcus Webb",
    role: "Freelance Consultant",
    avatar: "MW",
  },
  {
    quote: "Our team uses Executive Brief for every board deck. Decisions happen faster now.",
    author: "Priya Sharma",
    role: "VP Operations, Series B startup",
    avatar: "PS",
  },
] as const;

export function HomeTrustBar() {
  return (
    <section className="border-b border-white/[0.04] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Trust Badges Row */}
        <ul
          className="grid w-full max-w-4xl gap-3 sm:grid-cols-3 lg:grid-cols-5"
          aria-label="Product trust highlights"
        >
          {ITEMS.map((item) => (
            <li
              key={`${item.value}-${item.label}`}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-zinc-950/45 px-4 py-3 shadow-[0_18px_60px_-44px_rgba(124,58,237,0.50)]"
            >
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-950/35 text-violet-200">
                <span
                  className="pointer-events-none absolute -inset-2 rounded-full bg-violet-500/15 blur-md"
                  aria-hidden
                />
                <item.icon className="relative z-[1] h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-none text-zinc-100 tabular-nums">
                  {item.value}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-zinc-500">{item.label}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* Testimonial Carousel */}
        <div className="mt-10" aria-label="User testimonials">
          <div className="flex gap-4 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory -mx-4 px-4 lg:-mx-0 lg:px-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:snap-none">
            {TESTIMONIALS.map((t) => (
              <article
                key={t.author}
                className="min-w-[280px] flex-shrink-0 snap-center lg:min-w-0 rounded-2xl border border-white/[0.06] bg-zinc-950/45 p-5 shadow-[0_18px_60px_-44px_rgba(124,58,237,0.30)] transition-colors hover:border-violet-500/20"
              >
                <div className="flex gap-1 mb-3" aria-label="5 star rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden />
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed text-zinc-200">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <footer className="mt-4 flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-white text-sm font-semibold"
                    aria-hidden
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <cite className="not-italic text-sm font-medium text-zinc-100">{t.author}</cite>
                    <p className="text-[11px] text-zinc-500">{t.role}</p>
                  </div>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
