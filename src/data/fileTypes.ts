import type { DocumentType } from "@/core/types";

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

export const supportedFormatLabels = supportedFileTypes
  .filter((f) => f.extractable)
  .map((f) => f.label);

export const acceptFileExtensions = ".pdf,.docx,.txt,.pptx";

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

export const maxPagesWebPreview = 200;

export const maxUploadSizeMb = 10;
