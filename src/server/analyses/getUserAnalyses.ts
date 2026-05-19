import { createClientIfConfigured } from "@/lib/supabase/server";
import type { SavedAnalysisListItem } from "@/types/saved-analysis";

export async function getUserAnalyses(
  userId: string,
  limit = 20,
): Promise<SavedAnalysisListItem[]> {
  const supabase = await createClientIfConfigured();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("saved_analyses")
    .select(
      "id, title, source_kind, intelligence_mode, provider_used, document_type, source_label, summary, learn_cards, metadata, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as SavedAnalysisListItem[];
}
