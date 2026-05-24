import { BlogProse } from "@/components/blog/BlogProse";
import { InternalTextLink } from "@/components/public/InternalTextLink";

export function StudentsExamPrepBody() {
  return (
    <BlogProse>
      <p>
        Students reach for AI summarizers at exam time because volume spikes: lectures,
        slides, problem sets, and readings pile up faster than you can reread everything.
        The productive use of <strong>AI study notes</strong> is not to skip the material
        — it is to organize review, surface gaps, and generate practice from sources you
        already have permission to use.
      </p>

      <h2 id="workflow">From raw sources to a review plan</h2>
      <p>
        Start by listing what will be assessed: topics, not files. Then map each topic to
        sources — PDF week notes, a recorded lecture, a chapter scan. A document
        intelligence workspace lets you run the same course material through a study mode
        so terminology stays consistent across formats.
      </p>
      <p>
        <InternalTextLink href="/summarize-pdf">Summarize PDF</InternalTextLink> readings
        for definitions and argument structure; use a{" "}
        <InternalTextLink href="/summarize-youtube-video">YouTube workflow</InternalTextLink>{" "}
        for missed lectures. Both feed the same review habit if outputs share headings you
        define.
      </p>
      <p>
        If you want to keep reviewing between classes, the{" "}
        <InternalTextLink href="/ios-app">PDF summarizer app for iPhone</InternalTextLink> can
        support a mobile study workflow without changing your course structure.
      </p>
      <p>
        If you want to keep reviewing between classes, the{" "}
        <InternalTextLink href="/ios-app">PDF summarizer app for iPhone</InternalTextLink> can
        support a mobile study workflow without changing your course structure.
      </p>

      <h2 id="quiz">AI quiz from PDF: practice, not substitution</h2>
      <p>
        An <strong>AI quiz from PDF</strong> or lecture transcript works when questions
        target ideas you have already encountered — “explain trade-offs in…” rather than
        obscure trivia. Treat auto-generated quizzes as drafts: if you cannot justify why
        an answer is correct using your notes, discard the question.
      </p>
      <p>
        Summify’s Learn layer is designed for this loop: concepts and check-your-understanding
        prompts tied to the upload you provided, not a generic question bank.
      </p>

      <h2>Exam prep from notes you actually wrote</h2>
      <p>
        <strong>Exam prep from notes</strong> improves when notes are structured: learning
        objectives, pitfalls, one example each. AI can propose that skeleton from a long
        PDF; you edit and annotate in your voice. The version you memorize should be the
        one you refined — not the first model output.
      </p>

      <h2 id="learn-cards">Flashcards without the busywork</h2>
      <p>
        An <strong>AI flashcard generator</strong> saves time creating cards; it does not
        remove the need to recall. Use cards for terms, formulas, and discrete facts. Use
        longer-form summaries for essay-style exams. Mixing both beats generating hundreds
        of shallow cards you never review.
      </p>

      <h2>A one-week exam sprint (example)</h2>
      <ul>
        <li>
          <strong>Day 1–2:</strong> Upload core PDFs and lectures; build topic outlines per
          mode.
        </li>
        <li>
          <strong>Day 3–4:</strong> Hand-edit outlines; mark weak sections in the source.
        </li>
        <li>
          <strong>Day 5:</strong> Generate practice questions only for weak sections.
        </li>
        <li>
          <strong>Day 6–7:</strong> Timed recall and past papers — no new uploads.
        </li>
      </ul>

      <h2>Where Summify fits for students</h2>
      <p>
        The{" "}
        <InternalTextLink href="/for-students">For Students</InternalTextLink> page describes
        study-oriented intelligence modes and Learn cards. Everything runs in the public
        beta <InternalTextLink href="/upload">workspace</InternalTextLink> without
        accounts — useful for trying one course’s materials before committing to a
        workflow.
      </p>

      <h2>Integrity and limits</h2>
      <p>
        Follow your school’s academic integrity rules. Do not upload copyrighted exams you
        do not own. Verify facts against primary sources — models can smooth over
        contradictions that matter on test day.
      </p>
      <p>
        Used with intent, AI summarizers support exam prep you still have to execute:
        clearer notes, targeted practice, and more time for the hard part — remembering
        and applying.
      </p>
    </BlogProse>
  );
}
