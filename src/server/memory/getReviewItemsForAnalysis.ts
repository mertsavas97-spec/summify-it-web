import { createClientIfConfigured } from "@/lib/supabase/server";
import type { ReviewItem } from "@/types/memory";

/** Active practice cards scoped to one saved analysis (due-first ordering). */
export async function getReviewItemsForAnalysis(
  userId: string,
  analysisId: string,
  limit = 48,
): Promise<ReviewItem[]> {
  const supabase = await createClientIfConfigured();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("review_items")
    .select("*")
    .eq("user_id", userId)
    .eq("analysis_id", analysisId)
    .is("archived_at", null)
    .order("next_review_at", { ascending: true })
    .limit(limit);

  if (error || !data) return [];
  return data as ReviewItem[];
}

export async function countReviewItemsForAnalysis(
  userId: string,
  analysisId: string,
): Promise<number> {
  const supabase = await createClientIfConfigured();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("review_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("analysis_id", analysisId)
    .is("archived_at", null);

  if (error) return 0;
  return count ?? 0;
}
