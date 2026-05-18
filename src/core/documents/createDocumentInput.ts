import type { DocumentInput, DocumentType } from "@/core/types";
import { inferDocumentType } from "@/data/fileTypes";

type CreateDocumentInputParams = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  userId?: string;
};

function generateId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Builds a DocumentInput from upload metadata.
 * Frontend-safe — no persistence or validation against storage.
 */
export function createDocumentInput(
  params: CreateDocumentInputParams,
): DocumentInput {
  const documentType: DocumentType = inferDocumentType(
    params.fileName,
    params.mimeType,
  );

  return {
    id: generateId(),
    fileName: params.fileName,
    mimeType: params.mimeType,
    documentType,
    sizeBytes: params.sizeBytes,
    uploadedAt: new Date().toISOString(),
    userId: params.userId,
  };
}
