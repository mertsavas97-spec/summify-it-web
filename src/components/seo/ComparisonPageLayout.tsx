import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { ComparisonTable } from "@/components/seo/content/ComparisonTable";
import { CtaStrip } from "@/components/seo/content/CtaStrip";
import { FAQSection } from "@/components/public/FAQSection";
import { comparisonPageJsonLd } from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import type { ComparisonPageConfig } from "@/data/comparisons/types";

type ComparisonPageLayoutProps = {
  config: ComparisonPageConfig;
  children: React.ReactNode;
};

export function buildComparisonMetadata(config: ComparisonPageConfig) {
  return buildPageMetadata({
    title: config.title,
    description: config.description,
    path: `/compare/${config.slug}`,
    ogType: "article",
    publishedTime: config.date,
  });
}

export function ComparisonPageLayout({ config, children }: ComparisonPageLayoutProps) {
  return (
    <article className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <JsonLd data={comparisonPageJsonLd(config)} />
      <div className="mx-auto max-w-3xl">
        <nav className="text-xs text-zinc-500" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-violet-300">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-400">Compare</span>
        </nav>

        <header className="mt-6 border-b border-white/[0.06] pb-8">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
            {config.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-zinc-400">{config.description}</p>
        </header>

        <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-zinc-400">
          {children}
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-white">Feature comparison</h2>
          <div className="mt-4">
            <ComparisonTable competitorName={config.competitorName} rows={config.tableRows} />
          </div>
        </section>

        <section className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-violet-500/15 bg-violet-950/10 p-5">
            <h2 className="text-sm font-semibold text-violet-200">Ideal for Summify</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-400">
              {config.idealUsers.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-zinc-950/50 p-5">
            <h2 className="text-sm font-semibold text-zinc-200">Summify strengths</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-400">
              {config.summifyStrengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-white/[0.06] bg-zinc-950/50 p-5">
            <h2 className="text-sm font-semibold text-zinc-200">{config.competitorName} strengths</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-400">
              {config.competitorStrengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-zinc-950/50 p-5">
            <h2 className="text-sm font-semibold text-zinc-200">{config.competitorName} limitations</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-400">
              {config.competitorLimitations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-white/[0.06] bg-zinc-950/40 p-5">
          <h2 className="text-sm font-semibold text-zinc-200">Summify limitations</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-400">
            {config.summifyLimitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <CtaStrip
          title="Compare on your own documents"
          description="Upload the same PDF or paste the same transcript in Summify — free during public beta."
          analyticsSurface={`compare:${config.slug}`}
        />

        <FAQSection items={config.faqs} title="Comparison FAQ" />

        {config.relatedLinks.length > 0 && (
          <aside className="mt-10 rounded-xl border border-white/[0.06] bg-zinc-950/50 p-5">
            <h2 className="text-sm font-semibold text-zinc-200">Related</h2>
            <ul className="mt-3 space-y-2">
              {config.relatedLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-violet-300/90 hover:text-violet-200 hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </article>
  );
}
