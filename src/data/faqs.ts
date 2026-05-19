export type FaqItem = {
  q: string;
  a: string;
};

/** Shared FAQ copy for /faq page and FAQPage JSON-LD. */
export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "What can I upload or analyze?",
    a: "PDF, DOCX, TXT, PowerPoint (PPTX), pasted text, public web articles (URL), and YouTube videos (via transcript). The workspace guides you through extraction, then analysis.",
  },
  {
    q: "Does YouTube always work?",
    a: "YouTube analysis depends on an available transcript for the video. Auto-generated or uploaded captions are required; videos without transcripts may fail extraction. Long videos may be compacted for analysis limits.",
  },
  {
    q: "Are my uploads stored?",
    a: "During beta, files are processed on the server for extraction and analysis. We do not offer persistent libraries, accounts, or long-term document storage yet. Do not upload confidential material you cannot process on a third-party AI stack.",
  },
  {
    q: "What data is sent to AI providers?",
    a: "Extracted text and analysis prompts are sent to configured providers (e.g. Groq, Gemini) to generate your results. We do not sell your content. See our Privacy page for a plain-language overview.",
  },
  {
    q: "What are Pro modes?",
    a: "Twenty-five additional intelligence lenses are visible in the mode browser as Pro Intelligence previews. Four modes are active today; locked modes can be explored but cannot run analysis until they launch.",
  },
  {
    q: "Is Summify free?",
    a: "You can start free, and paid plans are available for larger workflows. Existing beta override accounts may retain preview access.",
  },
  {
    q: "Does Summify provide legal, financial, or professional advice?",
    a: "No. Summify provides AI-generated summaries, study aids, and document organization tools for informational purposes only. It does not replace advice from qualified professionals.",
  },
];
