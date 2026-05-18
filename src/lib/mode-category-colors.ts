import type { IntelligenceModeCategory } from "@/types/modes";

export type ModeCategoryColorSet = {
  label: string;
  badge: string;
  border: string;
  borderActive: string;
  hover: string;
  chip: string;
  glow: string;
};

const CATEGORY_COLORS: Record<IntelligenceModeCategory, ModeCategoryColorSet> = {
  core: {
    label: "text-zinc-400",
    badge: "border-zinc-500/30 bg-zinc-800/50 text-zinc-400",
    border: "border-zinc-500/20",
    borderActive: "border-zinc-400/35",
    hover: "hover:border-zinc-500/25 hover:bg-zinc-900/40",
    chip: "bg-zinc-800/60 text-zinc-300",
    glow: "shadow-zinc-500/5",
  },
  academic_study: {
    label: "text-cyan-400/85",
    badge: "border-cyan-500/25 bg-cyan-950/30 text-cyan-300/90",
    border: "border-cyan-500/20",
    borderActive: "border-cyan-400/35",
    hover: "hover:border-cyan-500/25 hover:bg-cyan-950/15",
    chip: "bg-cyan-950/40 text-cyan-200/90",
    glow: "shadow-cyan-500/10",
  },
  business_strategy: {
    label: "text-emerald-400/85",
    badge: "border-emerald-500/25 bg-emerald-950/30 text-emerald-300/90",
    border: "border-emerald-500/20",
    borderActive: "border-emerald-400/35",
    hover: "hover:border-emerald-500/25 hover:bg-emerald-950/15",
    chip: "bg-emerald-950/40 text-emerald-200/90",
    glow: "shadow-emerald-500/10",
  },
  content_media: {
    label: "text-amber-400/85",
    badge: "border-amber-500/25 bg-amber-950/30 text-amber-300/90",
    border: "border-amber-500/20",
    borderActive: "border-amber-400/35",
    hover: "hover:border-amber-500/25 hover:bg-amber-950/15",
    chip: "bg-amber-950/40 text-amber-200/90",
    glow: "shadow-amber-500/10",
  },
  productivity: {
    label: "text-sky-400/80",
    badge: "border-sky-500/25 bg-sky-950/30 text-sky-300/90",
    border: "border-sky-500/20",
    borderActive: "border-sky-400/35",
    hover: "hover:border-sky-500/25 hover:bg-sky-950/15",
    chip: "bg-sky-950/40 text-sky-200/90",
    glow: "shadow-sky-500/10",
  },
  legal_technical: {
    label: "text-rose-400/85",
    badge: "border-rose-500/25 bg-rose-950/30 text-rose-300/90",
    border: "border-rose-500/20",
    borderActive: "border-rose-400/35",
    hover: "hover:border-rose-500/25 hover:bg-rose-950/15",
    chip: "bg-rose-950/40 text-rose-200/90",
    glow: "shadow-rose-500/10",
  },
  creative_advanced: {
    label: "text-fuchsia-400/80",
    badge: "border-fuchsia-500/25 bg-fuchsia-950/30 text-fuchsia-300/90",
    border: "border-fuchsia-500/20",
    borderActive: "border-fuchsia-400/35",
    hover: "hover:border-fuchsia-500/25 hover:bg-fuchsia-950/15",
    chip: "bg-fuchsia-950/40 text-fuchsia-200/90",
    glow: "shadow-fuchsia-500/10",
  },
};

export function getCategoryColors(category: IntelligenceModeCategory): ModeCategoryColorSet {
  return CATEGORY_COLORS[category];
}
