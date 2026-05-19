import { BlogProse } from "@/components/blog/BlogProse";
import { InternalTextLink } from "@/components/public/InternalTextLink";

export function AiStudyNotesBlogBody() {
  return (
    <BlogProse>
      <p>
        <strong>AI study notes</strong> work when they save orientation time — not when they
        replace problem sets. This short guide covers structure, modes, and review habits.
        For depth, read the{" "}
        <InternalTextLink href="/guides/ai-study-notes-guide">full guide</InternalTextLink>.
      </p>

      <h2 id="structure">Structure beats length</h2>
      <p>
        Ask for labeled sections: themes, risks, open questions, and concepts. A wall of
        text is hard to drill. Summify outputs structured analysis plus Learn cards in the{" "}
        <InternalTextLink href="/upload">workspace</InternalTextLink>.
      </p>

      <h2 id="modes">Pick the right mode</h2>
      <p>
        <InternalTextLink href="/modes/the-student">The Student</InternalTextLink> weights
        quiz and concept cards. Use General Summary for optional readings, then switch modes
        for exam-critical chapters.
      </p>

      <h2 id="review">Review habits</h2>
      <p>
        Three short sessions beat one marathon. Generate notes, drill Learn cards without
        peeking, then verify misses in the PDF or lecture transcript. Visit{" "}
        <InternalTextLink href="/for-students">Summify for students</InternalTextLink> for
        product workflows.
      </p>
    </BlogProse>
  );
}
