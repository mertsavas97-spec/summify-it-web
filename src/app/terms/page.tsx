import { pageSeo } from "@/lib/page-metadata";
import { ProductDisclaimer } from "@/components/public/ProductDisclaimer";
import { TrustPageLayout } from "@/components/public/TrustPageLayout";

export const metadata = pageSeo.terms;

export default function TermsPage() {
  return (
    <TrustPageLayout
      eyebrow="Terms"
      title="Terms of use (public beta)"
      lead="By using Summify during public beta, you agree to the following sensible limits. We will update these terms before general availability and paid plans."
    >
      <ProductDisclaimer />
      <section>
        <h2 className="text-base font-semibold text-zinc-200">The service</h2>
        <p className="mt-2">
          Summify provides AI-assisted document intelligence. Features, modes, and availability
          may change during beta without notice. We aim for reliability but do not guarantee
          uninterrupted access.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-200">Acceptable use</h2>
        <p className="mt-2">
          You may not abuse the service, attempt to bypass rate or security controls, upload malware,
          or process content you do not have rights to use. You must comply with applicable laws and
          platform terms (including YouTube) when submitting URLs.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-200">AI outputs</h2>
        <p className="mt-2">
          Outputs are AI-generated and may be incomplete or incorrect. They are provided for
          informational purposes only, and are not legal, financial, medical, tax, investment, or
          other regulated professional advice. You are responsible for verifying outputs before
          relying on them and should consult qualified professionals when needed.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-200">Limitation of liability</h2>
        <p className="mt-2">
          To the fullest extent permitted by law, Summify is provided “as is” during beta without
          warranties. We are not liable for indirect or consequential damages arising from use of
          the service.
        </p>
      </section>
    </TrustPageLayout>
  );
}
