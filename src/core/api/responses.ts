import type {
  AnalysisResult,
  DocumentInput,
  LearnCard,
  PipelineStage,
} from "@/core/types";

export type ApiMeta = {
  mock: true;
  version: string;
};

export type UploadApiResponse = {
  meta: ApiMeta;
  document: DocumentInput;
  message: string;
};

export type AnalyzeApiResponse = {
  meta: ApiMeta;
  analysis: AnalysisResult;
  cacheHit: boolean;
  stagesCompleted: PipelineStage[];
};

export type LearnApiResponse = {
  meta: ApiMeta;
  cards: LearnCard[];
  deferred: boolean;
  scheduledAt: string;
};

export const API_MOCK_META: ApiMeta = {
  mock: true,
  version: "0.1.0-skeleton",
};
