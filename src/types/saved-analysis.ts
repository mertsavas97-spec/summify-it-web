import type { MultiFormatLearnOutput } from "@/lib/learn/multiFormatTypes";
import type { AudioStudyMetadata } from "@/types/audio-study";
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
  structureFamily?: string;
  /** Phase Learn 6.5 — optional multi-format learning outputs. */
  multiFormatLearn?: MultiFormatLearnOutput;
  /** Cached teacher-style audio lesson script (audio bytes cached client-side). */
  audioStudy?: AudioStudyMetadata;
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
  is_public: boolean;
  share_id: string | null;
  shared_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Read-only payload for `/share/[shareId]` — no owner or raw source content. */
export type PublicSharedAnalysis = {
  share_id: string;
  title: string;
  source_kind: string | null;
  intelligence_mode: string | null;
  summary: SavedAnalysisSummaryPayload;
  learn_cards: LearnCardOutput[];
  shared_at: string | null;
  created_at: string;
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
