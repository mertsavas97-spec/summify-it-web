import type { LearnCardMemoryAnchor, LearnSourceTrace } from "@/types/adaptive-learn";

export type ParsedPracticeContext = {
  label: string;
  trace?: LearnSourceTrace;
  memoryAnchor?: LearnCardMemoryAnchor;
};

/** Decode practice review `context` field (may embed source trace JSON). */
export function parsePracticeReviewContext(context: string | null | undefined): ParsedPracticeContext {
  const raw = (context ?? "").trim();
  if (!raw.startsWith("{")) return { label: raw || "Practice" };
  try {
    const parsed = JSON.parse(raw) as {
      v?: number;
      label?: string;
      trace?: LearnSourceTrace;
      memoryAnchor?: LearnCardMemoryAnchor;
    };
    if (parsed?.v === 1 && parsed.label) {
      return {
        label: parsed.label,
        trace: parsed.trace,
        memoryAnchor: parsed.memoryAnchor,
      };
    }
  } catch {
    /* plain text */
  }
  return { label: raw };
}
