import type { AudioStudyProvider } from "@/lib/audio-study/provider";
import type { PollyVoiceId } from "@/lib/audio-study/pollyVoices";
import type { AudioStudyMetadata } from "@/types/audio-study";

const PREFIX = "summify_audio_study_";

export type AudioStudyPlaybackMode = "polly" | "browser";

export type ClientAudioStudyCache = {
  lesson: AudioStudyMetadata;
  voiceId: PollyVoiceId | "browser";
  playback: AudioStudyPlaybackMode;
  provider?: AudioStudyProvider;
  fallback?: boolean;
  audioUrl?: string;
  audioBase64?: string;
  audioMime?: string;
};

export function audioStudyCacheKey(analysisId: string, voiceId: string): string {
  return `${PREFIX}${analysisId}_${voiceId}`;
}

export function loadAudioStudyCache(
  analysisId: string,
  voiceId: string,
): ClientAudioStudyCache | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(audioStudyCacheKey(analysisId, voiceId));
    if (!raw) return null;
    return JSON.parse(raw) as ClientAudioStudyCache;
  } catch {
    return null;
  }
}

export function saveAudioStudyCache(
  analysisId: string,
  entry: ClientAudioStudyCache,
): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(
      audioStudyCacheKey(analysisId, entry.voiceId),
      JSON.stringify(entry),
    );
  } catch {
    /* quota — ignore */
  }
}

export function clearAudioStudyCache(analysisId: string, voiceId: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(audioStudyCacheKey(analysisId, voiceId));
}

export function clearAllAudioStudyCaches(analysisId: string): void {
  if (typeof sessionStorage === "undefined") return;
  const prefix = `${PREFIX}${analysisId}_`;
  const keysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i);
    if (key?.startsWith(prefix)) keysToRemove.push(key);
  }
  keysToRemove.forEach((k) => sessionStorage.removeItem(k));
}

/** @deprecated Use loadAudioStudyCache */
export function loadAudioStudyScriptCache(analysisId: string): AudioStudyMetadata | null {
  return loadAudioStudyCache(analysisId, "Matthew")?.lesson ?? null;
}

/** @deprecated Use saveAudioStudyCache */
export function saveAudioStudyScriptCache(
  analysisId: string,
  script: AudioStudyMetadata,
): void {
  saveAudioStudyCache(analysisId, {
    lesson: script,
    voiceId: script.voice as PollyVoiceId,
    playback: "browser",
  });
}

/** @deprecated Use clearAudioStudyCache */
export function clearAudioStudyScriptCache(analysisId: string): void {
  clearAllAudioStudyCaches(analysisId);
}
