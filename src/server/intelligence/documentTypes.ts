import type { TextAnalysisMode } from "@/server/ai/schemas";
import type { DocumentTypeGuess } from "./types";

type TypeScore = { type: DocumentTypeGuess; score: number };

const PITCH_DECK_KEYWORDS = [
  "problem",
  "solution",
  "market",
  "traction",
  "business model",
  "fundraise",
  "investors",
  "pitch",
  "tam",
  "sam",
  "competitive",
  "moat",
];

const LECTURE_DECK_KEYWORDS = [
  "chapter",
  "learning objective",
  "concept",
  "recap",
  "syllabus",
  "lecture",
  "lesson",
  "students",
  "exam",
  "module",
];

const REPORT_DECK_KEYWORDS = [
  "quarterly",
  "kpi",
  "results",
  "findings",
  "appendix",
  "performance",
  "metrics",
  "dashboard",
  "executive summary",
];

const KEYWORD_SIGNALS: Record<Exclude<DocumentTypeGuess, "unknown">, string[]> = {
  presentation_deck: [
    "slide",
    "deck",
    "agenda",
    "overview",
    "objective",
    "takeaway",
    "next steps",
  ],
  pitch_deck: PITCH_DECK_KEYWORDS,
  lecture_deck: LECTURE_DECK_KEYWORDS,
  report_deck: REPORT_DECK_KEYWORDS,
  marketing_deck: [
    "slide",
    "deck",
    "campaign",
    "brand",
    "awareness",
    "funnel",
    "cta",
    "impressions",
    "creative",
    "positioning",
    "tagline",
    "go-to-market",
  ],
  strategy_deck: [
    "strategic",
    "strategy",
    "roadmap",
    "vision",
    "pillars",
    "initiative",
    "okr",
    "north star",
    "portfolio",
    "priorities",
    "objectives",
  ],
  business_report: [
    "quarter",
    "revenue",
    "earnings",
    "kpi",
    "forecast",
    "financial",
    "performance",
    "yoy",
    "fiscal",
    "operating",
    "margin",
  ],
  research_paper: [
    "abstract",
    "methodology",
    "hypothesis",
    "literature",
    "citation",
    "references",
    "experiment",
    "dataset",
    "peer-reviewed",
    "findings",
  ],
  legal_contract: [
    "agreement",
    "contract",
    "party",
    "parties",
    "clause",
    "shall",
    "hereby",
    "indemnify",
    "jurisdiction",
    "whereas",
    "liability",
  ],
  policy_document: [
    "policy",
    "compliance",
    "procedure",
    "guideline",
    "regulation",
    "employees must",
    "standard operating",
    "code of conduct",
    "mandatory",
  ],
  meeting_notes: [
    "meeting",
    "minutes",
    "action item",
    "attendee",
    "agenda",
    "follow-up",
    "discussed",
    "next steps",
    "recap",
    "standup",
  ],
  educational_material: [
    "lesson",
    "chapter",
    "learning objective",
    "curriculum",
    "students",
    "instructor",
    "module",
    "worksheet",
    "quiz",
    "syllabus",
  ],
  article: [
    "published",
    "byline",
    "reporter",
    "editorial",
    "according to",
    "interview",
    "news",
    "story",
  ],
  creator_brief: [
    "brief",
    "deliverables",
    "tone of voice",
    "audience",
    "hooks",
    "social",
    "influencer",
    "repurpose",
    "content calendar",
    "ugc",
  ],
  video_transcript: [
    "video",
    "watch",
    "channel",
    "subscribe",
    "footage",
    "on screen",
  ],
  podcast_transcript: [
    "podcast",
    "episode",
    "host",
    "listener",
    "rss",
    "show notes",
    "sponsor",
  ],
  lecture_transcript: [
    "lecture",
    "syllabus",
    "professor",
    "students",
    "class",
    "exam",
    "semester",
    "course",
  ],
  interview_transcript: [
    "interview",
    "guest",
    "q&a",
    "question",
    "answer",
    "conversation",
    "moderator",
  ],
  tutorial_transcript: [
    "tutorial",
    "how to",
    "step by step",
    "walkthrough",
    "demo",
    "setup",
    "install",
    "guide",
  ],
};

const YOUTUBE_TRANSCRIPT_TYPES = [
  "video_transcript",
  "podcast_transcript",
  "lecture_transcript",
  "interview_transcript",
  "tutorial_transcript",
] as const;

type YoutubeTranscriptType = (typeof YOUTUBE_TRANSCRIPT_TYPES)[number];

function classifyYoutubeTranscriptSubtype(text: string): YoutubeTranscriptType {
  const scores = YOUTUBE_TRANSCRIPT_TYPES.map((type) => ({
    type,
    score: scoreKeywords(text, KEYWORD_SIGNALS[type]),
  }));
  scores.sort((a, b) => b.score - a.score);
  const top = scores[0];
  if (top && top.score >= 2) return top.type;
  return "video_transcript";
}

function scoreKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((sum, kw) => sum + (lower.includes(kw) ? 1 : 0), 0);
}

