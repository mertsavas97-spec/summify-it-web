import { randomUUID } from "crypto";

export const ANON_SESSION_COOKIE = "summify_sid";

export function createAnonymousSessionId(): string {
  return randomUUID();
}

export function readAnonymousSessionId(cookieValue: string | undefined): string | null {
  const trimmed = cookieValue?.trim();
  if (!trimmed || trimmed.length < 8 || trimmed.length > 64) return null;
  return trimmed;
}
