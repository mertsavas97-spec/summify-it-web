import { NextResponse } from "next/server";
import { getOptionalUser, getProfile } from "@/lib/auth";
import { resolveEntitlementPlanIdFromProfile } from "@/lib/billing/entitlements";
import { trackProductEvent } from "@/server/usage/trackProductEvent";
import { isEduEmail } from "@/lib/auth/edu-email";
import { createPolarCheckout } from "@/lib/billing/polar/checkout";
import {
  isPlanCheckoutEnabled,
  SCHOLAR_COMING_SOON_MESSAGE,
} from "@/lib/billing/plan-availability";
import { polarErrorToResponse } from "@/lib/billing/polar/api-error";
import { isPolarPlanConfigured } from "@/lib/billing/polar/prices";
import {
  getBillingProvider,
  getBillingStatusCopy,
  isBillingEnabled,
} from "@/lib/billing/provider";
import {
  getCheckoutUrl,
  isBillingCheckoutPlan,
  isBillingInterval,
} from "@/lib/billing/planMapping";

export async function POST(request: Request) {
  const user = await getOptionalUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const status = getBillingStatusCopy();
  if (!isBillingEnabled()) {
    return NextResponse.json(
      {
        success: false,
        provider: status.provider,
        error: status.description,
      },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    planId?: string;
    plan?: string;
    interval?: string;
  } | null;

  const planId = body?.planId ?? body?.plan;
  const interval = body?.interval;

  if (!planId || !interval || !isBillingCheckoutPlan(planId) || !isBillingInterval(interval)) {
    return NextResponse.json(
      { success: false, error: "Invalid billing plan." },
      { status: 400 },
    );
  }

  const provider = getBillingProvider();

  const scholarEduCheckout = planId === "scholar" && isEduEmail(user.email);

  if (!isPlanCheckoutEnabled(planId) && !scholarEduCheckout) {
    return NextResponse.json(
      {
        success: false,
        provider,
        error:
          planId === "scholar"
            ? SCHOLAR_COMING_SOON_MESSAGE
            : "Checkout is not available for this plan yet.",
      },
      { status: 403 },
    );
  }

  try {
    if (provider === "polar") {
      if (!isPolarPlanConfigured(planId, interval)) {
        return NextResponse.json(
          {
            success: false,
            provider,
            error: "Checkout is not configured for this plan.",
          },
          { status: 503 },
        );
      }

      const checkout = await createPolarCheckout({
        userId: user.id,
        email: user.email ?? null,
        planId,
        interval,
      });

      const profile = await getProfile(user.id);
      await trackProductEvent({
        eventType: "checkout_started",
        userId: user.id,
        plan: resolveEntitlementPlanIdFromProfile(profile),
        metadata: { target_plan: planId, interval },
        insertViaServiceRole: true,
      });

      return NextResponse.json({
        success: true,
        provider,
        url: checkout.url,
        checkoutId: checkout.checkoutId,
      });
    }

    const url = getCheckoutUrl(planId, interval);
    if (!url) {
      return NextResponse.json(
        {
          success: false,
          provider: status.provider,
          error: "Checkout is not configured for this plan yet.",
        },
        { status: 503 },
      );
    }

    const profile = await getProfile(user.id);
    await trackProductEvent({
      eventType: "checkout_started",
      userId: user.id,
      plan: resolveEntitlementPlanIdFromProfile(profile),
      metadata: { target_plan: planId, interval },
      insertViaServiceRole: true,
    });

    return NextResponse.json({ success: true, provider: status.provider, url });
  } catch (error) {
    const { message, status, details } = polarErrorToResponse(error);

    if (process.env.NODE_ENV === "development") {
      console.error("[summify.checkout] failed", { planId, interval, message, details, error });
    }

    return NextResponse.json(
      {
        success: false,
        provider,
        error: message,
        ...(details ? { details } : {}),
      },
      { status },
    );
  }
}
