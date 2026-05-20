import { NextResponse } from "next/server";
import { verifyPolarWebhook } from "@/lib/billing/polar/webhook";
import {
  applyPolarOrderPaidEvent,
  applyPolarSubscriptionEvent,
} from "@/server/billing/syncProfileFromPolar";
import { devLog, devWarn } from "@/server/logging";

export const runtime = "nodejs";

const SUBSCRIPTION_EVENTS = new Set([
  "subscription.created",
  "subscription.active",
  "subscription.updated",
  "subscription.canceled",
  "subscription.revoked",
  "subscription.uncanceled",
]);

export async function POST(request: Request) {
  const rawBody = await request.text();

  let payload;
  try {
    payload = verifyPolarWebhook(rawBody, request.headers);
  } catch (error) {
    devWarn("[summify.billing] webhook_verify_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  devLog("[summify.billing] webhook_received", { type: payload.type });

  try {
    if (SUBSCRIPTION_EVENTS.has(payload.type)) {
      await applyPolarSubscriptionEvent(payload.data);
    } else if (payload.type === "order.paid") {
      await applyPolarOrderPaidEvent(payload.data);
    } else if (payload.type === "checkout.updated") {
      const status = payload.data.status;
      if (status === "succeeded") {
        await applyPolarOrderPaidEvent(payload.data);
      }
    }
  } catch (error) {
    devWarn("[summify.billing] webhook_handler_failed", {
      type: payload.type,
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
