import Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPlanForStripePrice, isPaidSubscriptionStatus } from "@/lib/stripe-server";
import type { BillingInterval, PlanId } from "@/types/plan";

type SubscriptionLike = Stripe.Subscription & {
  current_period_end?: number;
};

function firstSubscriptionPriceId(subscription: Stripe.Subscription): string | null {
  return subscription.items.data[0]?.price.id ?? null;
}

function periodEndIso(subscription: SubscriptionLike): string | null {
  if (!subscription.current_period_end) return null;
  return new Date(subscription.current_period_end * 1000).toISOString();
}

function customerIdFromSubscription(subscription: Stripe.Subscription): string | null {
  return typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null;
}

export async function syncStripeSubscription(subscription: Stripe.Subscription) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase admin client is not configured. Set SUPABASE_SERVICE_ROLE_KEY.");
  }

  const customerId = customerIdFromSubscription(subscription);
  if (!customerId) throw new Error("Subscription is missing a Stripe customer.");

  const price = getPlanForStripePrice(firstSubscriptionPriceId(subscription));
  const status = subscription.status;
  const nextPlan: PlanId = price && isPaidSubscriptionStatus(status) ? price.plan : "free";
  const interval: BillingInterval | null = price?.interval ?? null;
  const userId = subscription.metadata?.userId;

  let query = supabase
    .from("profiles")
    .update({
      plan: nextPlan,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      subscription_status: status,
      current_period_end: periodEndIso(subscription as SubscriptionLike),
      billing_interval: interval,
      updated_at: new Date().toISOString(),
    });

  query = userId ? query.eq("id", userId) : query.eq("stripe_customer_id", customerId);

  const { error } = await query;

  if (error) throw new Error(error.message);
}

export async function syncCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase admin client is not configured. Set SUPABASE_SERVICE_ROLE_KEY.");
  }

  const userId = session.metadata?.userId;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

  if (!userId || !customerId) return;

  const { error } = await supabase
    .from("profiles")
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}

export async function markInvoicePayment(customerId: string, status: "succeeded" | "failed") {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;

  await supabase
    .from("profiles")
    .update({
      subscription_status: status === "succeeded" ? "active" : "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);
}
