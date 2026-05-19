import { JsonLd } from "@/components/seo/JsonLd";
import { faqPageSchema } from "@/lib/schema";
import type { FaqItem } from "@/data/faqs";

type FAQSectionProps = {
  title?: string;
  subtitle?: string;
  items: FaqItem[];
  /** When true, emits FAQPage JSON-LD once for this section. */
  withSchema?: boolean;
  className?: string;
};

export function FAQSection({
  title = "Frequently asked questions",
  subtitle,
  items,
  withSchema = true,
  className = "",
}: FAQSectionProps) {
  return (
    <section
      className={`border-b border-white/[0.04] px-4 py-14 sm:px-6 lg:px-8 ${className}`}
      aria-labelledby="faq-section-heading"
    >
      {withSchema && <JsonLd data={faqPageSchema(items)} />}
      <div className="mx-auto max-w-3xl">
        <h2
          id="faq-section-heading"
          className="text-2xl font-semibold tracking-tight text-white sm:text-3xl"
        >
          {title}
        </h2>
        {subtitle && (
          <p className="mt-3 text-sm leading-relaxed text-zinc-500">{subtitle}</p>
        )}
        <div className="mt-8 space-y-2">
          {items.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-white/[0.06] bg-zinc-950/50 open:border-violet-500/20 open:bg-violet-950/10"
            >
              <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-medium text-zinc-200 marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-3">
                  {item.q}
                  <span
                    className="shrink-0 text-violet-400/70 transition-transform group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </span>
              </summary>
              <div className="border-t border-white/[0.04] px-4 pb-4 pt-2">
                <p className="text-sm leading-relaxed text-zinc-400">{item.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
