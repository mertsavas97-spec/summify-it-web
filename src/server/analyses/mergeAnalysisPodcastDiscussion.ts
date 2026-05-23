import { createClientIfConfigured } from "@/lib/supabase/server";
import type { PodcastDiscussionMetadata } from "@/lib/podcast/podcast-types";
import type { SavedAnalysisMetadata } from "@/types/saved-analysis";
import { getAnalysisById } from "./getAnalysisById";

export async function mergeAnalysisPodcastDiscussion(
  analysisId: string,
  userId: string,
  podcastDiscussion: PodcastDiscussionMetadata,
): Promise<boolean> {
  const supabase = await createClientIfConfigured();
  if (!supabase) return false;

  const row = await getAnalysisById(analysisId, userId);
  if (!row) return false;

  const metadata: SavedAnalysisMetadata = {
    ...(row.metadata ?? {}),
    podcastDiscussion,
  };

  const { error } = await supabase
    .from("saved_analyses")
    .update({ metadata })
    .eq("id", analysisId)
    .eq("user_id", userId);

  return !error;
}
