import { NextResponse } from "next/server";
import { getOptionalUser } from "@/lib/auth";
import { isProductEventName } from "@/lib/analytics/productEvents";
import { trackProductEventV2 } from "@/server/analytics/trackProductEventV2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TrackBody = {
  eventName?: unknown;
  sessionId?: unknown;
  eventValue?: unknown;
  metadata?: unknown;
};

/**
 * POST /api/analytics/track
 * First-party product analytics ingest. Inserts into `product_events`.
 * Always returns 204 (never breaks client UX for analytics failures).
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as TrackBody | null;
    if (!body) return new NextResponse(null, { status: 204 });

    const eventName = typeof body.eventName === "string" ? body.eventName : "";
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";

    if (!eventName || !isProductEventName(eventName) || !sessionId) {
      return new NextResponse(null, { status: 204 });
    }

    const eventValue =
      typeof body.eventValue === "string" ? body.eventValue.slice(0, 255) : null;
    const metadata =
      body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? (body.metadata as Record<string, unknown>)
        : null;

    const user = await getOptionalUser().catch(() => null);

    await trackProductEventV2({
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
      isAdmin: false, // TODO: determine from profile if user has admin role
      sessionId,
      eventName,
      eventValue,
      metadata,
      insertViaServiceRole: true,
    });
  } catch {
    // Swallow — analytics must never break the client.
  }

  return new NextResponse(null, { status: 204 });
}
