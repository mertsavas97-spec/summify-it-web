/**
 * SERVER ONLY — plain text extraction.
 */

export async function extractTxtText(buffer: Buffer): Promise<string> {
  const text = buffer.toString("utf-8");

  if (!text.trim()) {
    throw new Error("The text file appears to be empty.");
  }

  return text;
}
