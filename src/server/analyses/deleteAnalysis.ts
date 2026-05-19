import { createClientIfConfigured } from "@/lib/supabase/server";

/** Delete a saved analysis owned by the user. Returns false on failure. */
export async function deleteAnalysis(id: string, userId: string): Promise<boolean> {
  const supabase = await createClientIfConfigured();
  if (!supabase) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return false;

  const { error } = await supabase
    .from("saved_analyses")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  return !error;
}
