import { NextResponse } from "next/server";
import { isProductEventType } from "@/lib/analytics/productEventTypes";
import { getOptionalUser, getProfile } from "@/lib/auth";
import { resolveEntitlementPlanIdFromProfile } from "@/lib/billing/entitlements";
import { trackProductEvent } from "@/server/usage/trackProductEvent";
import type { ProductEventMetadata } from "@/server/usage/trackProductEvent";

const CLIENT_ALLOWED_EVENTS = new Set([
  "learn_started",
  "learn_completed",
  "upgrade_clicked",
]);

export async function POST(request: Request) {
  const user = await getOptionalUser();
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as {
    eventType?: string;
    sourceType?: string | null;
    intelligenceMode?: string | null;
    metadata?: ProductEventMetadata;
  } | null;

  const eventType = body?.eventType?.trim();
  if (!eventType || !isProductEventType(eventType) || !CLIENT_ALLOWED_EVENTS.has(eventType)) {
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }

  const profile = await getProfile(user.id);
  const plan = resolveEntitlementPlanIdFromProfile(profile);

  await trackProductEvent({
    eventType,
    userId: user.id,
    sourceType: body?.sourceType ?? null,
    intelligenceMode: body?.intelligenceMode ?? null,
    plan,
    metadata: body?.metadata,
  });

  return NextResponse.json({ success: true });
}
