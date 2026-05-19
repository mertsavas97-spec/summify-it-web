import type { LearnCardOutput } from "@/types/text-analysis";

/** Structured summary stored in `saved_analyses.summary` (no raw transcript). */
export type SavedAnalysisSummaryPayload = {
  title: string;
  summary: string;
  keyInsights: string[];
  risksOrWarnings: string[];
  actionItems: string[];
};

/** Compact metadata stored in `saved_analyses.metadata`. */
export type SavedAnalysisMetadata = {
  fallbackUsed?: boolean;
  pipelineType?: string;
  tokenRisk?: string;
  documentTypeGuess?: string;
  knowledgeTitleGuess?: string;
};

export type SavedAnalysisRow = {
  id: string;
  user_id: string;
  title: string | null;
  source_kind: string | null;
  intelligence_mode: string | null;
  provider_used: string | null;
  document_type: string | null;
  source_label: string | null;
  summary: SavedAnalysisSummaryPayload;
  learn_cards: LearnCardOutput[];
  metadata: SavedAnalysisMetadata | null;
  created_at: string;
  updated_at: string;
};

/** List/card shape — same columns, used on dashboard. */
export type SavedAnalysisListItem = Pick<
  SavedAnalysisRow,
  | "id"
  | "title"
  | "source_kind"
  | "intelligence_mode"
  | "provider_used"
  | "document_type"
  | "source_label"
  | "summary"
  | "learn_cards"
  | "metadata"
  | "created_at"
>;
