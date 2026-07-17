import { getAppOrigin } from "@/lib/app-origin";
import { siteConfig } from "@/lib/site";
import type { BillingCheckoutPlanId } from "@/types/billing";
import type { BillingInterval } from "@/types/plan";
import { polarFetchWithMeta } from "@/lib/billing/polar/client";
import { getPolarServerMode } from "@/lib/billing/polar/config";
import { getPolarPriceId } from "@/lib/billing/polar/prices";
import { resolvePolarProductForCheckout } from "@/lib/billing/polar/products";

type PolarCheckoutResponse = {
  id: string;
  url: string;
};

type CreatePolarCheckoutInput = {
  userId: string;
  email: string | null;
  planId: BillingCheckoutPlanId;
  interval: BillingInterval;
  /** Pass the request origin in API routes so localhost never uses production URLs. */
  requestOrigin?: string;
};

export type PolarCheckoutDebugContext = {
  mode: ReturnType<typeof getPolarServerMode>;
  apiBaseUrl: string;
  planId: BillingCheckoutPlanId;
  interval: BillingInterval;
  productId: string;
  priceId: string | null;
  payload: Record<string, unknown>;
};

export async function createPolarCheckout(
  input: CreatePolarCheckoutInput,
): Promise<{ checkoutId: string; url: string; debug?: PolarCheckoutDebugContext }> {
  const catalog = await resolvePolarProductForCheckout(input.planId, input.interval);
  const priceId = catalog.priceId ?? getPolarPriceId(input.planId, input.interval);

  const baseUrl = getAppOrigin(input.requestOrigin ?? siteConfig.url).replace(/\/$/, "");
  const successUrl = `${baseUrl}/billing/success?checkout_id={CHECKOUT_ID}`;
  const returnUrl = `${baseUrl}/pricing`;

  const body: Record<string, unknown> = {
    products: [catalog.productId],
    external_customer_id: input.userId,
    success_url: successUrl,
    return_url: returnUrl,
    metadata: {
      summify_user_id: input.userId,
      summify_plan: input.planId,
      summify_interval: input.interval,
      ...(priceId ? { summify_price_id: priceId } : {}),
    },
    customer_metadata: {
      summify_user_id: input.userId,
    },
  };

  if (input.email) {
    body.customer_email = input.email;
  }

  const mode = getPolarServerMode();
  const apiBaseUrl =
    mode === "sandbox" ? "https://sandbox-api.polar.sh" : "https://api.polar.sh";

  const debug: PolarCheckoutDebugContext = {
    mode,
    apiBaseUrl,
    planId: input.planId,
    interval: input.interval,
    productId: catalog.productId,
    priceId,
    payload: body,
  };

  if (process.env.NODE_ENV === "development") {
    console.info("[summify.polar] create checkout request", debug);
  }

  const { data: checkout, status, raw } = await polarFetchWithMeta<PolarCheckoutResponse>(
    "/v1/checkouts/",
    {
      method: "POST",
      json: body,
    },
  );

  if (process.env.NODE_ENV === "development") {
    console.info("[summify.polar] create checkout response", {
      status,
      checkoutId: checkout.id,
      hasUrl: Boolean(checkout.url),
      responseBody: raw,
    });
  }

  if (!checkout.url) {
    throw new Error("Polar did not return a checkout URL.");
  }

  return {
    checkoutId: checkout.id,
    url: checkout.url,
    ...(process.env.NODE_ENV === "development" ? { debug } : {}),
  };
}
