import type {
  AnalysisJob,
  AnalysisMode,
  AnalysisPersona,
  AnalysisResult,
  KnowledgeLayer,
} from "@/core/types";
import { getPersonaById } from "@/data/personas";

function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

type RunAnalysisParams = {
  knowledge: KnowledgeLayer;
  persona: AnalysisPersona;
  mode: AnalysisMode;
  provider?: string;
};

/**
 * Mock persona-based analysis. Replace with provider SDK calls + streaming.
 */
export function runAnalysisMock({
  knowledge,
  persona,
  mode,
}: RunAnalysisParams): { job: AnalysisJob; result: AnalysisResult } {
  const personaDef = getPersonaById(persona);
  const jobId = generateJobId();
  const now = new Date().toISOString();

  const job: AnalysisJob = {
    id: jobId,
    documentId: knowledge.documentId,
    persona,
    mode,
    status: "completed",
    createdAt: now,
    completedAt: now,
  };

  const result: AnalysisResult = {
    jobId,
    documentId: knowledge.documentId,
    persona,
    mode,
    sections: personaDef.outputSections.map((title, i) => ({
      title,
      content:
        knowledge.compressedFacts[i] ??
        knowledge.compressedFacts[0] ??
        "Mock analysis output.",
    })),
    completedAt: now,
  };

  return { job, result };
}
