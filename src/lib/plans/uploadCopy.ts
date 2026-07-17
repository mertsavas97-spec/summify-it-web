import { formatNumber } from "@/lib/format-number";
import type { PlanId } from "@/types/plan";
import { getPlanLimits } from "./planLimits";

export const SUPPORTED_UPLOAD_FORMAT_LABELS = ["PDF", "DOCX", "PPTX", "TXT"] as const;

export const ACCEPT_UPLOAD_EXTENSIONS = ".pdf,.docx,.pptx,.txt";

export type UploadZoneCopy = {
  dropLabel: string;
  limitLine: string;
  formats: readonly string[];
};

export function getUploadZoneCopy(planId: PlanId): UploadZoneCopy {
  const limits = getPlanLimits(planId);

  const dropLabel =
    "Drop a PDF, DOCX, PPTX, or TXT to summarize — or click to browse";

  let limitLine: string;
  if (planId === "team") {
    limitLine = `Max ${limits.maxUploadMb} MB · up to ${limits.maxPages} pages · advanced long-form analysis`;
  } else if (limits.supportsChunkedAnalysis) {
    limitLine = `Max ${limits.maxUploadMb} MB · up to ${limits.maxPages} pages · long-form chunked analysis`;
  } else {
    limitLine = `Max ${limits.maxUploadMb} MB · up to ${limits.maxPages} pages · up to ${formatNumber(limits.maxCharacters)} extracted characters`;
  }

  return {
    dropLabel,
    limitLine,
    formats: SUPPORTED_UPLOAD_FORMAT_LABELS,
  };
}

export function getPlanLimitNotice(): string {
  return "Only the most important sections of this document were analyzed due to your current plan limits.";
}

export function formatCharacterLimit(planId: PlanId): string {
  return formatNumber(getPlanLimits(planId).maxCharacters);
}
