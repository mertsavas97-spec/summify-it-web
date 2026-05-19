import { NextResponse } from "next/server";
import { getOptionalUser } from "@/lib/auth";
import { recordReview } from "@/server/memory/recordReview";
import type { ReviewRating } from "@/types/memory";

const RATINGS: ReviewRating[] = ["again", "hard", "good", "easy"];

export async function POST(request: Request) {
  const user = await getOptionalUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    itemId?: string;
    rating?: ReviewRating;
    sessionId?: string | null;
  } | null;

  if (!body?.itemId || !body.rating || !RATINGS.includes(body.rating)) {
    return NextResponse.json({ success: false, error: "Invalid review payload." }, { status: 400 });
  }

  const result = await recordReview({
    itemId: body.itemId,
    rating: body.rating,
    sessionId: body.sessionId ?? null,
    userId: user.id,
  });

  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
