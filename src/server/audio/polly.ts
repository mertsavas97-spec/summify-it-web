import {
  PollyClient,
  SynthesizeSpeechCommand,
  type Engine,
  type OutputFormat,
  type SynthesizeSpeechCommandInput,
} from "@aws-sdk/client-polly";
import { normalizePollyVoiceId, type PollyVoiceId } from "@/lib/audio-study/pollyVoices";

const DEFAULT_VOICE_ID: PollyVoiceId = "Matthew";
const DEFAULT_ENGINE: Engine = "neural";
const DEFAULT_OUTPUT_FORMAT: OutputFormat = "mp3";

/** Polly plain-text limit for synchronous synthesis. */
const MAX_TEXT_CHARS = 5500;

export type GeneratePollySpeechParams = {
  text: string;
  voiceId?: string;
  engine?: Engine;
  outputFormat?: OutputFormat;
};

export type GeneratePollySpeechResult = {
  audio: Buffer;
  contentType: string;
  voiceId: PollyVoiceId;
  engine: Engine;
  outputFormat: OutputFormat;
};

export type PollyEnvCheck = {
  envConfigured: boolean;
  region: string;
  canInitializeClient: boolean;
  accessKeyPresent: boolean;
  secretKeyPresent: boolean;
  accessKeySource: "summify" | "legacy_aws" | "missing";
  secretKeySource: "summify" | "legacy_aws" | "missing";
  regionSource: "summify" | "legacy_aws" | "default";
};

let pollyClient: PollyClient | null = null;

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function getSummifyAwsCredentials(): {
  accessKeyId: string;
  secretAccessKey: string;
  accessKeySource: PollyEnvCheck["accessKeySource"];
  secretKeySource: PollyEnvCheck["secretKeySource"];
} | null {
  const summifyAccess = readEnv("SUMMIFY_AWS_ACCESS_KEY_ID");
  const summifySecret = readEnv("SUMMIFY_AWS_SECRET_ACCESS_KEY");
  const legacyAccess = readEnv("AWS_ACCESS_KEY_ID");
  const legacySecret = readEnv("AWS_SECRET_ACCESS_KEY");

  const accessKeyId = summifyAccess ?? legacyAccess;
  const secretAccessKey = summifySecret ?? legacySecret;

  if (!accessKeyId || !secretAccessKey) return null;

  const accessKeySource: PollyEnvCheck["accessKeySource"] = summifyAccess
    ? "summify"
    : legacyAccess
      ? "legacy_aws"
      : "missing";
  const secretKeySource: PollyEnvCheck["secretKeySource"] = summifySecret
    ? "summify"
    : legacySecret
      ? "legacy_aws"
      : "missing";

  return { accessKeyId, secretAccessKey, accessKeySource, secretKeySource };
}

export function getPollyRegion(): string {
  return (
    readEnv("SUMMIFY_AWS_REGION") ??
    readEnv("AWS_REGION") ??
    "us-east-1"
  );
}

function getRegionSource(): PollyEnvCheck["regionSource"] {
  if (readEnv("SUMMIFY_AWS_REGION")) return "summify";
  if (readEnv("AWS_REGION")) return "legacy_aws";
  return "default";
}

export function getPollyEnvCheck(): PollyEnvCheck {
  const creds = getSummifyAwsCredentials();
  const region = getPollyRegion();
  let canInitializeClient = false;

  if (creds) {
    try {
      new PollyClient({
        region,
        credentials: {
          accessKeyId: creds.accessKeyId,
          secretAccessKey: creds.secretAccessKey,
        },
      });
      canInitializeClient = true;
    } catch {
      canInitializeClient = false;
    }
  }

  const check: PollyEnvCheck = {
    envConfigured: creds !== null,
    region,
    canInitializeClient,
    accessKeyPresent: Boolean(creds?.accessKeyId),
    secretKeyPresent: Boolean(creds?.secretAccessKey),
    accessKeySource: creds?.accessKeySource ?? "missing",
    secretKeySource: creds?.secretKeySource ?? "missing",
    regionSource: getRegionSource(),
  };

  console.info("[audio-study] polly_env_check", {
    envConfigured: check.envConfigured,
    region: check.region,
    canInitializeClient: check.canInitializeClient,
    accessKeyPresent: check.accessKeyPresent,
    secretKeyPresent: check.secretKeyPresent,
    accessKeySource: check.accessKeySource,
    secretKeySource: check.secretKeySource,
    regionSource: check.regionSource,
  });

  return check;
}

