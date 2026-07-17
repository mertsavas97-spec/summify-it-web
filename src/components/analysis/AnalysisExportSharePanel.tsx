"use client";

import { AnalysisExportToolbar } from "@/components/analysis/AnalysisExportToolbar";
import { ShareControls } from "@/components/analysis/ShareControls";
import type { AnalysisExportContext } from "@/lib/export/analysisExport";
import type { AnalysisResult } from "@/types/text-analysis";

type AnalysisExportSharePanelProps = {
  result: AnalysisResult;
  exportContext?: AnalysisExportContext;
  analysisId: string;
  isPublic: boolean;
  shareId: string | null;
  title?: string;
};

export function AnalysisExportSharePanel({
  result,
  exportContext,
  analysisId,
  isPublic,
  shareId,
  title,
}: AnalysisExportSharePanelProps) {
  return (
    <div className="mt-6 space-y-4 print-hide" data-export-share-panel>
      <AnalysisExportToolbar result={result} exportContext={exportContext} />
      <ShareControls
        analysisId={analysisId}
        initialIsPublic={isPublic}
        initialShareId={shareId}
        title={title ?? result.title}
      />
    </div>
  );
}
