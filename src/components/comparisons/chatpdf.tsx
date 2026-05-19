import { InternalTextLink } from "@/components/public/InternalTextLink";

export function ChatPdfComparisonBody() {
  return (
  <>
      <p>
        ChatPDF popularized conversational Q&A on a single PDF. Summify approaches documents as
        a multi-format intelligence workspace with predefined modes and Learn cards. This page
        compares both honestly so you can choose based on workflow — not hype.
      </p>
      <p>
        If you mostly ask ad hoc questions about one paper at a time, chat-first tools feel
        natural. If you need executive structure, study artifacts, or the same analysis pattern
        across PDFs, YouTube lectures, and decks, a workspace model may fit better.
      </p>
      <p>
        Try the same lecture PDF in both products. Check whether the output lists risks,
        next actions, and study prompts — or only answers the questions you thought to ask.
      </p>
      <p>
        Read our{" "}
        <InternalTextLink href="/guides/best-ai-pdf-summarizers-2026">
          PDF summarizer guide
        </InternalTextLink>{" "}
        for evaluation criteria, then open the{" "}
        <InternalTextLink href="/upload">Summify workspace</InternalTextLink> during free beta.
      </p>
    </>
  );
}
