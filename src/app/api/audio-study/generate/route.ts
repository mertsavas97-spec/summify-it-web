import { NextResponse } from "next/server";
import { getOptionalUser, getProfile } from "@/lib/auth";
import {
  canUseAudioStudyMode,
  getAudioStudyScriptLimits,
} from "@/lib/audio-study/access";
import { normalizePollyVoiceId } from "@/lib/audio-study/pollyVoices";
import {
  hasActivePaidEntitlement,
  resolveEntitlementPlanIdFromProfile,
} from "@/lib/billing/entitlements";
import { trackProductEvent } from "@/server/usage/trackProductEvent";
import {
  buildPollyDataUrl,
  generatePollySpeech,
  getPollyEnvCheck,
  logPollyErrorFull,
} from "@/server/audio/polly";
import {
  AUDIO_STUDY_PROVIDER_BROWSER,
  AUDIO_STUDY_PROVIDER_POLLY,
} from "@/lib/audio-study/provider";
import { getAnalysisById } from "@/server/analyses/getAnalysisById";
import { mergeAnalysisAudioStudy } from "@/server/analyses/mergeAnalysisAudioStudy";
import { generateAudioStudyScript } from "@/server/audio-study/generateAudioStudyScript";
import type { AudioStudyAnalysisInput, AudioStudyMetadata } from "@/types/audio-study";
import type { AnalysisResult } from "@/types/text-analysis";

type GenerateBody = {
  analysisId?: string;
  analysisPayload?: Partial<AnalysisResult> & AudioStudyAnalysisInput;
  regenerate?: boolean;
  voiceId?: string;
  synthesizeOnly?: boolean;
  /** When re-synthesizing audio for an existing lesson (e.g. voice change). */
  script?: string;
  title?: string;
  durationEstimate?: string;
  sections?: AudioStudyMetadata["sections"];
};

function buildInputFromRow(
  row: Awaited<ReturnType<typeof getAnalysisById>>,
): AudioStudyAnalysisInput | null {
  if (!row?.summary) return null;
  return {
    title: row.summary.title ?? row.title ?? "Analysis",
    summary: row.summary.summary,
    keyInsights: row.summary.keyInsights ?? [],
    risksOrWarnings: row.summary.risksOrWarnings ?? [],
    actionItems: row.summary.actionItems ?? [],
    learnCards: (row.learn_cards ?? []).map((c) => ({
      title: c.title,
      type: c.type,
      content: c.content,
    })),
    sourceType: row.source_kind,
    intelligenceMode: row.intelligence_mode,
    sourceLabel: row.source_label,
  };
}

function buildInputFromPayload(
  payload: GenerateBody["analysisPayload"],
): AudioStudyAnalysisInput | null {
  if (!payload?.summary) return null;
  return {
    title: payload.title ?? "Analysis",
    summary: payload.summary,
    keyInsights: payload.keyInsights ?? [],
    risksOrWarnings: payload.risksOrWarnings ?? [],
    actionItems: payload.actionItems ?? [],
    learnCards: (payload.learnCards ?? []).map((c) => ({
      title: c.title,
      type: c.type,
      content: c.content,
    })),
    quizThemes: payload.quizThemes,
    sourceType: payload.sourceType,
    intelligenceMode: payload.intelligenceMode,
    sourceLabel: payload.sourceLabel,
  };
}

type PollyAudioPayload = {
  audioBase64: string;
  audioMime: string;
  audioUrl: string;
  provider: typeof AUDIO_STUDY_PROVIDER_POLLY;
  fallback: false;
};

async function synthesizeWithPolly(
  scriptText: string,
  voiceId: string,
): Promise<PollyAudioPayload | null> {
  const envCheck = getPollyEnvCheck();
  if (!envCheck.envConfigured) {
    console.warn("[audio-study] polly_skipped", { reason: "env_not_configured" });
    return null;
  }

  try {
    const result = await generatePollySpeech({ text: scriptText, voiceId });
    const audioBase64 = result.audio.toString("base64");
    const audioMime = result.contentType;
    return {
      audioBase64,
      audioMime,
      audioUrl: buildPollyDataUrl(audioBase64, audioMime),
      provider: AUDIO_STUDY_PROVIDER_POLLY,
      fallback: false,
    };
  } catch (err) {
    logPollyErrorFull(err, { voiceId, scriptChars: scriptText.length });
    return null;
  }
}

