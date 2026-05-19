import { GuideProse } from "@/components/guides/GuideProse";
import { InternalTextLink } from "@/components/public/InternalTextLink";

export function PdfToFlashcardsGuideBody() {
  return (
    <GuideProse>
      <p>
        Flashcards work when they force retrieval, not recognition. This guide walks through a{" "}
        <strong>PDF to flashcards</strong> workflow using Summify Learn cards — how to chunk
        chapters, pick modes, review on a schedule, and avoid shallow cards that fail under
        exam pressure.
      </p>

      <h2 id="why-flashcards">Why flashcards still matter in 2026</h2>
      <p>
        Cognitive science has not retired active recall. Apps and AI layers change, but the
        mechanism persists: prompt → attempt → feedback. AI can generate prompts faster, yet
        generation without review is entertainment. Your job is to turn outputs into repeated,
        effortful retrieval.
      </p>
      <p>
        Bad flashcards quote sentences. Good flashcards test ideas: “Under what conditions does
        this model fail?” “Define X without using Y.” Summify’s quiz and misconception card
        types push toward the second category when you use study-focused modes.
      </p>

      <h2 id="upload">Upload and chunk your PDF</h2>
      <p>
        Upload one chapter or paper section per session via the{" "}
        <InternalTextLink href="/summarize-pdf">PDF summarizer</InternalTextLink>. Giant uploads
        produce diluted cards spanning too many themes. If your textbook PDF is monolithic,
        split files externally or analyze logical sections sequentially.
      </p>
      <p>
        Skim headings first. Note equations, diagrams, and tables the extractor might flatten —
        manually add cards for visuals the text layer missed. AI cannot replace studying graphs
        you never opened.
      </p>

      <h2 id="learn-output">Learn card types</h2>
      <p>
        Run <InternalTextLink href="/modes/the-student">The Student mode</InternalTextLink> for
        highest quiz and concept weighting. Expect concept cards (definitions), quiz cards
        (questions), misconception cards (common errors), and connection cards (links between
        ideas). Star the card types you miss most often in self-testing.
      </p>
      <p>
        After generation, delete duplicate or trivial cards. Quality decks are edited decks.
        Merge overlapping concepts into one stronger prompt. Rewrite vague questions until a
        classmate could answer without context.
      </p>

      <h2 id="review-loop">The review loop</h2>
      <ol>
        <li>Day 0: Generate cards from a fresh PDF section.</li>
        <li>Day 1: Review all cards once — mark misses.</li>
        <li>Day 3: Review misses only, add manual cards for weak spots.</li>
        <li>Day 7: Mixed review across the week’s sections.</li>
        <li>Pre-exam: Drill misses + practice problems, not new generation.</li>
      </ol>
      <p>
        Saved analyses unlock memory review flows in the dashboard during beta. Even without
        export to Anki, consistent in-product review beats exporting once and never opening the
        deck.
      </p>

      <h2 id="mistakes">Mistakes to avoid</h2>
      <p>
        Generating thousands of cards the night before. Trusting cards without opening the PDF
        when a grade depends on detail. Using executive modes for STEM recall. Sharing decks
        verbatim — personal rewrites stick better.
      </p>
      <p>
        Pair this workflow with the{" "}
        <InternalTextLink href="/guides/ai-study-notes-guide">AI study notes guide</InternalTextLink>{" "}
        and <InternalTextLink href="/for-students">student landing page</InternalTextLink> for a
        full exam prep stack.
      </p>
    </GuideProse>
  );
}
