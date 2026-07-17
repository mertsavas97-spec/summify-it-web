import { NextResponse } from "next/server";
import { getOptionalUser } from "@/lib/auth";
import { getAnalysisById } from "@/server/analyses/getAnalysisById";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/analyses/[id]/save
 *
 * Idempotent "already in workspace" confirmation for an existing owned analysis.
 * Does not insert a duplicate row — podcast/audio metadata merges use dedicated
 * merge helpers instead.
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
    const existing = await getAnalysisById(id, user.id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Analysis not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      analysisId: existing.id,
      alreadySaved: true,
      message: "Analysis is already in your workspace",
    });
  } catch (error) {
    console.error("[analyses-save] error", error);
    return NextResponse.json(
      { success: false, error: "Failed to save analysis" },
      { status: 500 },
    );
  }
}
