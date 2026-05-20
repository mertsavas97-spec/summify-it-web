import { NextResponse } from "next/server";
import { getOptionalUser } from "@/lib/auth";
import { createPolarCustomerPortalSession } from "@/lib/billing/polar/customerSession";
import { PolarApiError } from "@/lib/billing/polar/client";
import { getBillingProvider, isBillingEnabled } from "@/lib/billing/provider";

export async function POST() {
  const user = await getOptionalUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!isBillingEnabled() || getBillingProvider() !== "polar") {
    return NextResponse.json(
      { success: false, error: "Billing portal is not available." },
      { status: 503 },
    );
  }

  try {
    const session = await createPolarCustomerPortalSession(user.id);
    return NextResponse.json({ success: true, url: session.url });
  } catch (error) {
    const message =
      error instanceof PolarApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Could not open billing portal.";

    return NextResponse.json(
      { success: false, error: message },
      { status: error instanceof PolarApiError ? error.status : 500 },
    );
  }
}
