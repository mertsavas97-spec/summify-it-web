import { createClientIfConfigured } from "@/lib/supabase/server";
import type { SavedAnalysisRow } from "@/types/saved-analysis";

export async function getAnalysisById(
  id: string,
  userId: string,
): Promise<SavedAnalysisRow | null> {
  const supabase = await createClientIfConfigured();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("saved_analyses")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as SavedAnalysisRow;
  return {
    ...row,
    is_public: row.is_public ?? false,
    share_id: row.share_id ?? null,
    shared_at: row.shared_at ?? null,
  };
}
