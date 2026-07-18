import { createClientIfConfigured } from "@/lib/supabase/server";
import type {
  PublicSharedAnalysis,
  SavedAnalysisMetadata,
  SavedAnalysisSummaryPayload,
} from "@/types/saved-analysis";
import type { LearnCardOutput } from "@/types/text-analysis";
import type { AudioStudyMetadata } from "@/types/audio-study";
import type { PodcastDiscussionMetadata } from "@/lib/podcast/podcast-types";

const PUBLIC_SHARE_SELECT =
  "share_id, title, source_kind, intelligence_mode, summary, learn_cards, shared_at, created_at, is_public, metadata";

function pickAudioStudy(metadata: SavedAnalysisMetadata | null): AudioStudyMetadata | null {
  const audio = metadata?.audioStudy;
  if (!audio?.script?.trim() || !audio.title?.trim()) return null;
  return audio;
}

function pickPodcast(
  metadata: SavedAnalysisMetadata | null,
): PodcastDiscussionMetadata | null {
  const podcast = metadata?.podcastDiscussion;
  if (!podcast?.script?.length || !podcast.title?.trim()) return null;
  return podcast;
}

/** Fetch a public shared analysis by share_id. Returns null if private or missing. */
export async function getPublicSharedAnalysis(
  shareId: string,
): Promise<PublicSharedAnalysis | null> {
  const supabase = await createClientIfConfigured();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("saved_analyses")
    .select(PUBLIC_SHARE_SELECT)
    .eq("share_id", shareId)
    .eq("is_public", true)
    .maybeSingle();

  if (error || !data || !data.share_id) return null;

  const metadata = (data.metadata ?? null) as SavedAnalysisMetadata | null;

  return {
    share_id: data.share_id,
    title: data.title ?? (data.summary as SavedAnalysisSummaryPayload)?.title ?? "Shared analysis",
    source_kind: data.source_kind,
    intelligence_mode: data.intelligence_mode,
    summary: data.summary as SavedAnalysisSummaryPayload,
    learn_cards: (data.learn_cards ?? []) as LearnCardOutput[],
    shared_at: data.shared_at,
    created_at: data.created_at,
    audioStudy: pickAudioStudy(metadata),
    podcastDiscussion: pickPodcast(metadata),
  };
}
