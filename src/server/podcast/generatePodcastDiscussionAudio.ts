import {
  buildPollyDataUrl,
  generatePollySpeech,
  getPollyEnvCheck,
  logPollyErrorFull,
} from "@/server/audio/polly";
import type {
  PodcastDiscussionAudio,
  PodcastDiscussionScript,
  PodcastDiscussionTurn,
} from "@/lib/podcast/podcast-types";

/**
 * Podcast voice configuration with environment variable support.
 * Fallback to Matthew (host) and Joanna (expert) if not configured.
 */
function getPodcastVoiceConfig(): { host: string; expert: string } {
  const hostVoice =
    process.env.SUMMIFY_PODCAST_HOST_VOICE_ID ??
    process.env.PODCAST_HOST_VOICE_ID ??
    "Matthew";
  const expertVoice =
    process.env.SUMMIFY_PODCAST_EXPERT_VOICE_ID ??
    process.env.PODCAST_EXPERT_VOICE_ID ??
    "Joanna";
  return { host: hostVoice, expert: expertVoice };
}
const CHUNK_CHAR_LIMIT = 5000;

type PodcastAudioChunk = {
  speaker: PodcastDiscussionTurn["speaker"];
  text: string;
};

function appendChunk(
  chunks: PodcastAudioChunk[],
  turn: PodcastDiscussionTurn,
): void {
  const previous = chunks[chunks.length - 1];
  const joined = previous ? `${previous.text}\n\n${turn.text}` : turn.text;
  if (
    previous &&
    previous.speaker === turn.speaker &&
    joined.length <= CHUNK_CHAR_LIMIT
  ) {
    previous.text = joined;
    return;
  }
  chunks.push({ speaker: turn.speaker, text: turn.text });
}

function splitLongTurn(turn: PodcastDiscussionTurn): PodcastDiscussionTurn[] {
  if (turn.text.length <= CHUNK_CHAR_LIMIT) return [turn];

  const turns: PodcastDiscussionTurn[] = [];
  let current = "";
  for (const sentence of turn.text.split(/(?<=[.!?])\s+/)) {
    if (sentence.length > CHUNK_CHAR_LIMIT) {
      if (current) {
        turns.push({ ...turn, text: current });
        current = "";
      }
      for (let offset = 0; offset < sentence.length; offset += CHUNK_CHAR_LIMIT) {
        turns.push({
          ...turn,
          text: sentence.slice(offset, offset + CHUNK_CHAR_LIMIT),
        });
      }
      continue;
    }
    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length <= CHUNK_CHAR_LIMIT) {
      current = next;
      continue;
    }
    if (current) turns.push({ ...turn, text: current });
    current = sentence;
  }
  if (current) turns.push({ ...turn, text: current });
  return turns;
}

function buildAudioChunks(script: PodcastDiscussionScript): PodcastAudioChunk[] {
  const chunks: PodcastAudioChunk[] = [];
  for (const turn of script.script) {
    for (const splitTurn of splitLongTurn(turn)) {
      appendChunk(chunks, splitTurn);
    }
  }
  return chunks;
}

const VOICE_CONFIG = getPodcastVoiceConfig();

function voiceForSpeaker(speaker: PodcastDiscussionTurn["speaker"]): string {
  return speaker === "host" ? VOICE_CONFIG.host : VOICE_CONFIG.expert;
}

/** Maximum number of audio chunks to generate (safety limit). */
const MAX_AUDIO_CHUNKS = 80;

/** Maximum total characters to synthesize (cost control). */
const MAX_TOTAL_CHARS = 25000;

export async function generatePodcastDiscussionAudio(
  podcast: PodcastDiscussionScript,
): Promise<PodcastDiscussionAudio> {
  const envCheck = getPollyEnvCheck();
  if (!envCheck.envConfigured) {
    throw new Error("Podcast audio is not configured right now.");
  }

  const audioChunks = buildAudioChunks(podcast);
  if (audioChunks.length === 0) {
    throw new Error("Podcast audio needs at least one dialogue turn.");
  }

  // Safety limits
  if (audioChunks.length > MAX_AUDIO_CHUNKS) {
    console.warn("[podcast] audio_chunks_exceeded", {
      chunkCount: audioChunks.length,
      maxChunks: MAX_AUDIO_CHUNKS,
      wordCount: podcast.totalWordCount,
    });
    // Trim to max chunks
    audioChunks.splice(MAX_AUDIO_CHUNKS);
  }

  const totalChars = audioChunks.reduce((sum, c) => sum + c.text.length, 0);
  if (totalChars > MAX_TOTAL_CHARS) {
    console.warn("[podcast] audio_chars_exceeded", {
      totalChars,
      maxChars: MAX_TOTAL_CHARS,
      chunkCount: audioChunks.length,
    });
  }

  try {
    const audioBuffers: Buffer[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const chunk of audioChunks) {
      try {
        const audio = await generatePollySpeech({
          text: chunk.text,
          voiceId: voiceForSpeaker(chunk.speaker),
        });
        audioBuffers.push(audio.audio);
        successCount++;
      } catch (chunkError) {
        // Log but continue with remaining chunks
        errorCount++;
        console.warn("[podcast] chunk_synthesis_failed", {
          speaker: chunk.speaker,
          textLength: chunk.text.length,
          error: chunkError instanceof Error ? chunkError.message : String(chunkError),
        });
      }
    }

    if (audioBuffers.length === 0) {
      throw new Error("All podcast audio chunks failed to synthesize.");
    }

    // Log partial failures if any
    if (errorCount > 0) {
      console.warn("[podcast] partial_synthesis_failure", {
        successCount,
        errorCount,
        totalChunks: audioChunks.length,
      });
    }

    const merged = Buffer.concat(audioBuffers);
    const audioBase64 = merged.toString("base64");
    const audioMime = "audio/mpeg";

    // Calculate actual audio duration from bytes (approx. 1 second per 22,000 bytes for MP3 at 22kHz)
    const actualAudioDurationSeconds = Math.round(merged.byteLength / 22000);
    console.info("[podcast] actual_audio_duration_seconds", {
      analysisId: podcast.analysisId ?? null, // Assuming analysisId is available in podcast object
      actualAudioDurationSeconds,
      byteLength: merged.byteLength,
    });

    return {
      audioBase64,
      audioMime,
      audioUrl: buildPollyDataUrl(audioBase64, audioMime),
      voices: [
        { speaker: "host", name: "Host", voiceId: VOICE_CONFIG.host },
        { speaker: "expert", name: "Expert", voiceId: VOICE_CONFIG.expert },
      ],
    };
  } catch (error) {
    logPollyErrorFull(error, {
      surface: "podcast_discussion",
      chunkCount: audioChunks.length,
      wordCount: podcast.totalWordCount,
      totalChars,
    });
    throw new Error("Podcast audio could not be generated right now.");
  }
}
