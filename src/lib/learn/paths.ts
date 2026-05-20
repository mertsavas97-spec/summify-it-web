/** User-facing Learn dashboard routes (internal APIs may still use "memory"). */

export const LEARN_DASHBOARD_PATH = "/dashboard/learn";

export function learnDashboardHref(analysisId?: string | null): string {
  if (!analysisId) return LEARN_DASHBOARD_PATH;
  return `${LEARN_DASHBOARD_PATH}?analysisId=${encodeURIComponent(analysisId)}`;
}

export function learnLoginNext(analysisId?: string | null): string {
  return learnDashboardHref(analysisId);
}
