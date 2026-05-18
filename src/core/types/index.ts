/** Supported document formats for ingestion. */
export type DocumentType = "pdf" | "docx" | "txt" | "pptx" | "markdown" | "unknown";

/** Client or server payload describing an uploaded document. */
export type DocumentInput = {
  id: string;
  fileName: string;
  mimeType: string;
  documentType: DocumentType;
  sizeBytes: number;
  uploadedAt: string;
  userId?: string;
};

/** Raw extraction output before normalization. */
export type ExtractedDocument = {
  documentId: string;
  rawText: string;
  pageCount: number;
  extractedAt: string;
  metadata: Record<string, string>;
};

/** Normalized text after cleaning and deduplication. */
export type CleanedDocument = {
  documentId: string;
  text: string;
  wordCount: number;
  cleanedAt: string;
  removedNoiseRatio: number;
};

/** Structural and semantic profile used to route analysis. */
export type DocumentProfile = {
  documentId: string;
  documentType: DocumentType;
  domain: string;
  complexity: "low" | "medium" | "high";
  estimatedReadingMinutes: number;
  topics: string[];
  profiledAt: string;
};

/** Compressed representation fed to analysis providers. */
export type KnowledgeLayer = {
  documentId: string;
  compressedFacts: string[];
  entities: string[];
  sectionMap: { title: string; summary: string }[];
  tokenEstimate: number;
  createdAt: string;
};

export type AnalysisPersona = "executive" | "academic" | "legal" | "creator";

export type AnalysisMode = "standard" | "deep" | "quick" | "advanced";

export type AnalysisJobStatus = "queued" | "running" | "completed" | "failed";

export type AnalysisJob = {
  id: string;
  documentId: string;
  persona: AnalysisPersona;
  mode: AnalysisMode;
  status: AnalysisJobStatus;
  provider?: ProviderName;
  createdAt: string;
  completedAt?: string;
};

export type AnalysisResult = {
  jobId: string;
  documentId: string;
  persona: AnalysisPersona;
  mode: AnalysisMode;
  sections: { title: string; content: string }[];
  completedAt: string;
};

export type LearnDepth = "surface" | "standard" | "deep";

export type LearnCardType = "flashcard" | "quiz" | "concept" | "timeline";

export type LearnCard = {
  id: string;
  documentId: string;
  type: LearnCardType;
  front: string;
  back: string;
  depth: LearnDepth;
  generatedAt: string;
};

export type ProviderName = "openai" | "groq" | "gemini" | "openrouter";

export type ProviderRoute = {
  persona: AnalysisPersona;
  mode: AnalysisMode;
  primary: ProviderName;
  fallback: ProviderName[];
};

export type UsageEventType =
  | "document_upload"
  | "analysis_run"
  | "learn_generate"
  | "cache_hit"
  | "export";

export type UsageEvent = {
  id: string;
  userId: string;
  type: UsageEventType;
  units: number;
  timestamp: string;
  metadata?: Record<string, string | number | boolean>;
};

export type CacheRecord = {
  key: string;
  documentId: string;
  persona: AnalysisPersona;
  mode: AnalysisMode;
  hitCount: number;
  expiresAt: string;
  createdAt: string;
};

/** Ordered pipeline stages for UI and orchestration. */
export type PipelineStage =
  | "upload"
  | "extract"
  | "clean"
  | "profile"
  | "analyze"
  | "learn";

export type PipelineStageStatus = "pending" | "active" | "complete" | "skipped";

export type PipelineStageState = {
  stage: PipelineStage;
  status: PipelineStageStatus;
  label: string;
};
