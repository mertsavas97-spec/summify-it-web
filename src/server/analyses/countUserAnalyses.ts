import { createClientIfConfigured } from "@/lib/supabase/server";

export async function countUserAnalyses(userId: string): Promise<number> {
  const supabase = await createClientIfConfigured();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("saved_analyses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error || count == null) return 0;
  return count;
}
