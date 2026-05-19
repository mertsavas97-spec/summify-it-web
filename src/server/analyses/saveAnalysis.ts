import { createClientIfConfigured } from "@/lib/supabase/server";
import { devLog, devWarn } from "@/server/logging";
import type { SaveAnalysisInsertPayload } from "./buildSavePayload";

/** Insert a saved analysis for the authenticated user. Never throws. */
export async function saveAnalysis(
  payload: SaveAnalysisInsertPayload,
): Promise<string | null> {
  try {
    const supabase = await createClientIfConfigured();
    if (!supabase) {
      devWarn("[summify.save] saved_analysis_insert_failed", {
        reason: "supabase_not_configured",
      });
      return null;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!user || user.id !== payload.user_id || !session?.access_token) {
      devLog("[summify.save] saved_analysis_skipped_no_user", {
        reason: !session?.access_token
          ? "no_session_access_token"
          : user
            ? "session_user_mismatch"
            : "no_session_user",
      });
      return null;
    }

    const { data, error } = await supabase
      .from("saved_analyses")
      .insert({
        user_id: user.id,
        title: payload.title,
        source_kind: payload.source_kind,
        intelligence_mode: payload.intelligence_mode,
        provider_used: payload.provider_used,
        document_type: payload.document_type,
        source_label: payload.source_label,
        summary: payload.summary,
        learn_cards: payload.learn_cards,
        metadata: payload.metadata,
      })
      .select("id")
      .single();

    if (error) {
      devWarn("[summify.save] saved_analysis_insert_failed", {
        message: error.message,
        code: error.code,
      });
      return null;
    }

    devLog("[summify.save] saved_analysis_insert_success", {
      id: data.id,
      userId: user.id,
    });
    return data.id;
  } catch (err) {
    devWarn("[summify.save] saved_analysis_insert_failed", {
      message: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
