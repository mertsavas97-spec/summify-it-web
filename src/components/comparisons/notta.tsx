import { InternalTextLink } from "@/components/public/InternalTextLink";

export function NottaComparisonBody() {
  return (
    <>
      <p>
        Notta is built for capturing and transcribing meetings. Summify is built for analyzing
        text you already have — transcripts, PDFs, articles, and captioned video — into
        structured intelligence with modes and Learn cards.
      </p>
      <p>
        A practical stack: record with Notta (or your meeting tool), export transcript, analyze
        in Summify with{" "}
        <InternalTextLink href="/modes/executive-brief">Executive Brief</InternalTextLink> for
        action items. Verify your organization allows sending meeting text to AI providers.
      </p>
      <p>
        Creators with podcast transcripts should see{" "}
        <InternalTextLink href="/summarize-mp3">audio workflows</InternalTextLink> and{" "}
        <InternalTextLink href="/modes/the-creator">The Creator mode</InternalTextLink>.
      </p>
    </>
  );
}
