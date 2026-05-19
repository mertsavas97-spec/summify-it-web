import { NextResponse } from "next/server";
import { getOptionalUser } from "@/lib/auth";
import { getBillingStatusCopy, isBillingEnabled } from "@/lib/billing/provider";
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

  return NextResponse.json({ success: true, provider: status.provider, url });
}
