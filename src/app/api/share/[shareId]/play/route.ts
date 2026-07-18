import { NextResponse } from "next/server";
import { DEFAULT_POLLY_VOICE_ID, normalizePollyVoiceId } from "@/lib/audio-study/pollyVoices";
import {
  shareAudioPlayLimiter,
  shareAudioShareGlobalLimiter,
  sharePlayIpGlobalLimiter,
  sharePodcastPlayLimiter,
  sharePodcastShareGlobalLimiter,
} from "@/lib/rateLimit";
import { getPublicSharedAnalysis } from "@/server/analyses/getPublicSharedAnalysis";
import {
  buildPollyDataUrl,
  generatePollySpeech,
  getPollyEnvCheck,
} from "@/server/audio/polly";
import { generatePodcastDiscussionAudio } from "@/server/podcast/generatePodcastDiscussionAudio";
import type { PodcastDiscussionAudio } from "@/lib/podcast/podcast-types";

export const runtime = "nodejs";
export const maxDuration = 120;

const AUDIO_CHUNK_CHAR_LIMIT = 2800;
const MAX_PUBLIC_AUDIO_CHARS = 18000;
const PLAY_COOKIE_PREFIX = "share_play_v1_";
const PLAY_COOKIE_TTL_SECONDS = 60 * 60 * 24;

type PlayKind = "audio" | "podcast";

type PlayBody = {
  kind?: PlayKind;
};

type AudioPlayPayload = {
  success: true;
  kind: "audio";
  title: string;
  durationEstimate: string;
  voiceId: string;
  audioMime: string;
  audioBase64: string;
  audioUrl: string;
  clipped: boolean;
};

type PodcastPlayPayload = {
  success: true;
  kind: "podcast";
  title: string;
  estimatedDurationMinutes: number;
  audio: PodcastDiscussionAudio;
};

type PlayPayload = AudioPlayPayload | PodcastPlayPayload;

/** In-process dedupe so concurrent Play clicks share one Polly run. */
const inflightPlays = new Map<string, Promise<PlayPayload>>();

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function playCookieName(shareId: string, kind: PlayKind): string {
  return `${PLAY_COOKIE_PREFIX}${shareId}_${kind}`;
}

function hasPlayCookie(request: Request, shareId: string, kind: PlayKind): boolean {
  const cookieHeader = request.headers.get("cookie") ?? "";
  return cookieHeader.includes(`${playCookieName(shareId, kind)}=`);
}

