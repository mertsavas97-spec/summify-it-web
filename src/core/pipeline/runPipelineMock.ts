import { createDocumentInput } from "@/core/documents";
import { extractDocumentMock, cleanDocumentMock } from "@/core/extraction";
import { profileDocumentMock } from "@/core/profiling";
import { createKnowledgeLayerMock } from "@/core/knowledge";
import { routeAnalysisPersonaMock, runAnalysisMock } from "@/core/analysis";
import { generateLearnMock } from "@/core/learn";
import { checkCacheMock } from "@/core/cache";
import { trackUsageMock } from "@/core/usage";
import { trackTelemetryMock } from "@/core/telemetry";
import type {
  AnalysisMode,
  AnalysisPersona,
  AnalysisResult,
  DocumentInput,
  LearnCard,
  PipelineStage,
} from "@/core/types";

export type PipelineMockInput = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  userId?: string;
  persona?: AnalysisPersona;
  mode?: AnalysisMode;
};

export type PipelineMockOutput = {
  document: DocumentInput;
  analysis: AnalysisResult;
  learnCards: LearnCard[];
  cacheHit: boolean;
  stagesCompleted: PipelineStage[];
};

/**
 * Runs the full mock intelligence pipeline end-to-end.
 * Safe for API routes and client previews — no external I/O.
 */
export function runPipelineMock(input: PipelineMockInput): PipelineMockOutput {
  const stagesCompleted: PipelineStage[] = [];
  const userId = input.userId ?? "anonymous";

  const document = createDocumentInput({
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    userId,
  });
  stagesCompleted.push("upload");
  trackTelemetryMock("pipeline.upload", { stage: "upload", documentId: document.id });
  trackUsageMock({ userId, type: "document_upload", metadata: { documentId: document.id } });

  const extracted = extractDocumentMock(document);
  stagesCompleted.push("extract");
  trackTelemetryMock("pipeline.extract", { stage: "extract", documentId: document.id });

  const cleaned = cleanDocumentMock(extracted);
  stagesCompleted.push("clean");

  const profile = profileDocumentMock(cleaned, document.documentType);
  stagesCompleted.push("profile");

  const knowledge = createKnowledgeLayerMock(profile, cleaned.text);

  const { persona, route } = routeAnalysisPersonaMock({
    profile,
    requestedPersona: input.persona,
    mode: input.mode,
  });

  const cache = checkCacheMock({
    documentId: document.id,
    persona,
    mode: input.mode ?? "standard",
  });

  if (cache.hit) {
    trackUsageMock({ userId, type: "cache_hit", metadata: { documentId: document.id } });
  }

  const { result: analysis } = runAnalysisMock({
    knowledge,
    persona,
    mode: input.mode ?? "standard",
    provider: route.primary,
  });
  stagesCompleted.push("analyze");
  trackUsageMock({ userId, type: "analysis_run", metadata: { documentId: document.id, persona } });

  const learn = generateLearnMock({ analysis, deferred: true });
  stagesCompleted.push("learn");
  trackUsageMock({ userId, type: "learn_generate", units: learn.cards.length });

  return {
    document,
    analysis,
    learnCards: learn.cards,
    cacheHit: cache.hit,
    stagesCompleted,
  };
}
