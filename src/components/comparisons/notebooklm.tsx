import { InternalTextLink } from "@/components/public/InternalTextLink";

export function NotebookLmComparisonBody() {
  return (
    <>
      <p>
        NotebookLM is Google&apos;s AI notebook for chatting with your sources. Summify is an{" "}
        <strong className="font-semibold text-zinc-200">AI summarizer and study workspace</strong>{" "}
        — structured summaries, flashcards, quizzes, and optional audio from PDFs, PowerPoint,
        YouTube, and articles.
      </p>
      <p>
        If you want a conversational notebook grounded in uploaded files, NotebookLM is strong. If
        you want a{" "}
        <InternalTextLink href="/summarize-pdf">PDF summarizer</InternalTextLink> that ends in
        flashcards and a quiz — without prompt engineering — Summify is built for that workflow.
      </p>
      <p>
        Students comparing{" "}
        <strong className="font-semibold text-zinc-200">NotebookLM alternatives</strong> often care
        about study outputs: Can I get quiz-ready cards? Can I summarize a deck or YouTube lecture
        in the same place? Summify&apos;s{" "}
        <InternalTextLink href="/modes/the-student">The Student mode</InternalTextLink> is tuned
        for concepts and recall;{" "}
        <InternalTextLink href="/modes/general-summary">General Summary</InternalTextLink> covers
        first-pass reads across formats.
      </p>
      <p>
        Honest tradeoff: NotebookLM&apos;s chat UX and Google ecosystem are mature. Summify focuses
        on mode-tuned summaries and a learn loop. Try both on the same PDF and keep the tool that
        matches how you revise.
      </p>
    </>
  );
}