function setPlayCookie(response: NextResponse, shareId: string, kind: PlayKind): void {
  response.cookies.set(playCookieName(shareId, kind), "1", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: PLAY_COOKIE_TTL_SECONDS,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

function chunkTextForPolly(text: string): string[] {
  if (text.length <= AUDIO_CHUNK_CHAR_LIMIT) return [text];

  const chunks: string[] = [];
  let current = "";
  const paragraphs = text.split(/\n\n+/);

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;
    const joined = current ? `${current}\n\n${trimmed}` : trimmed;
    if (joined.length <= AUDIO_CHUNK_CHAR_LIMIT) {
      current = joined;
      continue;
    }
    if (current) {
      chunks.push(current);
      current = "";
    }
    if (trimmed.length <= AUDIO_CHUNK_CHAR_LIMIT) {
      current = trimmed;
      continue;
    }
    for (let offset = 0; offset < trimmed.length; offset += AUDIO_CHUNK_CHAR_LIMIT) {
      chunks.push(trimmed.slice(offset, offset + AUDIO_CHUNK_CHAR_LIMIT));
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function synthesizeAudioLesson(script: string, voiceId: string) {
  const clipped =
    script.length > MAX_PUBLIC_AUDIO_CHARS
      ? script.slice(0, MAX_PUBLIC_AUDIO_CHARS)
      : script;
  const chunks = chunkTextForPolly(clipped);
  const buffers: Buffer[] = [];

  for (const chunk of chunks) {
    try {
      const result = await generatePollySpeech({ text: chunk, voiceId });
      buffers.push(result.audio);
    } catch {
      // skip failed chunk; continue if we have any audio
    }
  }

  if (buffers.length === 0) {
    throw new Error("audio_synthesis_failed");
  }

  const audioBase64 = Buffer.concat(buffers).toString("base64");
  const audioMime = "audio/mpeg";
  return {
    audioBase64,
    audioMime,
    audioUrl: buildPollyDataUrl(audioBase64, audioMime),
    clipped: clipped.length < script.length,
  };
}

function rateLimitedResponse(resetTime: number, reason: string) {
  return NextResponse.json(
    { error: "play_rate_limited", reason, resetTime },
    { status: 429 },
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ shareId: string }> },
) {
  const { shareId: rawShareId } = await context.params;
  const shareId = rawShareId?.trim() ?? "";
  if (!shareId || shareId.length > 80) {
    return NextResponse.json({ error: "share_id_required" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as PlayBody | null;
  const kind = body?.kind;
  if (kind !== "audio" && kind !== "podcast") {
    return NextResponse.json({ error: "kind_required" }, { status: 400 });
  }

  // Cheap existence check before burning Polly / rate-limit slots on junk IDs.
  const shared = await getPublicSharedAnalysis(shareId);
  if (!shared) {
    return NextResponse.json({ error: "share_not_found" }, { status: 404 });
  }

  if (kind === "audio" && !shared.audioStudy) {
    return NextResponse.json({ error: "audio_not_shared" }, { status: 404 });
  }
  if (kind === "podcast" && !shared.podcastDiscussion) {
    return NextResponse.json({ error: "podcast_not_shared" }, { status: 404 });
  }

  // One successful synth per browser per share+kind per day (blocks refresh loops).
  if (hasPlayCookie(request, shareId, kind)) {
    return NextResponse.json(
      {
        error: "play_already_used",
        message:
          "Audio for this share was already generated in this browser. Use Play again without refreshing, or try again tomorrow.",
      },
      { status: 429 },
    );
  }

  const ip = clientIp(request);
  const perVisitor = (kind === "audio" ? shareAudioPlayLimiter : sharePodcastPlayLimiter)(
    `${ip}:${shareId}:${kind}`,
  );
  if (!perVisitor.allowed) {
    return rateLimitedResponse(perVisitor.resetTime, "visitor_share_kind");
  }

  const perIp = sharePlayIpGlobalLimiter(`share-play-ip:${ip}`);
  if (!perIp.allowed) {
    return rateLimitedResponse(perIp.resetTime, "visitor_global");
  }

  const perShare = (kind === "audio"
    ? shareAudioShareGlobalLimiter
    : sharePodcastShareGlobalLimiter)(`share-play-share:${shareId}:${kind}`);
  if (!perShare.allowed) {
    return rateLimitedResponse(perShare.resetTime, "share_global");
  }

  const env = getPollyEnvCheck();
  if (!env.envConfigured) {
    return NextResponse.json({ error: "audio_unavailable" }, { status: 503 });
  }

  const inflightKey = `${shareId}:${kind}`;
  let work = inflightPlays.get(inflightKey);

  if (!work) {
    work = (async (): Promise<PlayPayload> => {
      if (kind === "audio") {
        const audioStudy = shared.audioStudy!;
        const voiceId = normalizePollyVoiceId(audioStudy.voice) || DEFAULT_POLLY_VOICE_ID;
        const audio = await synthesizeAudioLesson(audioStudy.script, voiceId);
        return {
          success: true,
          kind: "audio",
          title: audioStudy.title,
          durationEstimate: audioStudy.durationEstimate,
          voiceId,
          audioMime: audio.audioMime,
          audioBase64: audio.audioBase64,
          audioUrl: audio.audioUrl,
          clipped: audio.clipped,
        };
      }

      const podcast = shared.podcastDiscussion!;
      const audio = await generatePodcastDiscussionAudio(podcast);
      return {
        success: true,
        kind: "podcast",
        title: podcast.title,
        estimatedDurationMinutes: podcast.estimatedDurationMinutes,
        audio,
      };
    })().finally(() => {
      inflightPlays.delete(inflightKey);
    });

    inflightPlays.set(inflightKey, work);
  }

  try {
    const payload = await work;
    const response = NextResponse.json(payload);
    setPlayCookie(response, shareId, kind);
    return response;
  } catch (error) {
    console.error("[share.play] failed", {
      shareId,
      kind,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "play_failed" }, { status: 500 });
  }
}