function scoreDeckLanguage(text: string): { marketing: number; strategy: number } {
  const lower = text.toLowerCase();
  const slideHits = (lower.match(/\bslide\s*\d+/g) ?? []).length;
  const bulletHeavy = (text.match(/^[\s]*[-•●]\s+/gm) ?? []).length;
  const marketing =
    scoreKeywords(text, KEYWORD_SIGNALS.marketing_deck) +
    (slideHits >= 2 ? 2 : slideHits) +
    (bulletHeavy > 8 ? 1 : 0);
  const strategy =
    scoreKeywords(text, KEYWORD_SIGNALS.strategy_deck) +
    (slideHits >= 2 ? 1 : 0);
  return { marketing, strategy };
}

export function classifyPresentationDeckType(
  text: string,
  slideTitles: string[] = [],
): DocumentTypeGuess {
  const corpus = `${text}\n${slideTitles.join("\n")}`.toLowerCase();
  const slideMarkers = (text.match(/---\s*slide\s+\d+/gi) ?? []).length;

  const scores: TypeScore[] = [
    { type: "pitch_deck", score: scoreKeywords(corpus, PITCH_DECK_KEYWORDS) },
    { type: "marketing_deck", score: scoreKeywords(corpus, KEYWORD_SIGNALS.marketing_deck) },
    { type: "lecture_deck", score: scoreKeywords(corpus, LECTURE_DECK_KEYWORDS) },
    { type: "report_deck", score: scoreKeywords(corpus, REPORT_DECK_KEYWORDS) },
    { type: "strategy_deck", score: scoreKeywords(corpus, KEYWORD_SIGNALS.strategy_deck) },
    {
      type: "presentation_deck",
      score: (slideMarkers >= 3 ? 2 : 0) + (slideTitles.length >= 3 ? 1 : 0) + 1,
    },
  ];

  scores.sort((a, b) => b.score - a.score);
  const top = scores[0];
  if (!top || top.score < 2) return "presentation_deck";
  return top.type;
}

export function classifyDocumentType(
  text: string,
  options?: {
    isWebArticle?: boolean;
    isYoutubeTranscript?: boolean;
    isPresentation?: boolean;
    slideTitles?: string[];
  },
): DocumentTypeGuess {
  if (options?.isYoutubeTranscript) {
    return classifyYoutubeTranscriptSubtype(text);
  }

  if (options?.isPresentation) {
    return classifyPresentationDeckType(text, options.slideTitles ?? []);
  }
  const scores: TypeScore[] = (
    Object.keys(KEYWORD_SIGNALS) as Array<keyof typeof KEYWORD_SIGNALS>
  ).map((type) => ({
    type,
    score: scoreKeywords(text, KEYWORD_SIGNALS[type]),
  }));

  const deck = scoreDeckLanguage(text);
  scores.push({ type: "marketing_deck", score: deck.marketing });
  scores.push({ type: "strategy_deck", score: deck.strategy });

  if (options?.isWebArticle) {
    const article = scores.find((s) => s.type === "article");
    if (article) article.score += 2;
  }

  scores.sort((a, b) => b.score - a.score);
  const top = scores[0];
  const second = scores[1];

  if (!top || top.score < 2) {
    if (text.length < 2_000) {
      const meeting = scoreKeywords(text, KEYWORD_SIGNALS.meeting_notes);
      if (meeting >= 1) return "meeting_notes";
    }
    return "unknown";
  }

  if (second && top.score - second.score <= 1 && top.score < 4) {
    if (top.type === "marketing_deck" || top.type === "strategy_deck") {
      return top.score >= second.score ? top.type : second.type;
    }
    return "unknown";
  }

  return top.type;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentTypeGuess, string> = {
  presentation_deck: "Presentation Deck",
  pitch_deck: "Pitch Deck",
  lecture_deck: "Lecture Deck",
  report_deck: "Report Deck",
  marketing_deck: "Marketing Deck",
  strategy_deck: "Strategy Deck",
  business_report: "Business Report",
  research_paper: "Research Paper",
  legal_contract: "Contract Document",
  policy_document: "Policy Document",
  meeting_notes: "Meeting Notes",
  educational_material: "Educational Material",
  article: "Web Article",
  creator_brief: "Creator Brief",
  video_transcript: "Video Transcript",
  podcast_transcript: "Podcast Transcript",
  lecture_transcript: "Lecture Transcript",
  interview_transcript: "Interview Transcript",
  tutorial_transcript: "Tutorial Transcript",
  unknown: "Unknown",
};

export function formatDocumentTypeLabel(type: DocumentTypeGuess | string): string {
  if (type in DOCUMENT_TYPE_LABELS) {
    return DOCUMENT_TYPE_LABELS[type as DocumentTypeGuess];
  }
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function suggestModeForDocumentType(
  typeGuess: DocumentTypeGuess,
  userMode: TextAnalysisMode,
): TextAnalysisMode {
  const map: Partial<Record<DocumentTypeGuess, TextAnalysisMode>> = {
    legal_contract: "legal",
    policy_document: "legal",
    research_paper: "academic",
    educational_material: "academic",
    lecture_deck: "academic",
    business_report: "executive",
    report_deck: "executive",
    strategy_deck: "executive",
    marketing_deck: "executive",
    pitch_deck: "executive",
    presentation_deck: "executive",
    meeting_notes: "executive",
    creator_brief: "creator",
    article: "creator",
    video_transcript: "creator",
    podcast_transcript: "creator",
    interview_transcript: "creator",
    tutorial_transcript: "creator",
    lecture_transcript: "academic",
  };
  return map[typeGuess] ?? userMode;
}
