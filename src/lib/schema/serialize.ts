import type { JsonLdObject } from "@/lib/schema/types";

/** Remove undefined/null keys and empty arrays for valid JSON-LD output. */
export function compactJsonLd<T extends JsonLdObject>(value: T): T {
  const result: JsonLdObject = {};

  for (const [key, raw] of Object.entries(value)) {
    if (raw === undefined || raw === null) continue;

    if (Array.isArray(raw)) {
      const items = raw
        .map((item) =>
          typeof item === "object" && item !== null
            ? compactJsonLd(item as JsonLdObject)
            : item,
        )
        .filter((item) => item !== undefined && item !== null);
      if (items.length === 0) continue;
      result[key] = items;
      continue;
    }

    if (typeof raw === "object") {
      const nested = compactJsonLd(raw as JsonLdObject);
      if (Object.keys(nested).length === 0) continue;
      result[key] = nested;
      continue;
    }

    result[key] = raw;
  }

  return result as T;
}
