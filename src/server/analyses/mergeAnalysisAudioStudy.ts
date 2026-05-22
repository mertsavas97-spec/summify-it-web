import { createClientIfConfigured } from "@/lib/supabase/server";
import type { AudioStudyMetadata } from "@/types/audio-study";
import type { SavedAnalysisMetadata } from "@/types/saved-analysis";
import { getAnalysisById } from "./getAnalysisById";

export async function mergeAnalysisAudioStudy(
  analysisId: string,
  userId: string,
  audioStudy: AudioStudyMetadata,
): Promise<boolean> {
  const supabase = await createClientIfConfigured();
  if (!supabase) return false;

  const row = await getAnalysisById(analysisId, userId);
  if (!row) return false;

  const metadata: SavedAnalysisMetadata = {
    ...(row.metadata ?? {}),
    audioStudy,
  };

  const { error } = await supabase
    .from("saved_analyses")
    .update({ metadata })
    .eq("id", analysisId)
    .eq("user_id", userId);

  return !error;
}
