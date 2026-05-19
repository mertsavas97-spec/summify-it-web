import { getIntelligenceModeById, INTELLIGENCE_MODES } from "@/config/modes";
import type {
  IntelligenceModeCategory,
  IntelligenceModeDefinition,
  IntelligenceModeId,
} from "@/types/modes";

export type ModeCategoryMeta = {
  id: IntelligenceModeCategory;
  label: string;
  description: string;
  order: number;
};

export const MODE_CATEGORY_META: ModeCategoryMeta[] = [
  {
    id: "core",
    label: "Core",
    description: "Fast, balanced intelligence for any document.",
    order: 1,
  },
  {
    id: "academic_study",
    label: "Academic & Study",
    description: "Learning, research, and exam-ready structure.",
    order: 2,
  },
  {
    id: "business_strategy",
    label: "Business & Strategy",
    description: "Decisions, markets, and operating clarity.",
    order: 3,
  },
  {
    id: "content_media",
    label: "Content & Media",
    description: "Stories, scripts, podcasts, and video intelligence.",
    order: 4,
  },
  {
    id: "productivity",
    label: "Productivity",
    description: "Actions, notes, decisions, and timelines.",
    order: 5,
  },
  {
    id: "legal_technical",
    label: "Documents & Technical",
    description: "Contract summaries, policy summaries, and technical decoding.",
    order: 6,
  },
  {
    id: "creative_advanced",
    label: "Creative & Advanced",
    description: "Narrative depth and critical reasoning.",
    order: 7,
  },
];

export function getModesByCategory(
  modes: IntelligenceModeDefinition[] = INTELLIGENCE_MODES,
): Map<IntelligenceModeCategory, IntelligenceModeDefinition[]> {
  const map = new Map<IntelligenceModeCategory, IntelligenceModeDefinition[]>();
  for (const cat of MODE_CATEGORY_META) {
    map.set(cat.id, []);
  }
  for (const mode of modes) {
    map.get(mode.category)?.push(mode);
  }
  return map;
}

export function searchModes(
  query: string,
  modes: IntelligenceModeDefinition[] = INTELLIGENCE_MODES,
): IntelligenceModeDefinition[] {
  const q = query.trim().toLowerCase();
  if (!q) return modes;
  return modes.filter((m) => {
    const haystack = [
      m.label,
      m.shortDescription,
      m.intelligenceLens,
      m.category,
      m.recommendedSources.join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function countModesByAvailability(
  modes: IntelligenceModeDefinition[] = INTELLIGENCE_MODES,
): { active: number; locked: number; comingSoon: number; total: number } {
  let active = 0;
  let locked = 0;
  let comingSoon = 0;
  for (const m of modes) {
    if (m.availability === "active") active += 1;
    else if (m.availability === "coming_soon") comingSoon += 1;
    else locked += 1;
  }
  return { active, locked, comingSoon, total: modes.length };
}

export function formatRecommendedSources(
  sources: IntelligenceModeDefinition["recommendedSources"],
): string {
  const labels: Record<string, string> = {
    pdf: "PDF",
    docx: "DOCX",
    txt: "Text",
    web: "Web",
    youtube: "YouTube",
    pptx: "PPTX",
    any: "Any source",
  };
  return sources.map((s) => labels[s] ?? s).join(" · ");
}

export function isIntelligenceModeId(value: string): value is IntelligenceModeId {
  return INTELLIGENCE_MODES.some((m) => m.id === value);
}

export function getCategoryLabelForMode(id: IntelligenceModeId): string {
  const mode = getIntelligenceModeById(id);
  if (!mode) return "";
  return MODE_CATEGORY_META.find((c) => c.id === mode.category)?.label ?? "";
}
