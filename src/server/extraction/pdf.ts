/**
 * SERVER ONLY — PDF text extraction via unpdf.
 */

import { extractText, getDocumentProxy } from "unpdf";

export async function extractPdfText(buffer: Buffer): Promise<{
  text: string;
  pageCount: number;
}> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { totalPages, text } = await extractText(pdf, { mergePages: true });

  const merged = typeof text === "string" ? text : (text as string[]).join("\n\n");

  if (!merged.trim()) {
    throw new Error(
      "No readable text found in this PDF. It may be scanned images without OCR.",
    );
  }

  return {
    text: merged,
    pageCount: totalPages,
  };
}
