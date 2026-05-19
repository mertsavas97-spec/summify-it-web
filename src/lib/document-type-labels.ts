/**
 * Client-safe document type labels (mirrors server intelligence/documentTypes).
 */

export type DocumentTypeGuess =
  | "presentation_deck"
  | "pitch_deck"
  | "lecture_deck"
  | "report_deck"
  | "marketing_deck"
  | "strategy_deck"
  | "business_report"
  | "research_paper"
  | "legal_contract"
  | "policy_document"
  | "meeting_notes"
  | "educational_material"
  | "article"
  | "creator_brief"
  | "video_transcript"
  | "podcast_transcript"
  | "lecture_transcript"
  | "interview_transcript"
  | "tutorial_transcript"
  | "unknown";

const LABELS: Record<DocumentTypeGuess, string> = {
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

export function formatDocumentTypeLabel(type: string): string {
  if (type in LABELS) return LABELS[type as DocumentTypeGuess];
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
