import type { AnalysisResult } from "@/types/text-analysis";
import type { AnalysisIntelligenceMetadata } from "@/types/intelligence";

const GHOST_SESSION_STORAGE_KEY = "summify:ghost-session:v1";
const GHOST_SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const GHOST_SESSION_CLAIM_IN_FLIGHT_KEY = "summify:ghost-session:claim-in-flight:v1";

export type GhostSessionPayload = {
  analysisResult: AnalysisResult;
  providerUsed: string;
  fallbackUsed: boolean;
  intelligenceMetadata: AnalysisIntelligenceMetadata;
  timestamp: number;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function clearGhostSession(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(GHOST_SESSION_STORAGE_KEY);
}

export function saveGhostSession(
  payload: Omit<GhostSessionPayload, "timestamp">,
): void {
  if (!isBrowser()) return;

  const data: GhostSessionPayload = {
    ...payload,
    timestamp: Date.now(),
  };

  window.localStorage.setItem(GHOST_SESSION_STORAGE_KEY, JSON.stringify(data));
}

export function readGhostSession(): GhostSessionPayload | null {
  if (!isBrowser()) return null;

  const raw = window.localStorage.getItem(GHOST_SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as GhostSessionPayload;
    if (!parsed || typeof parsed.timestamp !== "number") {
      window.localStorage.removeItem(GHOST_SESSION_STORAGE_KEY);
      return null;
    }

    const expired = Date.now() - parsed.timestamp > GHOST_SESSION_MAX_AGE_MS;
    if (expired) {
      window.localStorage.removeItem(GHOST_SESSION_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    clearGhostSession();
    return null;
  }
}

export async function claimGhostSession(): Promise<string | null> {
  if (!isBrowser()) return null;

  const ghost = readGhostSession();
  if (!ghost) return null;

  if (window.sessionStorage.getItem(GHOST_SESSION_CLAIM_IN_FLIGHT_KEY) === "1") {
    return null;
  }

  window.sessionStorage.setItem(GHOST_SESSION_CLAIM_IN_FLIGHT_KEY, "1");

  try {
    const response = await fetch("/api/claim-guest-analysis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ghost),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { success?: boolean; savedAnalysisId?: string };
    if (!data?.success || !data.savedAnalysisId) {
      return null;
    }

    clearGhostSession();
    return data.savedAnalysisId;
  } catch {
    return null;
  } finally {
    window.sessionStorage.removeItem(GHOST_SESSION_CLAIM_IN_FLIGHT_KEY);
  }
}