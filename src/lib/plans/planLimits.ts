import type { PlanId } from "@/types/plan";
import { isPlanId } from "@/types/plan";

export type PlanLimits = {
  maxUploadMb: number;
  maxPages: number;
  maxCharacters: number;
  supportsChunkedAnalysis: boolean;
};

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    maxUploadMb: 20,
    maxPages: 50,
    maxCharacters: 80_000,
    supportsChunkedAnalysis: false,
  },
  beta: {
    maxUploadMb: 20,
    maxPages: 50,
    maxCharacters: 80_000,
    supportsChunkedAnalysis: false,
  },
  pro: {
    maxUploadMb: 20,
    maxPages: 150,
    maxCharacters: 250_000,
    supportsChunkedAnalysis: true,
  },
  scholar: {
    maxUploadMb: 20,
    maxPages: 150,
    maxCharacters: 250_000,
    supportsChunkedAnalysis: true,
  },
  team: {
    maxUploadMb: 20,
    maxPages: 200,
    maxCharacters: 300_000,
    supportsChunkedAnalysis: true,
  },
};

export function getPlanLimits(planId: string): PlanLimits {
  if (isPlanId(planId)) return PLAN_LIMITS[planId];
  return PLAN_LIMITS.free;
}

export function getMaxUploadBytes(planId: string): number {
  return getPlanLimits(planId).maxUploadMb * 1024 * 1024;
}

/** Per-chunk analysis budget when chunked mode is active (not full plan cap). */
export const CHUNKED_ANALYSIS_SEGMENT_CHARS = 24_000;
