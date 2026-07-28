import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { createClientIfConfigured } from "@/lib/supabase/server";
import { devLog, devWarn } from "@/server/logging";
import type { SaveAnalysisInsertPayload } from "./buildSavePayload";

export type SaveAnalysisOptions = {
  maxSavedAnalyses?: number | null;
  /**
   * User id already verified by the caller (e.g. getOptionalUser in /api/analyze).
   * Enables a service-role insert fallback when the cookie/JWT client cannot write.
   */
  authVerifiedUserId?: string;
};

async function trimSavedAnalysesForUser(
  supabase: SupabaseClient,
  userId: string,
  maxSavedAnalyses: number,
): Promise<void> {
  if (maxSavedAnalyses < 1) return;

  const { data, error } = await supabase
    .from("saved_analyses")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(maxSavedAnalyses, 1000);

  if (error || !data?.length) {
    if (error) {
      devWarn("[summify.save] saved_analysis_trim_failed", {
        message: error.message,
        code: error.code,
      });
    }
    return;
  }

  const ids = data.map((item) => item.id);
  const { error: deleteError } = await supabase
    .from("saved_analyses")
    .delete()
    .in("id", ids)
    .eq("user_id", userId);

  if (deleteError) {
    devWarn("[summify.save] saved_analysis_trim_failed", {
      message: deleteError.message,
      code: deleteError.code,
    });
  }
}

function buildInsertRow(payload: SaveAnalysisInsertPayload, userId: string) {
  return {
    user_id: userId,
    title: payload.title,
    source_kind: payload.source_kind,
    intelligence_mode: payload.intelligence_mode,
    provider_used: payload.provider_used,
    document_type: payload.document_type,
    source_label: payload.source_label,
    summary: payload.summary,
    learn_cards: payload.learn_cards,
    metadata: payload.metadata,
  };
}

async function insertSavedAnalysis(
  supabase: SupabaseClient,
  payload: SaveAnalysisInsertPayload,
  userId: string,
  via: "user_session" | "service_role",
): Promise<string | null> {
  const { data, error } = await supabase
    .from("saved_analyses")
    .insert(buildInsertRow(payload, userId))
    .select("id")
    .single();

  if (error) {
    devWarn("[summify.save] saved_analysis_insert_failed", {
      via,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return null;
  }

  devLog("[summify.save] saved_analysis_insert_success", {
    via,
    id: data.id,
    userId,
  });
  return data.id;
}

/** Insert a saved analysis for the authenticated user. Never throws. */
export async function saveAnalysis(
  payload: SaveAnalysisInsertPayload,
  options: SaveAnalysisOptions = {},
): Promise<string | null> {
  try {
    const supabase = await createClientIfConfigured();
    if (!supabase) {
      // Cookie client unavailable — still try service-role when the caller verified auth.
      if (
        options.authVerifiedUserId &&
        options.authVerifiedUserId === payload.user_id &&
        isServiceRoleConfigured()
      ) {
        const admin = getSupabaseAdmin();
        const id = await insertSavedAnalysis(admin, payload, payload.user_id, "service_role");
        if (id && options.maxSavedAnalyses != null) {
          await trimSavedAnalysesForUser(admin, payload.user_id, options.maxSavedAnalyses);
        }
        return id;
      }

      devWarn("[summify.save] saved_analysis_insert_failed", {
        reason: "supabase_not_configured",
      });
      return null;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // Prefer getUser() (validated) over getSession().access_token — the latter is often
    // missing in App Router route handlers even when the user is authenticated.
    if (!user || user.id !== payload.user_id) {
      if (
        options.authVerifiedUserId &&
        options.authVerifiedUserId === payload.user_id &&
        isServiceRoleConfigured()
      ) {
        devWarn("[summify.save] falling_back_to_service_role", {
          reason: userError?.message ?? (user ? "session_user_mismatch" : "no_session_user"),
          userId: payload.user_id,
        });
        const admin = getSupabaseAdmin();
        const id = await insertSavedAnalysis(admin, payload, payload.user_id, "service_role");
        if (id && options.maxSavedAnalyses != null) {
          await trimSavedAnalysesForUser(admin, payload.user_id, options.maxSavedAnalyses);
        }
        return id;
      }

      devLog("[summify.save] saved_analysis_skipped_no_user", {
        reason: user ? "session_user_mismatch" : "no_session_user",
        message: userError?.message,
      });
      return null;
    }

    const sessionId = await insertSavedAnalysis(supabase, payload, user.id, "user_session");
    if (sessionId) {
      if (options.maxSavedAnalyses != null) {
        await trimSavedAnalysesForUser(supabase, user.id, options.maxSavedAnalyses);
      }
      return sessionId;
    }

    // Cookie client authenticated but insert failed (RLS/grants). Retry with service role.
    if (
      options.authVerifiedUserId === user.id &&
      isServiceRoleConfigured()
    ) {
      devWarn("[summify.save] falling_back_to_service_role", {
        reason: "user_session_insert_failed",
        userId: user.id,
      });
      const admin = getSupabaseAdmin();
      const id = await insertSavedAnalysis(admin, payload, user.id, "service_role");
      if (id && options.maxSavedAnalyses != null) {
        await trimSavedAnalysesForUser(admin, user.id, options.maxSavedAnalyses);
      }
      return id;
    }

    return null;
  } catch (err) {
    devWarn("[summify.save] saved_analysis_insert_failed", {
      message: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
