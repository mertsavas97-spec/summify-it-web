/**
 * Centralized analysis quota error codes and detection helpers.
 * Prefer `errorCode` from the API; fall back to message matching for older clients.
 */

export const ANALYSIS_QUOTA_ERROR_CODES = {
  GUEST_LIMIT: "GUEST_ANALYSIS_LIMIT",
  FREE_DAILY_LIMIT: "FREE_DAILY_ANALYSIS_LIMIT",
} as const;

export type AnalysisQuotaErrorCode =
  (typeof ANALYSIS_QUOTA_ERROR_CODES)[keyof typeof ANALYSIS_QUOTA_ERROR_CODES];

export const GUEST_ANALYSIS_LIMIT_MESSAGE =
  "Create a free account and get 5 analyses per day.";

export const FREE_DAILY_ANALYSIS_LIMIT_MESSAGE =
  "You've used today's free analyses.";

export function isGuestQuotaError(
  error: string | null | undefined,
  errorCode?: string | null,
): boolean {
  if (errorCode === ANALYSIS_QUOTA_ERROR_CODES.GUEST_LIMIT) return true;
  if (!error) return false;
  return (
    error.includes("Create a free account and get 5 analyses per day") ||
    error.includes("Create a free account and get 5 summaries per day")
  );
}

export function isFreeDailyQuotaError(
  error: string | null | undefined,
  errorCode?: string | null,
): boolean {
  if (errorCode === ANALYSIS_QUOTA_ERROR_CODES.FREE_DAILY_LIMIT) return true;
  if (!error) return false;
  return (
    error.includes("You've used today's") ||
    error.includes("You’ve used today’s") ||
    error.includes("free daily") ||
    error.includes("free analyses") ||
    error.includes("free summaries")
  );
}

export function isAnalysisQuotaError(
  error: string | null | undefined,
  errorCode?: string | null,
): boolean {
  return isGuestQuotaError(error, errorCode) || isFreeDailyQuotaError(error, errorCode);
}
