export const AUDIO_STUDY_PROVIDER_POLLY = "aws-polly" as const;
export const AUDIO_STUDY_PROVIDER_BROWSER = "browser" as const;

export type AudioStudyProvider =
  | typeof AUDIO_STUDY_PROVIDER_POLLY
  | typeof AUDIO_STUDY_PROVIDER_BROWSER;

export function isAwsPollyProvider(
  provider: string | undefined,
  fallback: boolean | undefined,
): boolean {
  return provider === AUDIO_STUDY_PROVIDER_POLLY && fallback !== true;
}
