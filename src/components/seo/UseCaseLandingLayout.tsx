import { PublicHero } from "@/components/public/PublicHero";
import { SeoContentSection } from "@/components/public/SeoContentSection";
import { FormatWorkflow } from "@/components/public/FormatWorkflow";
import { FeatureGrid } from "@/components/public/FeatureGrid";
import { FAQSection } from "@/components/public/FAQSection";
import { RelatedLinksSection } from "@/components/public/RelatedLinksSection";
import { CTASection } from "@/components/public/CTASection";
import { ProductMockCard } from "@/components/public/ProductMockCard";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { useCasePageJsonLd } from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import type { UseCaseLandingConfig } from "@/data/use-cases/types";

type UseCaseLandingLayoutProps = {
  config: UseCaseLandingConfig;
};

export function buildUseCaseMetadata(config: UseCaseLandingConfig) {
  return buildPageMetadata({
    title: config.title,
    description: config.description,
    path: config.path,
  });
}

export function UseCaseLandingLayout({ config }: UseCaseLandingLayoutProps) {
  return (
    <>
      <JsonLd data={useCasePageJsonLd(config)} />
      <PublicHero
        badge={config.badge}
        title={config.title}
        description={config.description}
        primaryCta={config.primaryCta}
        secondaryCta={config.secondaryCta}
      >
        <ProductMockCard />
      </PublicHero>

      <SeoContentSection
        eyebrow="Use case"
        title={config.title}
        blocks={config.seoBlocks}
      />

      <FormatWorkflow title={config.workflow.title} steps={config.workflow.steps} />

      <FeatureGrid
        title="Capabilities"
        features={config.features.map((f) => ({
          title: f.title,
          description: f.description,
        }))}
      />

      <section className="border-b border-white/[0.04] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-lg font-semibold text-white">Supported formats</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {config.formats.map((format) => (
              <li key={format.href}>
                <Link
                  href={format.href}
                  className="block rounded-xl border border-white/[0.06] bg-zinc-950/50 p-4 transition-colors hover:border-violet-500/25"
                >
                  <span className="text-sm font-medium text-violet-200">{format.title}</span>
                  <span className="mt-1 block text-xs text-zinc-500">{format.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FAQSection items={config.faqs} />

      <RelatedLinksSection links={config.relatedLinks} />

      <CTASection
        title={config.cta.title}
        description={config.cta.description}
        primaryLabel={config.cta.primaryLabel}
      />
    </>
  );
}
