import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { USE_CASE_SLUGS, getUseCaseBySlug } from "@/data/use-cases/registry";
import {
  UseCaseLandingLayout,
  buildUseCaseMetadata,
} from "@/components/seo/UseCaseLandingLayout";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return USE_CASE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = getUseCaseBySlug(slug);
  if (!config) return {};
  return buildUseCaseMetadata(config);
}

export default async function UseCasePage({ params }: PageProps) {
  const { slug } = await params;
  const config = getUseCaseBySlug(slug);
  if (!config) notFound();

  return <UseCaseLandingLayout config={config} />;
}
