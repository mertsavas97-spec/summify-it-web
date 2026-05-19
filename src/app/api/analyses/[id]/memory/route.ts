import { NextResponse } from "next/server";
import { ensureProfileForUser, getOptionalUser, getProfile } from "@/lib/auth";
import { DEFAULT_PAID_PREVIEW_PLAN } from "@/types/plan";
import { generateReviewSetForAnalysis } from "@/server/memory/generateReviewSet";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const user = await getOptionalUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await ensureProfileForUser();
  const profile = await getProfile(user.id);
  const { id } = await context.params;

  const result = await generateReviewSetForAnalysis({
    analysisId: id,
    userId: user.id,
    plan: profile?.plan ?? DEFAULT_PAID_PREVIEW_PLAN,
  });

  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
