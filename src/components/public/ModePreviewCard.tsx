import Link from "next/link";
import type { IntelligenceModeDefinition } from "@/types/modes";
import { formatRecommendedSources, getCategoryLabelForMode } from "@/lib/mode-groups";
import { getCategoryColors } from "@/lib/mode-category-colors";

type ModePreviewCardProps = {
  mode: IntelligenceModeDefinition;
  href?: string;
};

function availabilityBadge(mode: IntelligenceModeDefinition) {
  const colors = getCategoryColors(mode.category);
  if (mode.availability === "active") {
    return (
      <span className="rounded border border-emerald-500/25 bg-emerald-950/30 px-1.5 py-px text-[9px] font-medium uppercase text-emerald-400/90">
        Active
      </span>
    );
  }
  if (mode.availability === "coming_soon") {
    return (
      <span className="rounded border border-zinc-600/40 bg-zinc-800/40 px-1.5 py-px text-[9px] font-medium uppercase text-zinc-500">
        Soon
      </span>
    );
  }
  return (
    <span
      className={`rounded border px-1.5 py-px text-[9px] font-medium uppercase ${colors.badge}`}
    >
      Pro preview
    </span>
  );
}

export function ModePreviewCard({ mode, href }: ModePreviewCardProps) {
  const colors = getCategoryColors(mode.category);
  const cardHref =
    href ?? (mode.availability === "active" ? `/modes/${mode.id}` : undefined);
  const inner = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-zinc-100">{mode.label}</h3>
        {availabilityBadge(mode)}
      </div>
      <p className={`mt-1 text-[11px] ${colors.label}`}>
        {getCategoryLabelForMode(mode.id)}
      </p>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-400">
        {mode.shortDescription}
      </p>
      <p className="mt-3 text-[11px] text-zinc-500">
        {formatRecommendedSources(mode.recommendedSources)}
      </p>
    </>
  );

  const className = `block rounded-xl border bg-zinc-950/50 p-4 transition-colors ${colors.border} ${colors.hover}`;

  if (cardHref) {
    return (
      <Link href={cardHref} className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={`${className} opacity-90`}>{inner}</div>;
}
