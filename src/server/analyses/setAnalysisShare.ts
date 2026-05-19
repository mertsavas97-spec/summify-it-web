import { createClientIfConfigured } from "@/lib/supabase/server";

export type SetAnalysisShareResult =
  | {
      success: true;
      isPublic: boolean;
      shareId: string | null;
      sharedAt: string | null;
    }
  | { success: false; error: string };

/** Enable or disable public sharing for an analysis owned by `userId`. */
export async function setAnalysisShare(
  analysisId: string,
  userId: string,
  enabled: boolean,
): Promise<SetAnalysisShareResult> {
  const supabase = await createClientIfConfigured();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    return { success: false, error: "Unauthorized" };
  }

  if (enabled) {
    const { data: existing } = await supabase
      .from("saved_analyses")
      .select("is_public, share_id, shared_at")
      .eq("id", analysisId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing?.is_public && existing.share_id) {
      return {
        success: true,
        isPublic: true,
        shareId: existing.share_id,
        sharedAt: existing.shared_at,
      };
    }

    const shareId = crypto.randomUUID();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("saved_analyses")
      .update({
        is_public: true,
        share_id: shareId,
        shared_at: now,
        updated_at: now,
      })
      .eq("id", analysisId)
      .eq("user_id", userId)
      .select("is_public, share_id, shared_at")
      .single();

    if (error || !data) {
      return { success: false, error: error?.message ?? "Failed to enable sharing" };
    }

    return {
      success: true,
      isPublic: data.is_public,
      shareId: data.share_id,
      sharedAt: data.shared_at,
    };
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("saved_analyses")
    .update({
      is_public: false,
      share_id: null,
      shared_at: null,
      updated_at: now,
    })
    .eq("id", analysisId)
    .eq("user_id", userId)
    .select("is_public, share_id, shared_at")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Failed to disable sharing" };
  }

  return {
    success: true,
    isPublic: data.is_public,
    shareId: data.share_id,
    sharedAt: data.shared_at,
  };
}
