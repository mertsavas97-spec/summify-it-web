/**
 * SERVER ONLY — DOCX extraction via mammoth.
 */

import mammoth from "mammoth";
import { devWarn } from "@/server/logging";

export async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });

  if (result.messages.length > 0) {
    const warnings = result.messages.filter((m) => m.type === "warning");
    if (warnings.length > 0) {
      devWarn("[summify.extract] DOCX warnings", {
        detail: warnings.map((w) => w.message).join("; "),
      });
    }
  }

  const text = result.value?.trim() ?? "";
  if (!text) {
    throw new Error(
      "No readable text found in this Word document. It may be image-only or encrypted.",
    );
  }

  return text;
}
