import type { BillingCheckoutPlanId } from "@/types/billing";
import type { BillingInterval } from "@/types/plan";
import { PolarApiError, polarFetch } from "@/lib/billing/polar/client";
import {
  getPolarPriceId,
  getPolarProductId,
  polarEnvKey,
} from "@/lib/billing/polar/prices";

type PolarProduct = {
  id: string;
  prices?: Array<{ id?: string } | null> | null;
};

type PolarProductList = {
  items?: PolarProduct[];
  pagination?: { max_page?: number };
};

const productIdByPriceId = new Map<string, string>();

async function fetchProductById(productId: string): Promise<PolarProduct | null> {
  try {
    return await polarFetch<PolarProduct>(`/v1/products/${productId}`, { method: "GET" });
  } catch (error) {
    if (error instanceof PolarApiError && error.status === 404) return null;
    throw error;
  }
}

async function findProductIdByPriceId(priceId: string): Promise<string | null> {
  const cached = productIdByPriceId.get(priceId);
  if (cached) return cached;

  let page = 1;
  let maxPage = 1;

  while (page <= maxPage) {
    const list = await polarFetch<PolarProductList>(
      `/v1/products/?page=${page}&is_recurring=true&is_archived=false`,
      { method: "GET" },
    );

    for (const product of list.items ?? []) {
      for (const price of product.prices ?? []) {
        const id = price && typeof price === "object" ? price.id : null;
        if (id) productIdByPriceId.set(id, product.id);
      }
    }

    maxPage = list.pagination?.max_page ?? page;
    page += 1;
  }

  return productIdByPriceId.get(priceId) ?? null;
}

export type ResolvedPolarCatalog = {
  productId: string;
  priceId: string | null;
};

/**
 * Resolve Polar product ID for checkout (current API uses `products: [uuid]`).
 * Prefers POLAR_*_PRODUCT_ID; otherwise maps POLAR_*_PRICE_ID via catalog lookup.
 */
export async function resolvePolarProductForCheckout(
  planId: BillingCheckoutPlanId,
  interval: BillingInterval,
): Promise<ResolvedPolarCatalog> {
  const priceId = getPolarPriceId(planId, interval);
  const productEnvId = getPolarProductId(planId, interval);

  if (productEnvId) {
    const product = await fetchProductById(productEnvId);
    if (!product) {
      throw new Error(
        `${polarEnvKey(planId, interval, "PRODUCT_ID")} is not a valid product in this Polar environment.`,
      );
    }
    return { productId: product.id, priceId };
  }

  if (!priceId) {
    throw new Error("Checkout is not configured for this plan.");
  }

  const directProduct = await fetchProductById(priceId);
  if (directProduct) {
    return { productId: directProduct.id, priceId: null };
  }

  const fromCatalog = await findProductIdByPriceId(priceId);
  if (fromCatalog) {
    return { productId: fromCatalog, priceId };
  }

  throw new Error(
    `Could not resolve a Polar product for price ID ${priceId}. Set POLAR_*_PRODUCT_ID or verify the price exists in the current POLAR_MODE environment.`,
  );
}
