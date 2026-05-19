import type { FaqItem } from "@/data/faqs";
import type { IntelligenceModeId } from "@/types/modes";
import type { ActiveIntelligenceModeId } from "@/config/modes";

export type ModeSeoContent = {
  introParagraphs: string[];
  faqs: FaqItem[];
  relatedModeIds: ActiveIntelligenceModeId[];
};

export const MODE_SEO_CONTENT: Record<ActiveIntelligenceModeId, ModeSeoContent> = {
  "general-summary": {
    introParagraphs: [
      "General Summary is your neutral first pass on any document, article, or transcript. It balances overview, insights, risks, and next actions without the quiz-heavy emphasis of study modes or the decision framing of executive lenses.",
      "Use it when you are exploring unfamiliar material, triaging a reading list, or handing context to teammates who need structure before choosing a specialized mode. It pairs well with PDFs, web articles, and mixed-semester source sets.",
      "After General Summary, rerun important sources in The Student, Executive Brief, or Contract Summary when you know the workflow you need. Comparing lenses on the same upload is one of the fastest ways to judge whether a document deserves deep human reading.",
    ],
    faqs: [
      {
        q: "When should I use General Summary?",
        a: "Use it for first-pass understanding before switching to specialized modes.",
      },
      {
        q: "Does General Summary create quiz cards?",
        a: "Learn cards are balanced, not quiz-heavy. Choose The Student for exam prep.",
      },
      {
        q: "What sources work best?",
        a: "PDF, DOCX, TXT, web articles, YouTube with captions, and PPTX.",
      },
      {
        q: "Is General Summary free?",
        a: "Yes, during public beta alongside other active modes.",
      },
    ],
    relatedModeIds: ["executive-brief", "the-student", "the-creator"],
  },
  "executive-brief": {
    introParagraphs: [
      "Executive Brief compresses long reports, board decks, and stakeholder interviews into decision-ready narrative. Risks, tradeoffs, and implied owners surface early — built for leaders who will not reread eighty slides before a meeting.",
      "The mode weights insights toward action: what changed, what is exposed, and what should happen next. It is the default recommendation on team landing pages and quarterly report use cases.",
      "Pair Executive Brief with PowerPoint and PDF format guides. Verify numbers and commitments in source documents — AI summaries orient attention; they do not replace diligence.",
    ],
    faqs: [
      {
        q: "What makes Executive Brief different?",
        a: "Decision-ready framing with risks and next actions emphasized over study artifacts.",
      },
      {
        q: "Can teams share outputs?",
        a: "Saved analyses support optional public share links during beta.",
      },
      {
        q: "Best formats?",
        a: "PDF reports, PPTX strategy decks, and executive interview transcripts.",
      },
      {
        q: "Is this financial or legal advice?",
        a: "No. Outputs are informational summaries for human review.",
      },
    ],
    relatedModeIds: ["general-summary", "contract-analyzer", "the-creator"],
  },
  "the-student": {
    introParagraphs: [
      "The Student mode turns lectures, textbook chapters, and research PDFs into study-friendly intelligence. Learn cards weight concepts, quizzes, memory hooks, and misconceptions — designed for recall-heavy courses and exam windows.",
      "It is the anchor mode on student segment pages and research paper use cases. Upload one chapter at a time for focused cards, then drill Learn in short sessions instead of rereading entire PDFs passively.",
      "Always align AI notes with your syllabus and verify claims in the source. The Student accelerates orientation and self-quiz — it does not replace problem sets, labs, or instructor guidance.",
    ],
    faqs: [
      {
        q: "Does The Student generate quizzes?",
        a: "Learn cards include quiz-style prompts for self-review, not formal LMS assessments.",
      },
      {
        q: "Can I use YouTube lectures?",
        a: "Yes, when captions or transcripts are available.",
      },
      {
        q: "How is this different from General Summary?",
        a: "The Student emphasizes concept and quiz cards; General Summary is neutral.",
      },
      {
        q: "Is it free for students?",
        a: "The workspace is free during public beta.",
      },
    ],
    relatedModeIds: ["general-summary", "the-creator", "executive-brief"],
  },
  "the-creator": {
    introParagraphs: [
      "The Creator mode mines hooks, narrative beats, and repurposing angles from long-form transcripts, articles, and scripts. Learn cards emphasize connections and social-first prompts — practical for newsletters, threads, and clip planning.",
      "Creators use it after podcast recordings or YouTube uploads with reliable captions. It does not replace editing in your creative tools; it supplies structured raw material grounded in what was actually said.",
      "Pair with summarize YouTube and MP3 landing pages. For neutral first reads before creative planning, start with General Summary, then rerun in The Creator.",
    ],
    faqs: [
      {
        q: "Is The Creator a viral hooks tool?",
        a: "It surfaces hook-oriented Learn cards from transcripts — verify tone before publishing.",
      },
      {
        q: "Does it work on articles?",
        a: "Yes. Web articles and DOCX scripts work alongside video transcripts.",
      },
      {
        q: "Can I summarize podcasts?",
        a: "Yes, with transcript text — paste or upload TXT exports.",
      },
      {
        q: "Storage of creator content?",
        a: "No long-term raw upload library during beta. See Privacy.",
      },
    ],
    relatedModeIds: ["general-summary", "executive-brief", "the-student"],
  },
  "contract-analyzer": {
    introParagraphs: [
      "Contract Summary (Contract Analyzer mode) highlights obligations, dates, payment terms, termination rights, and ambiguous clauses in PDF and DOCX uploads. It is built for first-pass orientation — not legal advice.",
      "Freelancers and procurement teams use it to decide where human counsel should spend time. Every flagged clause still requires verification in the signed document and review by qualified professionals before execution.",
      "Read the contract summary guide for workflow checklists. Do not upload agreements you cannot send to configured AI providers.",
    ],
    faqs: [
      {
        q: "Is Contract Summary legal advice?",
        a: "No. Informational overviews only. Consult qualified counsel.",
      },
      {
        q: "Which file types?",
        a: "PDF and DOCX in the workspace.",
      },
      {
        q: "Can it compare contract versions?",
        a: "Analyze each version separately and diff your own notes.",
      },
      {
        q: "Scanned PDFs?",
        a: "OCR quality affects extraction. Prefer digital PDF when possible.",
      },
    ],
    relatedModeIds: ["executive-brief", "general-summary", "the-student"],
  },
};

export function getModeSeoContent(
  modeId: IntelligenceModeId,
): ModeSeoContent | undefined {
  if (modeId in MODE_SEO_CONTENT) {
    return MODE_SEO_CONTENT[modeId as ActiveIntelligenceModeId];
  }
  return undefined;
}
