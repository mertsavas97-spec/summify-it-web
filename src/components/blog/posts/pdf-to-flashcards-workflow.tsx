import { BlogProse } from "@/components/blog/BlogProse";
import { InternalTextLink } from "@/components/public/InternalTextLink";

export function PdfToFlashcardsBlogBody() {
  return (
    <BlogProse>
      <p>
        Turning a PDF chapter into flashcards is a workflow, not a button. This post
        outlines chunking, generation, and review — see the{" "}
        <InternalTextLink href="/guides/pdf-to-flashcards-workflow">full guide</InternalTextLink>{" "}
        for detail.
      </p>

      <h2 id="chunk">Chunk your PDF</h2>
      <p>
        Upload one section via the{" "}
        <InternalTextLink href="/summarize-pdf">PDF summarizer</InternalTextLink>. Monolithic
        textbooks produce diluted cards spanning too many topics.
      </p>

      <h2 id="generate">Generate with The Student</h2>
      <p>
        Run <InternalTextLink href="/modes/the-student">The Student mode</InternalTextLink> for
        concept, quiz, and misconception Learn cards. Delete trivial cards after generation.
      </p>

      <h2 id="review">Spaced review</h2>
      <p>
        Review misses on day 1 and day 3 before adding new chapters. Generation without
        retrieval practice is procrastination dressed as productivity.
      </p>
    </BlogProse>
  );
}
