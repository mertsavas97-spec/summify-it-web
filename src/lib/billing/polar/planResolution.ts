import type { BillingCheckoutPlanId } from "@/types/billing";
import type { BillingInterval } from "@/types/plan";
import { isBillingCheckoutPlan, isBillingInterval } from "@/lib/billing/planMapping";
import { getPolarPriceId, getPolarProductId } from "@/lib/billing/polar/prices";

export type ResolvedPolarPlan = {
  planId: BillingCheckoutPlanId;
  interval: BillingInterval;
  source: string;
};

type CatalogEntry = { planId: BillingCheckoutPlanId; interval: BillingInterval };

const PLANS: BillingCheckoutPlanId[] = ["scholar", "pro", "team"];
const INTERVALS: BillingInterval[] = ["monthly", "yearly"];

function buildCatalogById(): Map<string, CatalogEntry> {
  const map = new Map<string, CatalogEntry>();

  for (const planId of PLANS) {
    for (const interval of INTERVALS) {
      const priceId = getPolarPriceId(planId, interval);
      if (priceId) map.set(priceId, { planId, interval });

      const productId = getPolarProductId(planId, interval);
      if (productId) {
        map.set(productId, { planId, interval });
        // Test setups often set PRODUCT_ID and PRICE_ID to the same Polar product UUID.
      }
    }
  }

  return map;
}

let catalogById: Map<string, CatalogEntry> | null = null;

function getCatalog(): Map<string, CatalogEntry> {
  if (!catalogById) catalogById = buildCatalogById();
  return catalogById;
}

/** Reset catalog cache (tests). */
export function resetPolarPlanCatalogCache(): void {
  catalogById = null;
}

export function resolvePlanFromPolarCatalogId(
  catalogId: string | null | undefined,
): ResolvedPolarPlan | null {
  if (!catalogId) return null;
  const entry = getCatalog().get(catalogId.trim());
  if (!entry) return null;
  return {
    planId: entry.planId,
    interval: entry.interval,
    source: `catalog:${catalogId}`,
  };
}

export function resolvePlanFromMetadata(
  metadata: Record<string, unknown> | null,
): ResolvedPolarPlan | null {
  if (!metadata) return null;

  const planRaw = metadata.summify_plan ?? metadata.summifyPlan;
  const intervalRaw = metadata.summify_interval ?? metadata.summifyInterval;

  const planStr = typeof planRaw === "string" ? planRaw.trim() : null;
  const intervalStr = typeof intervalRaw === "string" ? intervalRaw.trim() : null;

  if (!planStr || !isBillingCheckoutPlan(planStr)) return null;

  const interval: BillingInterval =
    intervalStr && isBillingInterval(intervalStr) ? intervalStr : "monthly";

  return {
    planId: planStr,
    interval,
    source: "metadata",
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readString(obj: Record<string, unknown> | null, key: string): string | null {
  const v = obj?.[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/** Collect Polar product UUIDs from webhook payload. */
export function extractPolarProductIds(data: Record<string, unknown>): string[] {
  const ids = new Set<string>();

  const direct = readString(data, "product_id");
  if (direct) ids.add(direct);

  const product = asRecord(data.product);
  const nestedProductId = readString(product, "id");
  if (nestedProductId) ids.add(nestedProductId);

  const products = data.products;
  if (Array.isArray(products)) {
    for (const entry of products) {
      if (typeof entry === "string") ids.add(entry);
      const rec = asRecord(entry);
      const id = readString(rec, "id") ?? readString(rec, "product_id");
      if (id) ids.add(id);
    }
  }

  const items = data.items;
  if (Array.isArray(items)) {
    for (const entry of items) {
      const item = asRecord(entry);
      const itemProduct = asRecord(item?.product);
      const id =
        readString(item, "product_id") ??
        readString(itemProduct, "id") ??
        readString(asRecord(item?.price), "product_id");
      if (id) ids.add(id);
    }
  }

  const order = asRecord(data.order);
  if (order) {
    for (const id of extractPolarProductIds(order)) ids.add(id);
  }

  return [...ids];
}

/** Collect Polar price IDs from webhook payload. */
export function extractPolarPriceIds(data: Record<string, unknown>): string[] {
  const ids = new Set<string>();

  const push = (id: string | null) => {
    if (id) ids.add(id);
  };

  push(readString(data, "price_id"));
  push(readString(data, "product_price_id"));

  const price = asRecord(data.price);
  push(readString(price, "id"));

  const productPrice = asRecord(data.product_price);
  push(readString(productPrice, "id"));

  const metadata = asRecord(data.metadata);
  push(readString(metadata, "summify_price_id"));

  const items = data.items;
  if (Array.isArray(items)) {
    for (const entry of items) {
      const item = asRecord(entry);
      const itemPrice = asRecord(item?.price);
      push(
        readString(item, "price_id") ??
          readString(itemPrice, "id") ??
          readString(asRecord(item?.product_price), "id"),
      );
    }
  }

  return [...ids];
}

/**
 * Resolve Summify plan + interval from a Polar webhook/checkout payload.
 * Order: metadata → price IDs → product IDs (incl. test product via env PRODUCT_ID).
 */
export function resolvePlanFromPolarPayload(
  data: Record<string, unknown>,
): ResolvedPolarPlan | null {
  const metadata =
    asRecord(data.metadata) ??
    asRecord(asRecord(data.customer)?.metadata) ??
    asRecord(data.customer_metadata);

  const fromMeta = resolvePlanFromMetadata(metadata);
  if (fromMeta) return fromMeta;

  for (const priceId of extractPolarPriceIds(data)) {
    const resolved = resolvePlanFromPolarCatalogId(priceId);
    if (resolved) return resolved;
  }

  for (const productId of extractPolarProductIds(data)) {
    const resolved = resolvePlanFromPolarCatalogId(productId);
    if (resolved) return resolved;
  }

  return null;
}
