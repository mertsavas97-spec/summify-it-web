import { NextResponse } from "next/server";
import { verifyPolarWebhook } from "@/lib/billing/polar/webhook";
import {
  applyPolarCheckoutSucceededEvent,
  applyPolarOrderPaidEvent,
  applyPolarSubscriptionEvent,
  PolarProfileSyncError,
} from "@/server/billing/syncProfileFromPolar";
import {
  beginPolarWebhookDebug,
  finishPolarWebhookDebug,
} from "@/server/billing/polarWebhookDebugStore";
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

const PAID_ACTIVATION_EVENTS = new Set([
  ...SUBSCRIPTION_EVENTS,
  "order.paid",
  "order.created",
  "checkout.updated",
]);

function webhookDeliveryId(headers: Headers): string | null {
  return (
    headers.get("webhook-id") ??
    headers.get("svix-id") ??
    headers.get("webhook-signature")?.slice(0, 32) ??
    null
  );
}

function isMonetizationHandler(type: string, data: Record<string, unknown>): boolean {
  if (SUBSCRIPTION_EVENTS.has(type)) return true;
  if (type === "order.paid") return true;
  if (type === "order.created") {
    return typeof data.status === "string" && data.status === "paid";
  }
  if (type === "checkout.updated") {
    const status = data.status;
    return status === "succeeded" || status === "confirmed";
  }
  return false;
}

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

  const shouldDebug = isMonetizationHandler(payload.type, payload.data);
  const debugEventId = shouldDebug
    ? await beginPolarWebhookDebug({
        eventType: payload.type,
        deliveryId: webhookDeliveryId(request.headers),
        data: payload.data,
      })
    : null;

  try {
    if (SUBSCRIPTION_EVENTS.has(payload.type)) {
      await applyPolarSubscriptionEvent(payload.data, payload.type, debugEventId);
    } else if (payload.type === "order.paid" || payload.type === "order.created") {
      const status = typeof payload.data.status === "string" ? payload.data.status : null;
      if (payload.type === "order.paid" || status === "paid") {
        await applyPolarOrderPaidEvent(payload.data, payload.type, debugEventId);
      }
    } else if (payload.type === "checkout.updated") {
      const status = payload.data.status;
      if (status === "succeeded" || status === "confirmed") {
        await applyPolarCheckoutSucceededEvent(payload.data, debugEventId);
      }
    } else {
      devLog("[summify.billing] webhook_ignored", { type: payload.type });
    }
  } catch (error) {
    const isSync = error instanceof PolarProfileSyncError;

    if (debugEventId && isSync) {
      await finishPolarWebhookDebug(debugEventId, {
        syncStatus: "failed",
        errorCode: isSync ? error.code : "handler_error",
        errorMessage: error instanceof Error ? error.message : "unknown",
      });
    }

    devWarn("[summify.billing] polar_sync_failed", {
      type: payload.type,
      code: isSync ? error.code : "handler_error",
      message: error instanceof Error ? error.message : "unknown",
      monetizationEvent: PAID_ACTIVATION_EVENTS.has(payload.type),
      debugEventId,
    });

    if (PAID_ACTIVATION_EVENTS.has(payload.type) || isSync) {
      return NextResponse.json(
        {
          error: isSync ? error.message : "Handler failed",
          code: isSync ? error.code : undefined,
        },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ received: true, debugEventId });
}
