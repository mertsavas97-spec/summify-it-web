export type FaqItem = {
  q: string;
  a: string;
};

/** Shared FAQ copy for /faq page and FAQPage JSON-LD — single source of truth. */
export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "What can I upload or analyze?",
    a: "PDF, DOCX, TXT, PowerPoint (PPTX), pasted text, public web articles (URL), and YouTube videos via transcript. The workspace guides you through extraction, then analysis with your chosen intelligence mode.",
  },
  {
    q: "Does Summify store my uploaded files?",
    a: "Files are processed on the server for extraction and analysis. Summify does not offer a permanent document library for raw uploads. Saved analyses store structured outputs (summary, insights, Learn cards) — not your original file. Do not upload confidential material you cannot process on a third-party AI stack.",
  },
  {
    q: "What data is sent to AI providers?",
    a: "Extracted text and analysis prompts are sent to configured providers (e.g. Groq, Gemini) to generate results. We do not sell your content. See our Privacy page for a plain-language overview of data flow.",
  },
  {
    q: "How do AI summaries work?",
    a: "After extraction, Summify profiles your source, selects an adaptive analysis plan, and runs the active intelligence mode. You receive a structured summary, key insights, risks or warnings when relevant, action items, and Learn cards — not a single generic paragraph.",
  },
  {
    q: "What are Learn cards?",
    a: "Learn cards are study-ready outputs such as concepts, quizzes, memory hooks, and connections. They are weighted by your intelligence mode — for example, The Student emphasizes recall and exam prep.",
  },
  {
    q: "What are intelligence modes?",
    a: "Intelligence modes are analysis lenses tuned for different workflows — executive briefs, study notes, creator repurposing, contracts, and more. Five modes are active in public beta; additional Pro modes appear in the browser as previews.",
  },
  {
    q: "Does Summify support mind maps and memory review?",
    a: "Yes. Saved analyses can include interactive mind maps derived from your structured outputs. The memory review system helps you revisit Learn cards over time when signed in (availability may vary by plan during beta).",
  },
  {
    q: "Does YouTube summarization always work?",
    a: "YouTube analysis requires an available transcript or captions. Videos without transcripts may fail extraction. Long videos may be compacted for analysis limits while preserving themes.",
  },
  {
    q: "Is Summify free?",
    a: "The workspace is available during public beta with generous access. Paid tiers (Free, Scholar, Pro, Team) are shown on the pricing page as a preview — checkout may not be live until billing is enabled.",
  },
  {
    q: "How should I verify AI output?",
    a: "Treat Summify output as a draft for understanding, not a source of truth. Cross-check facts, quotes, and conclusions against the original document or transcript, especially for academic, legal, or financial material.",
  },
  {
    q: "Does Summify provide legal, financial, or professional advice?",
    a: "No. Summify provides AI-generated summaries, study aids, and document organization tools for informational purposes only. It does not replace advice from qualified professionals.",
  },
];
