import { notFound } from "next/navigation";
import {
  ACTIVE_INTELLIGENCE_MODE_IDS,
  getIntelligenceModeById,
} from "@/config/modes";
import { buildPageMetadata } from "@/lib/seo";
import { ModeDetailSections } from "@/components/public/ModeDetailSections";
import type { IntelligenceModeId } from "@/types/modes";

type PageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return ACTIVE_INTELLIGENCE_MODE_IDS.map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const mode = getIntelligenceModeById(id as IntelligenceModeId);
  if (!mode || mode.availability !== "active") {
    return buildPageMetadata({
      title: "Intelligence mode",
      description: "Summify.it intelligence mode.",
      path: `/modes/${id}`,
      noindex: true,
    });
  }

  return buildPageMetadata({
    title: `${mode.label} — AI intelligence mode`,
    description: `${mode.shortDescription} ${mode.intelligenceLens}`,
    path: `/modes/${mode.id}`,
    keywords: [mode.label, "Summify intelligence mode", mode.category],
  });
}

export default async function ModeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const mode = getIntelligenceModeById(id as IntelligenceModeId);
  if (!mode || mode.availability !== "active") {
    notFound();
  }

  return <ModeDetailSections modeId={mode.id} />;
}
