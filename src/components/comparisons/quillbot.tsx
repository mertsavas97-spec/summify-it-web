import { InternalTextLink } from "@/components/public/InternalTextLink";

export function QuillbotComparisonBody() {
  return (
    <>
      <p>
        QuillBot and Summify solve different problems. QuillBot helps rewrite and polish prose;
        Summify helps you understand and structure source documents — PDFs, videos, articles,
        and decks — with intelligence modes and Learn cards.
      </p>
      <p>
        Students sometimes use both: one tool for draft sentences, another for mastering
        readings. Academic integrity policies vary — always follow your institution&apos;s rules.
      </p>
      <p>
        For long readings, compare QuillBot&apos;s summarizer feature against Summify&apos;s{" "}
        <InternalTextLink href="/modes/the-student">The Student mode</InternalTextLink> on the
        same chapter. Look for concept cards and quiz prompts, not only shorter text.
      </p>
    </>
  );
}
