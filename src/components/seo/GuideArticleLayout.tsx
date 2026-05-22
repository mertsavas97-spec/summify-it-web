import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { TableOfContents } from "@/components/seo/content/TableOfContents";
import { CtaStrip } from "@/components/seo/content/CtaStrip";
import { FAQSection } from "@/components/public/FAQSection";
import { guidePageJsonLd } from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import type { GuideArticle } from "@/data/guides/types";
import { Button } from "@/components/ui/Button";

type GuideArticleLayoutProps = {
  guide: GuideArticle;
  children: React.ReactNode;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function buildGuideMetadata(guide: GuideArticle) {
  return buildPageMetadata({
    title: guide.title,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    keywords: guide.tags,
    ogType: "article",
    publishedTime: guide.date,
    modifiedTime: guide.updatedAt ?? guide.date,
  });
}

export function GuideArticleLayout({ guide, children }: GuideArticleLayoutProps) {
  return (
    <article className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <JsonLd data={guidePageJsonLd(guide)} />
      <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <TableOfContents items={guide.toc} />
          </div>
        </aside>

        <div className="min-w-0 max-w-3xl lg:max-w-none">
          <nav className="text-xs text-zinc-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-violet-300">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-zinc-400">Guides</span>
          </nav>

          <header className="mt-6 border-b border-white/[0.06] pb-8">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
              <span className="rounded border border-violet-500/20 bg-violet-950/30 px-1.5 py-px text-violet-300/80">
                {guide.category}
              </span>
              <time dateTime={guide.date}>{formatDate(guide.date)}</time>
              <span aria-hidden>·</span>
              <span>{guide.readingTime}</span>
            </div>
            <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
              {guide.title}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-zinc-400">{guide.description}</p>
          </header>

          {guide.keyTakeaways.length > 0 && (
            <aside className="mt-8 rounded-xl border border-violet-500/15 bg-violet-950/15 p-5">
              <h2 className="text-sm font-semibold text-violet-200">Key takeaways</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-400">
                {guide.keyTakeaways.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </aside>
          )}

          <div className="mt-8 lg:hidden">
            <TableOfContents items={guide.toc} />
          </div>

          <div className="mt-8 guide-prose">{children}</div>

          <CtaStrip
            title="Try Summify on your own documents"
            description="Upload PDFs, videos, decks, and articles — pick an intelligence mode and get structured analysis plus Learn cards. Free during public beta."
            primaryLabel="Open workspace"
            analyticsSurface={`guide:${guide.slug}`}
          />

          <FAQSection items={guide.faqs} title="Guide FAQ" />

          {guide.relatedLinks.length > 0 && (
            <aside className="mt-12 rounded-xl border border-white/[0.06] bg-zinc-950/50 p-5">
              <h2 className="text-sm font-semibold text-zinc-200">Related on Summify</h2>
              <ul className="mt-3 space-y-2">
                {guide.relatedLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-violet-300/90 hover:text-violet-200 hover:underline"
                    >
                      {link.label}
                    </Link>
                    <p className="text-xs text-zinc-600">{link.description}</p>
                  </li>
                ))}
              </ul>
            </aside>
          )}

          <footer className="mt-12 flex flex-wrap gap-3 border-t border-white/[0.06] pt-8">
            <Button href="/upload" size="sm">
              Try Summify free
            </Button>
            <Button href="/blog" variant="secondary" size="sm">
              Blog articles
            </Button>
          </footer>
        </div>
      </div>
    </article>
  );
}
