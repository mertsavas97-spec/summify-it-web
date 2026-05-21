import { createClientIfConfigured } from "@/lib/supabase/server";
import { generateReviewItemsFromAnalysis } from "@/lib/memory/generateReviewItems";
import { getPracticeCardAccessForPlan } from "@/lib/learn/practiceCardAccess";
import { getMemoryPlanLimits, resolvePlanId } from "@/lib/plan-limits";
import { DEFAULT_PAID_PREVIEW_PLAN } from "@/types/plan";
import type { PracticeRetentionHint } from "@/lib/learn/retentionTypes";
import type { ReviewItemInsert } from "@/types/memory";
import type { SavedAnalysisRow } from "@/types/saved-analysis";

type GenerateReviewSetResult = {
  success: boolean;
  created: number;
  skipped: number;
  totalActive: number;
  limit: number | null;
  error?: string;
};

export async function generateReviewSetForAnalysis(input: {
  analysisId: string;
  userId: string;
  plan?: string | null;
  retentionHint?: PracticeRetentionHint | null;
}): Promise<GenerateReviewSetResult> {
  const supabase = await createClientIfConfigured();
  if (!supabase) {
    return { success: false, created: 0, skipped: 0, totalActive: 0, limit: null, error: "Supabase is not configured." };
  }

  const { data: analysis, error: analysisError } = await supabase
    .from("saved_analyses")
    .select("id, user_id, summary, learn_cards, intelligence_mode, document_type")
    .eq("id", input.analysisId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (analysisError || !analysis) {
    return { success: false, created: 0, skipped: 0, totalActive: 0, limit: null, error: "Saved analysis not found." };
  }

  const planLimits = getMemoryPlanLimits(input.plan ?? DEFAULT_PAID_PREVIEW_PLAN);
  const { count } = await supabase
    .from("review_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", input.userId)
    .is("archived_at", null);

  const totalActive = count ?? 0;
  const remaining =
    planLimits.maxReviewItems == null
      ? Number.POSITIVE_INFINITY
      : Math.max(0, planLimits.maxReviewItems - totalActive);

  if (remaining <= 0) {
    return {
      success: true,
      created: 0,
      skipped: 0,
      totalActive,
      limit: planLimits.maxReviewItems,
    };
  }

  const saved = analysis as Pick<
    SavedAnalysisRow,
    "id" | "user_id" | "summary" | "learn_cards" | "intelligence_mode" | "document_type"
  >;
  const planId = resolvePlanId(input.plan ?? DEFAULT_PAID_PREVIEW_PLAN);
  const learnAccess = getPracticeCardAccessForPlan(planId, saved.learn_cards ?? []);

  const generated = generateReviewItemsFromAnalysis({
    summary: saved.summary,
    learnCards: learnAccess.accessibleCards,
    maxItems: Math.min(16, remaining),
    intelligenceModeId: saved.intelligence_mode,
    documentDomain: saved.document_type,
    retentionHint: input.retentionHint,
  });

  const now = new Date().toISOString();
  const rows: ReviewItemInsert[] = generated.map((item) => ({
    user_id: input.userId,
    analysis_id: input.analysisId,
    source_kind: item.source_kind,
    source_id: item.source_id,
    prompt: item.prompt,
    answer: item.answer,
    context: item.context,
    difficulty: "new",
    retention_score: 0.6,
    ease_factor: 2.3,
    interval_days: 0,
    stability_days: 1,
    next_review_at: now,
  }));

  if (rows.length === 0) {
    return {
      success: true,
      created: 0,
      skipped: 0,
      totalActive,
      limit: planLimits.maxReviewItems,
    };
  }

  const { data: inserted, error } = await supabase
    .from("review_items")
    .upsert(rows, {
      onConflict: "user_id,analysis_id,source_kind,source_id",
      ignoreDuplicates: true,
    })
    .select("id");

  if (error) {
    return {
      success: false,
      created: 0,
      skipped: 0,
      totalActive,
      limit: planLimits.maxReviewItems,
      error: error.message,
    };
  }

  const created = inserted?.length ?? 0;
  return {
    success: true,
    created,
    skipped: Math.max(0, rows.length - created),
    totalActive: totalActive + created,
    limit: planLimits.maxReviewItems,
  };
}
