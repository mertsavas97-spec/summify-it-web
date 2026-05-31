import { Sparkles, ShieldCheck, Lock, Headphones, GraduationCap, Heart } from "lucide-react";

type TrustItem = {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

const ITEMS: TrustItem[] = [
  { icon: Lock, value: "Private by design", label: "No AI training on data" },
  { icon: Sparkles, value: "Try your first lesson free", label: "No account required" },
  { icon: ShieldCheck, value: "Secure processing", label: "Enterprise-grade" },
  { icon: Heart, value: "Loved by learners", label: "Students & researchers" },
  { icon: Headphones, value: "Audio lessons", label: "Listen anywhere" },
  { icon: GraduationCap, value: "Exam ready", label: "Quiz generation" },
];

export function HomeTrustBar() {
  return (
    <section className="border-b border-white/[0.04] px-4 pb-6 pt-0 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <ul
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6"
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
      </div>
    </section>
  );
}
