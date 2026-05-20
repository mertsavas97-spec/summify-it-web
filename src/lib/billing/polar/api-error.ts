import { PolarApiError } from "@/lib/billing/polar/client";

/** Client-safe error string from checkout API JSON. */
export function readCheckoutApiError(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;

  const record = body as Record<string, unknown>;
  if (typeof record.error === "string" && record.error.trim()) {
    return record.error;
  }

  if (record.error && typeof record.error === "object") {
    const nested = record.error as Record<string, unknown>;
    if (typeof nested.message === "string" && nested.message.trim()) {
      return nested.message;
    }
    try {
      return JSON.stringify(record.error);
    } catch {
      /* fall through */
    }
  }

  if (Array.isArray(record.details)) {
    const lines = record.details.filter((line): line is string => typeof line === "string");
    if (lines.length > 0) {
      return lines.join("; ");
    }
  }

  return fallback;
}

export function polarErrorToResponse(error: unknown): {
  message: string;
  status: number;
  details?: string[];
} {
  if (error instanceof PolarApiError) {
    return {
      message: error.message,
      status: error.status,
      details: error.details.length > 0 ? error.details : undefined,
    };
  }

  if (error instanceof Error) {
    return { message: error.message, status: 500 };
  }

  return { message: "Checkout could not be started.", status: 500 };
}
