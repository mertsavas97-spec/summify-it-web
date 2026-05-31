import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { getOptionalUser } from "@/lib/auth";
import { DEFAULT_POLLY_VOICE_ID } from "@/lib/audio-study/pollyVoices";
import { buildPollyDataUrl, generatePollySpeech, getPollyEnvCheck } from "@/server/audio/polly";

export const runtime = "nodejs";

const PREVIEW_WORD_MIN = 80;
const PREVIEW_WORD_MAX = 120;
const COOKIE_PREFIX = "guest_audio_preview_v1_";
const COOKIE_TTL_SECONDS = 60 * 60 * 24;

type GuestPreviewBody = {
  previewScript?: string;
  analysisFingerprint?: string;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toWords(text: string): string[] {
  return text.split(/\s+/).map((w) => w.trim()).filter(Boolean);
}

function clampScriptToPreview(script: string): string {
  const words = toWords(script.replace(/\s+/g, " "));
  if (words.length <= PREVIEW_WORD_MAX) return words.join(" ");
  return words.slice(0, PREVIEW_WORD_MAX).join(" ");
}

function makeFingerprint(previewScript: string, provided?: string): string {
  const base = provided?.trim() || previewScript;
  return createHash("sha256").update(base).digest("hex").slice(0, 24);
}

export async function POST(request: Request) {
  const user = await getOptionalUser();
  if (user) {
    return NextResponse.json({ error: "authenticated_users_should_use_full_audio_route" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as GuestPreviewBody | null;
  const rawPreviewScript = normalizeText(body?.previewScript);
  if (!rawPreviewScript) {
    return NextResponse.json({ error: "preview_script_required" }, { status: 400 });
  }

  const trimmed = clampScriptToPreview(rawPreviewScript);
  const wordCount = toWords(trimmed).length;
  if (wordCount < PREVIEW_WORD_MIN) {
    return NextResponse.json({ error: "preview_script_too_short" }, { status: 400 });
  }

  const fingerprint = makeFingerprint(trimmed, normalizeText(body?.analysisFingerprint));
  const cookieName = `${COOKIE_PREFIX}${fingerprint}`;
  const cookieHeader = request.headers.get("cookie") ?? "";
  if (cookieHeader.includes(`${cookieName}=`)) {
    return NextResponse.json({ error: "preview_already_used_for_analysis" }, { status: 429 });
  }

  const env = getPollyEnvCheck();
  if (!env.envConfigured) {
    return NextResponse.json({ error: "audio_preview_unavailable" }, { status: 503 });
  }

  try {
    const polly = await generatePollySpeech({
      text: trimmed,
      voiceId: DEFAULT_POLLY_VOICE_ID,
      outputFormat: "mp3",
    });
    const audioBase64 = polly.audio.toString("base64");
    const audioMime = "audio/mpeg";

    const response = NextResponse.json({
      title: "30 Second Audio Preview",
      durationEstimate: "~30 sec",
      script: trimmed,
      wordCount,
      voiceId: DEFAULT_POLLY_VOICE_ID,
      audioMime,
      audioBase64,
      audioUrl: buildPollyDataUrl(audioBase64, audioMime),
      temporary: true,
    });

    response.cookies.set(cookieName, "1", {
      httpOnly: true,
      sameSite: "lax",
      maxAge: COOKIE_TTL_SECONDS,
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "audio_preview_unavailable" }, { status: 500 });
  }
}
