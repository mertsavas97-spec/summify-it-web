/** Client-safe Polly voice presets (no AWS secrets). */
export const POLLY_VOICE_PRESETS = [
  { id: "Matthew", label: "Matthew", description: "US English · male" },
  { id: "Joanna", label: "Joanna", description: "US English · female" },
  { id: "Danielle", label: "Danielle", description: "US English · female" },
  { id: "Ruth", label: "Ruth", description: "US English · female" },
] as const;

export type PollyVoiceId = (typeof POLLY_VOICE_PRESETS)[number]["id"];

export const DEFAULT_POLLY_VOICE_ID: PollyVoiceId = "Matthew";

export function isPollyVoiceId(value: string): value is PollyVoiceId {
  return POLLY_VOICE_PRESETS.some((v) => v.id === value);
}

export function normalizePollyVoiceId(value?: string | null): PollyVoiceId {
  if (value && isPollyVoiceId(value)) return value;
  return DEFAULT_POLLY_VOICE_ID;
}
