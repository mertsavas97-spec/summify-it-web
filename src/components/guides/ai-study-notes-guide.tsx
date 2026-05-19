import { GuideProse } from "@/components/guides/GuideProse";
import { InternalTextLink } from "@/components/public/InternalTextLink";

export function AiStudyNotesGuideBody() {
  return (
    <GuideProse>
      <p>
        <strong>AI study notes</strong> promise to shrink lecture hours into review-ready
        pages. The difference between a useful system and a procrastination trap is structure,
        verification, and review habits. This guide covers how to build notes you will actually
        use before exams — with Summify modes, Learn cards, and source discipline.
      </p>

      <h2 id="foundations">Foundations of good study notes</h2>
      <p>
        Strong notes answer three questions: What is the core claim? What evidence supports it?
        What might I be tested on? AI can accelerate drafting those sections, but you must
        align them with your syllabus. A brilliant summary of an optional reading still wastes
        time if the midterm covers lectures 4–6 only.
      </p>
      <p>
        Prefer structured outputs over blobs. Headings, labeled insights, and explicit “open
        questions” sections mirror how instructors write exams. Flat paragraphs hide what is
        foundational vs. peripheral.
      </p>
      <p>
        Build a personal shorthand: color tags for “likely exam,” “needs professor office hours,”
        and “background only.” AI does not know your grading rubric — you do.
      </p>

      <h2 id="sources">Sources: PDF, video, slides</h2>
      <p>
        Modern courses mix formats. Summify supports{" "}
        <InternalTextLink href="/summarize-pdf">PDF readings</InternalTextLink>,{" "}
        <InternalTextLink href="/summarize-youtube-video">captioned YouTube lectures</InternalTextLink>,{" "}
        <InternalTextLink href="/summarize-powerpoint">PowerPoint decks</InternalTextLink>, and{" "}
        <InternalTextLink href="/summarize-web-articles">web articles</InternalTextLink> in one
        workspace. Run each source with the same mode for consistent tone, then merge themes
        manually into a weekly review doc.
      </p>
      <p>
        For audio-only recordings without good captions, export a transcript or use a lecture
        video upload when available. Feeding raw audio without text limits any AI tool.
      </p>

      <h2 id="modes">Intelligence modes for students</h2>
      <p>
        <InternalTextLink href="/modes/the-student">The Student mode</InternalTextLink> weights
        concept, quiz, and misconception Learn cards — designed for recall-heavy review. Start
        with General Summary when skimming optional material, then rerun important chapters in
        The Student before the exam window.
      </p>
      <p>
        Executive Brief is rarely the right lens for coursework unless you are in a business
        program analyzing case studies. Creator mode helps communications electives repurposing
        media examples, not core STEM problem sets.
      </p>

      <h2 id="learn-cards">Learn cards and self-quiz</h2>
      <p>
        Learn cards are Summify’s study layer: concepts, why-it-matters prompts, memory hooks,
        quizzes, and connections. Treat them like flashcards you interrogate — not facts you
        recite once. Miss a card twice? Return to the PDF paragraph or transcript segment and
        rewrite the card in your own words.
      </p>
      <p>
        For a dedicated flashcard workflow, see{" "}
        <InternalTextLink href="/guides/pdf-to-flashcards-workflow">
          PDF to flashcards
        </InternalTextLink>{" "}
        and the companion{" "}
        <InternalTextLink href="/blog/pdf-to-flashcards-workflow">blog post</InternalTextLink>.
        Memory review scheduling in the dashboard reinforces spacing over cramming when you
        save analyses.
      </p>

      <h2 id="review-habits">Review habits that stick</h2>
      <p>
        Schedule three short sessions per week instead of one heroic Sunday. Session one:
        generate or refresh notes. Session two: drill Learn cards without peeking at sources.
        Session three: practice problems or past exams — AI cannot replace doing the work.
      </p>
      <p>
        Visit <InternalTextLink href="/for-students">Summify for students</InternalTextLink> for
        product positioning and FAQs. Used honestly, AI study notes compress orientation time so
        you spend more cycles on retrieval practice — the activity that actually moves grades.
      </p>
    </GuideProse>
  );
}
