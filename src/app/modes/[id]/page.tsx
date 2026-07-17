import { notFound } from "next/navigation";
import {
  ACTIVE_INTELLIGENCE_MODE_IDS,
  getIntelligenceModeById,
} from "@/config/modes";
import { buildPageMetadata } from "@/lib/seo";
import { modePageSeo } from "@/lib/page-metadata";
import { modePageJsonLd } from "@/lib/schema";
import { JsonLd } from "@/components/seo/JsonLd";
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
      description: "Summify intelligence mode.",
      path: `/modes/${id}`,
      noindex: true,
    });
  }

  const seoOverride = modePageSeo[mode.id];
  return buildPageMetadata({
    title: seoOverride?.title ?? `${mode.label} AI Mode`,
    description:
      seoOverride?.description ??
      `${mode.shortDescription} ${mode.intelligenceLens}`,
    path: `/modes/${mode.id}`,
    keywords: seoOverride?.keywords ?? [
      mode.label,
      "Summify intelligence mode",
      mode.category,
      "AI summarizer",
    ],
  });
}

export default async function ModeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const mode = getIntelligenceModeById(id as IntelligenceModeId);
  if (!mode || mode.availability !== "active") {
    notFound();
  }

  const seoOverride = modePageSeo[mode.id];
  const pageDescription =
    seoOverride?.description ??
    `${mode.shortDescription} ${mode.intelligenceLens}`;

  return (
    <>
      <JsonLd
        data={modePageJsonLd(mode.label, mode.id, pageDescription)}
      />
      <ModeDetailSections modeId={mode.id} />
    </>
  );
}
