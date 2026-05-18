import { buildPageMetadata } from "@/lib/seo";
import { TrustPageLayout } from "@/components/public/TrustPageLayout";

export const metadata = buildPageMetadata({
  title: "Terms of use",
  description:
    "Summify.it terms of use for the public beta workspace — acceptable use, AI limitations, and service expectations.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <TrustPageLayout
      eyebrow="Terms"
      title="Terms of use (public beta)"
      lead="By using Summify.it during public beta, you agree to the following sensible limits. We will update these terms before general availability and paid plans."
    >
      <section>
        <h2 className="text-base font-semibold text-zinc-200">The service</h2>
        <p className="mt-2">
          Summify.it provides AI-assisted document intelligence. Features, modes, and availability
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
          Generated content may be incomplete or incorrect. You are responsible for verifying
          results before relying on them. Outputs are not legal, medical, tax, or investment
          advice.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-200">Limitation of liability</h2>
        <p className="mt-2">
          To the fullest extent permitted by law, Summify.it is provided “as is” during beta without
          warranties. We are not liable for indirect or consequential damages arising from use of
          the service.
        </p>
      </section>
    </TrustPageLayout>
  );
}
