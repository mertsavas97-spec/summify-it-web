import { JsonLd } from "@/components/seo/JsonLd";
import { PublicHero } from "@/components/public/PublicHero";
import { SeoContentSection } from "@/components/public/SeoContentSection";
import { FormatWorkflow } from "@/components/public/FormatWorkflow";
import { FeatureGrid } from "@/components/public/FeatureGrid";
import { UseCaseSection } from "@/components/public/UseCaseSection";
import { FAQSection } from "@/components/public/FAQSection";
import { RelatedLinksSection } from "@/components/public/RelatedLinksSection";
import { CTASection } from "@/components/public/CTASection";
import { InternalTextLink } from "@/components/public/InternalTextLink";
import { ProductMockCard } from "@/components/public/ProductMockCard";
import { faqPageSchema, productPageJsonLd } from "@/lib/schema";
import type { FormatLandingConfig } from "@/data/format-landings/types";

type FormatLandingTemplateProps = {
  config: FormatLandingConfig;
};

export function FormatLandingTemplate({ config }: FormatLandingTemplateProps) {
  const HeroAside = config.HeroAside;

  return (
    <>
      <JsonLd
        data={[
          ...productPageJsonLd({
            path: config.path,
            pageTitle: config.breadcrumbLabel,
            description: config.hero.description,
          }),
          faqPageSchema(config.faqs),
        ]}
      />
      <PublicHero
        badge={config.hero.badge}
        title={config.hero.title}
        description={config.hero.description}
        primaryCta={config.hero.primaryCta}
        secondaryCta={config.hero.secondaryCta}
      >
        {HeroAside ? <HeroAside /> : <ProductMockCard variant={config.hero.mockVariant} />}
      </PublicHero>

      <SeoContentSection
        eyebrow={config.seoContent.eyebrow}
        title={config.seoContent.title}
        blocks={config.seoContent.blocks}
      />

      <FormatWorkflow title={config.workflow.title} steps={config.workflow.steps} />

      <FeatureGrid title={config.features.title} features={config.features.items} />

      <UseCaseSection
        title={config.useCases.title}
        subtitle={config.useCases.subtitle}
        cases={config.useCases.cases}
      />

      <FAQSection items={config.faqs} />

      {config.iosCta && (
        <section className="border-b border-white/[0.04] px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl rounded-2xl border border-violet-500/20 bg-violet-950/20 px-5 py-5 text-sm leading-relaxed text-zinc-300 sm:px-6">
            <p className="font-medium text-white">{config.iosCta.title}</p>
            <p className="mt-2 text-zinc-400">
              {config.iosCta.description}{" "}
              <InternalTextLink href="/ios-app">
                {config.iosCta.label ?? "Explore the Summify iOS app"}
              </InternalTextLink>
            </p>
          </div>
        </section>
      )}

      <RelatedLinksSection links={config.relatedLinks} />

      <CTASection
        title={config.cta.title}
        description={config.cta.description}
        primaryLabel={config.cta.primaryLabel}
        secondaryHref={config.cta.secondaryHref}
        secondaryLabel={config.cta.secondaryLabel}
      />
    </>
  );
}
