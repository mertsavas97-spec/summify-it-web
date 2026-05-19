import { NextResponse } from "next/server";
import { getOptionalUser, getProfile } from "@/lib/auth";
import { createClientIfConfigured } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/seo";
import { getCheckoutPriceConfig, getStripeServerClient } from "@/lib/stripe-server";

export async function POST(request: Request) {
  const stripe = getStripeServerClient();
  if (!stripe) {
    return NextResponse.json({ success: false, error: "Stripe is not configured." }, { status: 503 });
  }

  const user = await getOptionalUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    plan?: string;
    interval?: string;
  } | null;

  const price = getCheckoutPriceConfig(body?.plan ?? "", body?.interval ?? "");
  if (!price) {
    return NextResponse.json({ success: false, error: "Invalid billing plan." }, { status: 400 });
  }

  const profile = await getProfile(user.id);
  const supabase = await createClientIfConfigured();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Supabase is not configured." }, { status: 503 });
  }

  let customerId = profile?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? profile?.email ?? undefined,
      metadata: {
        userId: user.id,
      },
    });
    customerId = customer.id;
    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: price.priceId, quantity: 1 }],
    success_url: absoluteUrl("/billing/success?session_id={CHECKOUT_SESSION_ID}"),
    cancel_url: absoluteUrl("/billing/cancel"),
    allow_promotion_codes: true,
    client_reference_id: user.id,
    metadata: {
      userId: user.id,
      plan: price.plan,
      interval: price.interval,
    },
    subscription_data: {
      metadata: {
        userId: user.id,
        plan: price.plan,
        interval: price.interval,
      },
    },
  });

  return NextResponse.json({ success: true, url: session.url });
}
