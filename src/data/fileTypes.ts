import type { DocumentType } from "@/core/types";
import {
  ACCEPT_UPLOAD_EXTENSIONS,
  SUPPORTED_UPLOAD_FORMAT_LABELS,
} from "@/lib/plans/uploadCopy";

export type SupportedFileType = {
  extension: string;
  mimeTypes: string[];
  label: string;
  documentType: DocumentType;
  extractable: boolean;
};

export const supportedFileTypes: SupportedFileType[] = [
  {
    extension: "pdf",
    mimeTypes: ["application/pdf"],
    label: "PDF",
    documentType: "pdf",
    extractable: true,
  },
  {
    extension: "docx",
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    label: "DOCX",
    documentType: "docx",
    extractable: true,
  },
  {
    extension: "txt",
    mimeTypes: ["text/plain"],
    label: "TXT",
    documentType: "txt",
    extractable: true,
  },
  {
    extension: "pptx",
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    label: "PPTX",
    documentType: "pptx",
    extractable: true,
  },
];

export const supportedFormatLabels = [...SUPPORTED_UPLOAD_FORMAT_LABELS];

export const acceptFileExtensions = ACCEPT_UPLOAD_EXTENSIONS;

export function inferDocumentType(
  fileName: string,
  mimeType: string,
): DocumentType {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const match = supportedFileTypes.find(
    (f) =>
      f.extension === ext || f.mimeTypes.some((m) => m === mimeType),
  );
  return match?.documentType ?? "unknown";
}

/** @deprecated Use getUploadZoneCopy(planId) for plan-aware page limits. */
export const maxPagesWebPreview = 200;

/** @deprecated Use getPlanLimits(planId).maxUploadMb */
export const maxUploadSizeMb = 20;
