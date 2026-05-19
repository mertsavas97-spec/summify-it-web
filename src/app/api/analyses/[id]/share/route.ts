import { NextResponse } from "next/server";
import { getOptionalUser } from "@/lib/auth";
import { setAnalysisShare } from "@/server/analyses/setAnalysisShare";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getOptionalUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { enabled?: boolean };
  try {
    body = (await request.json()) as { enabled?: boolean };
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.enabled !== "boolean") {
    return NextResponse.json(
      { success: false, error: "enabled must be a boolean" },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const result = await setAnalysisShare(id, user.id, body.enabled);

  if (!result.success) {
    const status = result.error === "Unauthorized" ? 401 : 404;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }

  return NextResponse.json({
    success: true,
    isPublic: result.isPublic,
    shareId: result.shareId,
    sharedAt: result.sharedAt,
  });
}