export async function POST(request: Request) {
  const user = await getOptionalUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to generate audio lessons." }, { status: 401 });
  }

  const profile = await getProfile(user.id);
  const planId = resolveEntitlementPlanIdFromProfile(profile);

  if (!canUseAudioStudyMode(planId, hasActivePaidEntitlement(profile ?? undefined))) {
    return NextResponse.json(
      { error: "Audio Study Mode is available on Pro, Scholar, and Team plans." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as GenerateBody | null;
  const regenerate = Boolean(body?.regenerate);
  const synthesizeOnly = Boolean(body?.synthesizeOnly);
  const voiceId = normalizePollyVoiceId(body?.voiceId);

  let analysisInput: AudioStudyAnalysisInput | null = null;
  let cachedMeta: AudioStudyMetadata | undefined;

  if (body?.analysisId && body.analysisId !== "live-analysis") {
    const row = await getAnalysisById(body.analysisId, user.id);
    if (!row) {
      return NextResponse.json({ error: "Analysis not found." }, { status: 404 });
    }
    analysisInput = buildInputFromRow(row);
    cachedMeta = row.metadata?.audioStudy;
  }

  if (!analysisInput && body?.analysisPayload) {
    analysisInput = buildInputFromPayload(body.analysisPayload);
  }

  if (!analysisInput) {
    return NextResponse.json({ error: "Analysis content is required." }, { status: 400 });
  }

  const limits = getAudioStudyScriptLimits(planId);
  const inlineScript = body?.script?.trim();
  const hadCachedScript =
    !regenerate &&
    Boolean(
      (inlineScript && inlineScript.length > 0) ||
        (cachedMeta?.script && cachedMeta.script.length > 0),
    );

  try {
    let scriptBundle: AudioStudyMetadata;

    if (synthesizeOnly && inlineScript) {
      scriptBundle = {
        title: body?.title ?? cachedMeta?.title ?? "Lesson",
        durationEstimate:
          body?.durationEstimate ?? cachedMeta?.durationEstimate ?? "A few minutes",
        script: inlineScript,
        sections: body?.sections ?? cachedMeta?.sections ?? [],
        voice: voiceId,
        generatedAt: cachedMeta?.generatedAt ?? new Date().toISOString(),
      };
    } else if (hadCachedScript && cachedMeta && !regenerate) {
      scriptBundle = { ...cachedMeta, voice: voiceId };
    } else {
      const generated = await generateAudioStudyScript(analysisInput, limits);
      scriptBundle = {
        ...generated,
        voice: voiceId,
        generatedAt: new Date().toISOString(),
      };
      if (body?.analysisId && body.analysisId !== "live-analysis") {
        await mergeAnalysisAudioStudy(body.analysisId, user.id, scriptBundle);
      }
    }

    const pollyAudio = await synthesizeWithPolly(scriptBundle.script, voiceId);
    const usePolly = pollyAudio !== null;
    const provider = usePolly ? AUDIO_STUDY_PROVIDER_POLLY : AUDIO_STUDY_PROVIDER_BROWSER;
    const playback = usePolly ? "polly" : "browser";

    await trackProductEvent({
      eventType: "audio_study_script_generated",
      userId: user.id,
      sourceType: analysisInput.sourceType ?? null,
      intelligenceMode: analysisInput.intelligenceMode ?? null,
      plan: planId,
      metadata: {
        analysis_id: body?.analysisId ?? null,
        cached: hadCachedScript,
        playback,
        provider,
        voice_id: voiceId,
        polly: usePolly,
        fallback: !usePolly,
      },
      insertViaServiceRole: true,
    });

    return NextResponse.json({
      title: scriptBundle.title,
      durationEstimate: scriptBundle.durationEstimate,
      script: scriptBundle.script,
      sections: scriptBundle.sections,
      cached: hadCachedScript && !regenerate,
      voiceId,
      playback,
      provider,
      fallback: !usePolly,
      ...(usePolly && pollyAudio
        ? {
            audioUrl: pollyAudio.audioUrl,
            audioBase64: pollyAudio.audioBase64,
            audioMime: pollyAudio.audioMime,
          }
        : {}),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Lesson script could not be generated right now.";
    return NextResponse.json(
      {
        error: message.includes("GROQ")
          ? "Lesson script generation is not available right now."
          : "Lesson script could not be generated right now. Please try again.",
      },
      { status: 500 },
    );
  }
}
