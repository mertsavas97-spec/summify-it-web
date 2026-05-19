import { NextResponse } from "next/server";
import { getOptionalUser, getProfile } from "@/lib/auth";
import { absoluteUrl } from "@/lib/seo";
import { getStripeServerClient } from "@/lib/stripe-server";

export async function POST() {
  const stripe = getStripeServerClient();
  if (!stripe) {
    return NextResponse.json({ success: false, error: "Stripe is not configured." }, { status: 503 });
  }

  const user = await getOptionalUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfile(user.id);
  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ success: false, error: "No Stripe customer found." }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: absoluteUrl("/account"),
  });

  return NextResponse.json({ success: true, url: session.url });
}
