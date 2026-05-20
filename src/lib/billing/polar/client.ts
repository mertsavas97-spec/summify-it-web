import { getPolarAccessToken, getPolarApiBaseUrl, getPolarServerMode } from "@/lib/billing/polar/config";
import {
  formatPolarErrorPayload,
  sandboxProductionMismatchHint,
} from "@/lib/billing/polar/errors";

export class PolarApiError extends Error {
  status: number;
  details: string[];

  constructor(message: string, status: number, details: string[] = []) {
    super(message);
    this.name = "PolarApiError";
    this.status = status;
    this.details = details;
  }
}

export type PolarFetchResult<T> = {
  data: T;
  status: number;
  raw: unknown;
};

export async function polarFetch<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const result = await polarFetchWithMeta<T>(path, options);
  return result.data;
}

export async function polarFetchWithMeta<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {},
): Promise<PolarFetchResult<T>> {
  const token = getPolarAccessToken();
  if (!token) {
    throw new PolarApiError("Polar access token is not configured.", 503);
  }

  const { json, headers, ...rest } = options;
  const url = `${getPolarApiBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...rest,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: json ? JSON.stringify(json) : rest.body,
  });

  const text = await res.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = { detail: text };
    }
  }

  if (!res.ok) {
    const { message, details } = formatPolarErrorPayload(payload, res.status);
    const mismatch = sandboxProductionMismatchHint(res.status, message);
    const fullMessage = mismatch ? `${message} ${mismatch}` : message;

    if (process.env.NODE_ENV === "development") {
      console.error("[summify.polar]", {
        mode: getPolarServerMode(),
        baseUrl: getPolarApiBaseUrl(),
        path,
        status: res.status,
        requestBody: json ?? null,
        responseBody: payload,
        message: fullMessage,
        details,
      });
    }

    throw new PolarApiError(fullMessage, res.status, details);
  }

  return { data: payload as T, status: res.status, raw: payload };
}
