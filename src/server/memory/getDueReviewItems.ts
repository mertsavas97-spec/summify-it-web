import { createClientIfConfigured } from "@/lib/supabase/server";
import type { ReviewItem } from "@/types/memory";

export async function getDueReviewItems(userId: string, limit = 24): Promise<ReviewItem[]> {
  const supabase = await createClientIfConfigured();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("review_items")
    .select("*")
    .eq("user_id", userId)
    .is("archived_at", null)
    .lte("next_review_at", new Date().toISOString())
    .order("next_review_at", { ascending: true })
    .limit(limit);

  if (error || !data) return [];
  return data as ReviewItem[];
}
