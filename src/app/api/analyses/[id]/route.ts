import { NextResponse } from "next/server";
import { getOptionalUser } from "@/lib/auth";
import { deleteAnalysis } from "@/server/analyses/deleteAnalysis";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getOptionalUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const ok = await deleteAnalysis(id, user.id);

  if (!ok) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
