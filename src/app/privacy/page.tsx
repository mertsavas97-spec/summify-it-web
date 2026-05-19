import { pageSeo } from "@/lib/page-metadata";
import { TrustPageLayout } from "@/components/public/TrustPageLayout";

export const metadata = pageSeo.privacy;

export default function PrivacyPage() {
  return (
    <TrustPageLayout
      eyebrow="Privacy"
      title="Privacy during public beta"
      lead="Plain-language summary of how data flows through Summify today. This is not a full legal policy — we will publish an updated policy before paid accounts launch."
    >
      <section>
        <h2 className="text-base font-semibold text-zinc-200">What you provide</h2>
        <p className="mt-2">
          When you use the workspace, you may upload files, paste text, or submit URLs. We extract
          text on our servers so analysis can run. You are responsible for having the right to
          process the content you submit.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-200">How we use it</h2>
        <p className="mt-2">
          Extracted text and prompts are sent to third-party AI providers configured for the
          service (such as Groq and Google Gemini) to produce summaries, structured analysis, and
          Learn cards. We use server logs for reliability and security — not for advertising
          profiles.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-200">What we do not do yet</h2>
        <ul className="mt-2 list-inside list-disc space-y-1.5 text-zinc-400">
          <li>No user accounts or billing in beta</li>
          <li>No marketed “document library” or long-term cloud storage product</li>
          <li>No selling of your uploaded content</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-200">Your choices</h2>
        <p className="mt-2">
          Avoid uploading sensitive personal, health, or legally privileged material during beta.
          If you have a privacy question, contact us through the channels listed on summify.app when
          available.
        </p>
      </section>
    </TrustPageLayout>
  );
}
