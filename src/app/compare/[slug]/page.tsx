import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COMPARISON_SLUGS, getComparisonBySlug } from "@/data/comparisons/registry";
import {
  ComparisonPageLayout,
  buildComparisonMetadata,
} from "@/components/seo/ComparisonPageLayout";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return COMPARISON_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = getComparisonBySlug(slug);
  if (!config) return {};
  return buildComparisonMetadata(config);
}

export default async function ComparePage({ params }: PageProps) {
  const { slug } = await params;
  const config = getComparisonBySlug(slug);
  if (!config) notFound();

  const { Content } = config;

  return (
    <ComparisonPageLayout config={config}>
      <Content />
    </ComparisonPageLayout>
  );
}
