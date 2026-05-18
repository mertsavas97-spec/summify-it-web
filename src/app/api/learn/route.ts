import { NextResponse } from "next/server";
import { runAnalysisMock } from "@/core/analysis";
import { createKnowledgeLayerMock } from "@/core/knowledge";
import { profileDocumentMock } from "@/core/profiling";
import { cleanDocumentMock } from "@/core/extraction";
import { extractDocumentMock } from "@/core/extraction";
import { createDocumentInput } from "@/core/documents";
import { generateLearnMock } from "@/core/learn";
import { trackUsageMock } from "@/core/usage";
import type { AnalysisPersona, LearnDepth } from "@/core/types";
import { API_MOCK_META, type LearnApiResponse } from "@/core/api/responses";

/**
 * POST /api/learn
 *
 * TODO: Require completed analysis job ID.
 * TODO: Queue deferred Learn generation (separate worker).
 * TODO: Store LearnCard rows linked to document + user.
 * TODO: Gate deep Learn depth behind Pro plan.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      fileName?: string;
      persona?: AnalysisPersona;
      depth?: LearnDepth;
      userId?: string;
    };

    const document = createDocumentInput({
      fileName: body.fileName ?? "document.pdf",
      mimeType: "application/pdf",
      sizeBytes: 50_000,
      userId: body.userId,
    });

    const extracted = extractDocumentMock(document);
    const cleaned = cleanDocumentMock(extracted);
    const profile = profileDocumentMock(cleaned, document.documentType);
    const knowledge = createKnowledgeLayerMock(profile, cleaned.text);

    const { result: analysis } = runAnalysisMock({
      knowledge,
      persona: body.persona ?? "executive",
      mode: "standard",
    });

    const learn = generateLearnMock({
      analysis,
      depth: body.depth ?? "standard",
      deferred: true,
    });

    trackUsageMock({
      userId: body.userId ?? "anonymous",
      type: "learn_generate",
      units: learn.cards.length,
    });

    const response: LearnApiResponse = {
      meta: API_MOCK_META,
      cards: learn.cards,
      deferred: learn.deferred,
      scheduledAt: learn.scheduledAt,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Learn generation failed", meta: API_MOCK_META },
      { status: 500 },
    );
  }
}
