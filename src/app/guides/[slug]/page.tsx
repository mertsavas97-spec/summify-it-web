import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GUIDE_SLUGS, getGuideBySlug } from "@/data/guides/registry";
import {
  GuideArticleLayout,
  buildGuideMetadata,
} from "@/components/seo/GuideArticleLayout";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return GUIDE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};
  return buildGuideMetadata(guide);
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const { Content } = guide;

  return (
    <GuideArticleLayout guide={guide}>
      <Content />
    </GuideArticleLayout>
  );
}