export function isPollyConfigured(): boolean {
  return getSummifyAwsCredentials() !== null;
}

function getPollyClient(): PollyClient {
  if (!pollyClient) {
    const credentials = getSummifyAwsCredentials();
    if (!credentials) {
      throw new Error(
        "Polly is not configured. Set SUMMIFY_AWS_ACCESS_KEY_ID and SUMMIFY_AWS_SECRET_ACCESS_KEY.",
      );
    }
    const region = getPollyRegion();
    pollyClient = new PollyClient({
      region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
    });
  }
  return pollyClient;
}

async function streamToUint8Array(stream: unknown): Promise<Uint8Array> {
  if (!stream) {
    throw new Error("Polly returned empty audio stream.");
  }
  if (stream instanceof Uint8Array) return stream;
  if (Buffer.isBuffer(stream)) return Uint8Array.from(stream);

  if (
    typeof stream === "object" &&
    stream !== null &&
    "transformToByteArray" in stream &&
    typeof (stream as { transformToByteArray: unknown }).transformToByteArray === "function"
  ) {
    return (stream as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as AsyncIterable<Uint8Array | Buffer | string>) {
    if (typeof chunk === "string") {
      chunks.push(Uint8Array.from(Buffer.from(chunk)));
    } else if (Buffer.isBuffer(chunk)) {
      chunks.push(Uint8Array.from(chunk));
    } else {
      chunks.push(chunk);
    }
  }

  if (chunks.length === 0) {
    throw new Error("Polly audio stream contained no data.");
  }

  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

function truncateForPolly(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= MAX_TEXT_CHARS) return trimmed;
  return `${trimmed.slice(0, MAX_TEXT_CHARS - 1)}…`;
}

function serializePollyError(err: unknown): Record<string, unknown> {
  if (err && typeof err === "object") {
    const e = err as {
      name?: string;
      message?: string;
      Code?: string;
      $metadata?: { httpStatusCode?: number; requestId?: string };
    };
    return {
      name: e.name,
      message: e.message,
      code: e.Code,
      httpStatusCode: e.$metadata?.httpStatusCode,
      requestId: e.$metadata?.requestId,
    };
  }
  return { message: String(err) };
}

export async function generatePollySpeech(
  params: GeneratePollySpeechParams,
): Promise<GeneratePollySpeechResult> {
  const voiceId = normalizePollyVoiceId(params.voiceId ?? DEFAULT_VOICE_ID);
  const engine = params.engine ?? DEFAULT_ENGINE;
  const outputFormat = params.outputFormat ?? DEFAULT_OUTPUT_FORMAT;
  const text = truncateForPolly(params.text);
  const region = getPollyRegion();

  if (!text) {
    throw new Error("Polly synthesis requires non-empty text.");
  }

  console.info("[audio-study] polly_request_start", {
    voiceId,
    engine,
    outputFormat,
    region,
    textChars: text.length,
  });

  const input: SynthesizeSpeechCommandInput = {
    Text: text,
    VoiceId: voiceId,
    Engine: engine,
    OutputFormat: outputFormat,
  };

  const response = await getPollyClient().send(new SynthesizeSpeechCommand(input));
  const bytes = await streamToUint8Array(response.AudioStream);
  const audio = Buffer.from(bytes);

  if (audio.length === 0) {
    throw new Error("Polly returned empty audio buffer.");
  }

  console.info("[audio-study] polly_response_success", {
    voiceId,
    engine,
    outputFormat,
    httpStatusCode: response.$metadata?.httpStatusCode,
    requestId: response.$metadata?.requestId,
  });
  console.info("[audio-study] polly_audio_bytes", { bytes: audio.length });

  const contentType = outputFormat === "mp3" ? "audio/mpeg" : "audio/ogg";

  return {
    audio,
    contentType,
    voiceId,
    engine,
    outputFormat,
  };
}

export function logPollyErrorFull(err: unknown, context: Record<string, unknown>): void {
  console.error("[audio-study] polly_error_full", {
    ...context,
    error: serializePollyError(err),
  });
}

export function buildPollyDataUrl(audioBase64: string, mime = "audio/mpeg"): string {
  return `data:${mime};base64,${audioBase64}`;
}
