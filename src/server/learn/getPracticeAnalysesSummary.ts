import { createClientIfConfigured } from "@/lib/supabase/server";

export type PracticeAnalysisSummary = {
  analysisId: string;
  title: string;
  sourceLabel: string | null;
  cardCount: number;
  dueCount: number;
  createdAt: string;
};

/** Saved analyses that already have at least one active practice card. */
export async function getPracticeAnalysesSummary(
  userId: string,
  limit = 12,
): Promise<PracticeAnalysisSummary[]> {
  const supabase = await createClientIfConfigured();
  if (!supabase) return [];

  const { data: items, error: itemsError } = await supabase
    .from("review_items")
    .select("analysis_id, next_review_at")
    .eq("user_id", userId)
    .is("archived_at", null);

  if (itemsError || !items?.length) return [];

  const now = new Date().toISOString();
  const byAnalysis = new Map<string, { total: number; due: number }>();

  for (const row of items) {
    const id = row.analysis_id as string;
    if (!id) continue;
    const current = byAnalysis.get(id) ?? { total: 0, due: 0 };
    current.total += 1;
    if ((row.next_review_at as string) <= now) current.due += 1;
    byAnalysis.set(id, current);
  }

  const analysisIds = [...byAnalysis.keys()].slice(0, limit * 2);
  if (analysisIds.length === 0) return [];

  const { data: analyses, error: analysesError } = await supabase
    .from("saved_analyses")
    .select("id, title, source_label, summary, created_at")
    .eq("user_id", userId)
    .in("id", analysisIds);

  if (analysesError || !analyses) return [];

  const summaries: PracticeAnalysisSummary[] = analyses.map((row) => {
    const counts = byAnalysis.get(row.id as string) ?? { total: 0, due: 0 };
    const summary = row.summary as { title?: string } | null;
    return {
      analysisId: row.id as string,
      title: (row.title as string | null) ?? summary?.title ?? "Untitled analysis",
      sourceLabel: (row.source_label as string | null) ?? null,
      cardCount: counts.total,
      dueCount: counts.due,
      createdAt: row.created_at as string,
    };
  });

  return summaries
    .sort((a, b) => b.dueCount - a.dueCount || b.cardCount - a.cardCount)
    .slice(0, limit);
}
