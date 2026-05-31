import { GraduationCap, Microscope, Gavel, PenTool, Briefcase } from "lucide-react";

type UseCase = {
  title: string;
  description: string;
  icon?: React.ReactNode;
  accent?: string;
};

type UseCaseSectionProps = {
  title: string;
  subtitle?: string;
  cases: UseCase[];
};

/** Map titles to icons if not provided */
const getIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("adhd") || t.includes("student")) return <GraduationCap className="h-4 w-4" />;
  if (t.includes("researcher")) return <Microscope className="h-4 w-4" />;
  if (t.includes("med") || t.includes("law")) return <Gavel className="h-4 w-4" />;
  if (t.includes("creator")) return <PenTool className="h-4 w-4" />;
  if (t.includes("professional")) return <Briefcase className="h-4 w-4" />;
  return <GraduationCap className="h-4 w-4" />;
};

export function UseCaseSection({ title, subtitle, cases }: UseCaseSectionProps) {
  return (
    <section className="border-b border-white/[0.04] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
        {subtitle && (
          <p className="mt-3 max-w-2xl text-sm text-zinc-500">{subtitle}</p>
        )}
        <div className="mt-8 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {cases.map((item) => (
            <article
              key={item.title}
              className="group flex h-full flex-col rounded-2xl border border-white/[0.06] bg-gradient-to-b from-zinc-900/60 to-zinc-950/35 p-5 transition-all duration-300 hover:border-violet-500/25 hover:from-zinc-900/80"
            >
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-zinc-900/50 text-violet-300 transition-colors group-hover:border-violet-500/30 group-hover:bg-violet-950/30">
                {item.icon || getIcon(item.title)}
              </div>
              <h3 className="text-sm font-semibold text-zinc-100">{item.title}</h3>
              <p className="mt-2 text-[12px] leading-relaxed text-zinc-500 group-hover:text-zinc-400">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
