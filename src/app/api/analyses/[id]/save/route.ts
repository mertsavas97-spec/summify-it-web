import { NextResponse } from "next/server";
import { getOptionalUser } from "@/lib/auth";
import { getAnalysisById } from "@/server/analyses/getAnalysisById";
import { saveAnalysis } from "@/server/analyses/saveAnalysis";
import type { SaveAnalysisInsertPayload } from "@/server/analyses/buildSavePayload";
import type { SavedAnalysisMetadata } from "@/types/saved-analysis";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/analyses/[id]/save
 *
 * Save an existing analysis to the user's workspace.
 * This is used when a user wants to persist a live analysis or re-save an existing one.
 */
export async function POST(_request: Request, context: RouteContext) {
  const user = await getOptionalUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized - sign in to save analyses" },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  try {
    // First check if the analysis exists and belongs to this user
    const existing = await getAnalysisById(id, user.id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Analysis not found" },
        { status: 404 },
      );
    }

    // Build metadata from existing or create defaults
    const metadata: SavedAnalysisMetadata = {
      fallbackUsed: existing.metadata?.fallbackUsed ?? false,
      pipelineType: existing.metadata?.pipelineType,
      tokenRisk: existing.metadata?.tokenRisk,
      documentTypeGuess: existing.metadata?.documentTypeGuess,
      knowledgeTitleGuess: existing.metadata?.knowledgeTitleGuess,
      structureFamily: existing.metadata?.structureFamily,
    };

    const payload: SaveAnalysisInsertPayload = {
      user_id: user.id,
      title: existing.title ?? existing.summary?.title ?? "Untitled Analysis",
      source_kind: existing.source_kind,
      intelligence_mode: existing.intelligence_mode ?? "standard",
      provider_used: existing.provider_used ?? "cached",
      document_type: existing.document_type,
      source_label: existing.source_label,
      summary: existing.summary,
      learn_cards: existing.learn_cards ?? [],
      metadata,
    };

    // Save the analysis
    const savedId = await saveAnalysis(payload);

    if (!savedId) {
      return NextResponse.json(
        { success: false, error: "Failed to save analysis" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      analysisId: savedId,
      message: "Analysis saved to workspace",
    });
  } catch (error) {
    console.error("[analyses-save] error", error);
    return NextResponse.json(
      { success: false, error: "Failed to save analysis" },
      { status: 500 },
    );
  }
}