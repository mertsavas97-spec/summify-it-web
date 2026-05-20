type ValidationDetail = {
  loc?: (string | number)[];
  msg?: string;
  type?: string;
};

/** Turn Polar / FastAPI error payloads into a single readable string. */
export function formatPolarErrorDetail(detail: unknown): string {
  if (detail == null) return "";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const row = item as ValidationDetail;
          if (typeof row.msg === "string") {
            const loc =
              Array.isArray(row.loc) && row.loc.length > 0
                ? row.loc.map(String).join(".")
                : "";
            return loc ? `${loc}: ${row.msg}` : row.msg;
          }
        }
        try {
          return JSON.stringify(item);
        } catch {
          return String(item);
        }
      })
      .filter(Boolean);
    return parts.join("; ");
  }
  if (typeof detail === "object") {
    const record = detail as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (typeof record.error === "string") return record.error;
    try {
      return JSON.stringify(detail);
    } catch {
      return String(detail);
    }
  }
  return String(detail);
}

export function formatPolarErrorPayload(
  payload: unknown,
  status: number,
): { message: string; details: string[] } {
  if (!payload || typeof payload !== "object") {
    return {
      message: `Polar API error (${status})`,
      details: [],
    };
  }

  const record = payload as Record<string, unknown>;
  const detailText = formatPolarErrorDetail(record.detail);
  const message =
    detailText ||
    (typeof record.message === "string" ? record.message : "") ||
    (typeof record.error === "string" ? record.error : "") ||
    `Polar API error (${status})`;

  const details: string[] = [];
  if (Array.isArray(record.detail)) {
    for (const item of record.detail) {
      const line = formatPolarErrorDetail([item]);
      if (line) details.push(line);
    }
  }

  return { message, details };
}

export function sandboxProductionMismatchHint(status: number, message: string): string | null {
  if (status !== 404 && status !== 422) return null;
  const lower = message.toLowerCase();
  const looksLikeCatalog =
    lower.includes("product") ||
    lower.includes("price") ||
    lower.includes("not found") ||
    lower.includes("unknown");
  if (!looksLikeCatalog) return null;

  const mode = process.env.POLAR_MODE?.trim().toLowerCase() === "sandbox" ? "sandbox" : "production";
  const other = mode === "sandbox" ? "production" : "sandbox";
  return `Polar ${mode} API could not use this catalog ID. Confirm POLAR_*_PRODUCT_ID (or price IDs) belong to the ${mode} organization — not ${other}.`;
}
