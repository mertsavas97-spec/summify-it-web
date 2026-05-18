import type {
  AnalysisMode,
  AnalysisPersona,
  CacheRecord,
} from "@/core/types";

type CheckCacheParams = {
  documentId: string;
  persona: AnalysisPersona;
  mode: AnalysisMode;
};

type CheckCacheResult = {
  hit: boolean;
  record: CacheRecord | null;
};

/** In-memory mock cache — replace with Redis / Supabase KV. */
const mockCacheStore = new Map<string, CacheRecord>();

function cacheKey(documentId: string, persona: AnalysisPersona, mode: AnalysisMode) {
  return `${documentId}:${persona}:${mode}`;
}

/**
 * Mock cache lookup for analysis results.
 */
export function checkCacheMock(params: CheckCacheParams): CheckCacheResult {
  const key = cacheKey(params.documentId, params.persona, params.mode);
  const record = mockCacheStore.get(key) ?? null;

  if (record && new Date(record.expiresAt) > new Date()) {
    return {
      hit: true,
      record: { ...record, hitCount: record.hitCount + 1 },
    };
  }

  return { hit: false, record: null };
}

/** Seeds mock cache entry (used by API skeleton). */
export function seedCacheMock(params: CheckCacheParams): CacheRecord {
  const key = cacheKey(params.documentId, params.persona, params.mode);
  const now = new Date();
  const record: CacheRecord = {
    key,
    documentId: params.documentId,
    persona: params.persona,
    mode: params.mode,
    hitCount: 0,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 86_400_000).toISOString(),
  };
  mockCacheStore.set(key, record);
  return record;
}
