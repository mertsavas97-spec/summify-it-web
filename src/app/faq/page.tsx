import { pageSeo } from "@/lib/page-metadata";
import { faqPageSchema } from "@/lib/schema";
import { JsonLd } from "@/components/seo/JsonLd";
import { TrustPageLayout } from "@/components/public/TrustPageLayout";
import { ProductDisclaimer } from "@/components/public/ProductDisclaimer";
import { FAQ_ITEMS } from "@/data/faqs";

export const metadata = pageSeo.faq;

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqPageSchema(FAQ_ITEMS)} />
      <TrustPageLayout
        eyebrow="FAQ"
        title="Common questions"
        lead="Quick answers about formats, privacy, beta limits, and how the workspace behaves today."
      >
        <ul className="space-y-6">
          {FAQ_ITEMS.map((item) => (
            <li key={item.q}>
              <h2 className="text-base font-semibold text-zinc-200">{item.q}</h2>
              <p className="mt-2">{item.a}</p>
            </li>
          ))}
        </ul>
        <ProductDisclaimer className="mt-8 border-t border-white/[0.06] pt-5" />
      </TrustPageLayout>
    </>
  );
}
