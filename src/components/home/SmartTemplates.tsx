import { smartTemplates } from "@/data/smart-templates";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function SmartTemplates() {
  return (
    <Section variant="bordered">
      <SectionHeading
        eyebrow="Smart Templates"
        title="Multi-mode analysis for every document type"
        description="Templates shape structure and emphasis—pick the mode that matches your document."
      />

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {smartTemplates.map((template) => (
          <article
            key={template.id}
            className="group relative rounded-xl border border-white/[0.08] bg-zinc-900/60 p-4 transition-[border-color,background-color,box-shadow] duration-200 hover:border-violet-500/25 hover:bg-zinc-900/90 hover:shadow-lg hover:shadow-black/25"
          >
            <div className="absolute top-4 right-4 font-mono text-[10px] font-medium tracking-wider text-zinc-600 transition-colors group-hover:text-violet-400/80">
              {template.code}
            </div>
            <div className="flex items-start gap-3 pr-10">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-zinc-950/80 text-xs font-semibold text-violet-300">
                {template.code.slice(0, 2)}
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white">
                  {template.name}
                </h3>
                <p className="mt-0.5 text-xs text-violet-300/90">
                  {template.tagline}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                  {template.description}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/[0.04] pt-3">
              {template.highlights.map((highlight) => (
                <span
                  key={highlight}
                  className="rounded-md bg-zinc-950/60 px-2 py-0.5 font-mono text-[10px] text-zinc-500"
                >
                  {highlight}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
