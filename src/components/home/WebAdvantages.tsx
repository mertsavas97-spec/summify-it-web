import { webAdvantages } from "@/data/web-advantages";
import {
  BatchIcon,
  DocumentIcon,
  ExportIcon,
  SplitIcon,
} from "@/components/icons";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { WebAdvantage } from "@/data/web-advantages";

const iconMap = {
  document: DocumentIcon,
  batch: BatchIcon,
  export: ExportIcon,
  split: SplitIcon,
} as const;

function AdvantageIcon({ type }: { type: WebAdvantage["icon"] }) {
  const Icon = iconMap[type];
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-zinc-950/80 text-violet-300">
      <Icon className="h-4 w-4" />
    </span>
  );
}

export function WebAdvantages() {
  return (
    <Section variant="muted">
      <SectionHeading
        eyebrow="Built for the web"
        title="Advantages you will not get on mobile"
        description="Capabilities designed into the desktop workspace from day one."
      />

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {webAdvantages.map((advantage) => (
          <div
            key={advantage.title}
            className="flex gap-3.5 rounded-xl border border-white/[0.06] bg-zinc-900/50 p-4 transition-colors hover:border-white/10 hover:bg-zinc-900/70"
          >
            <AdvantageIcon type={advantage.icon} />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white">
                {advantage.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                {advantage.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
