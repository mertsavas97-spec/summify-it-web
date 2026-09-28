/**
 * SERVER ONLY — short notes for each ordered part of a long paid source.
 * The final analysis reads these notes, not one giant prompt.
 */

import Groq from "groq-sdk";
import { AI_CONFIG } from "@/server/ai/config";
import { splitOrderedChunks } from "@/lib/analysis/sourceCoverage";
import { devWarn } from "@/server/logging";

const NOTE_TIMEOUT_MS = 20_000;
const NOTE_CONCURRENCY = 3;

export async function collectOrderedSourceNotes(text: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const chunks = splitOrderedChunks(text);
  if (chunks.length === 0) return null;

  const client = new Groq({ apiKey });
  const notes: Array<string | null> = new Array(chunks.length).fill(null);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < chunks.length) {
      const index = cursor;
      cursor += 1;
      const chunk = chunks[index];
      if (!chunk) continue;
      try {
        const completion = await client.chat.completions.create(
          {
            model: AI_CONFIG.providers.groq.model,
            messages: [
              {
                role: "system",
                content:
                  "You extract factual notes from one ordered part of a longer source. Plain text only. No JSON.",
              },
              {
                role: "user",
                content: `Part ${index + 1} of ${chunks.length}. Write 4 to 8 short sentences covering this part from its start through its end. Keep names, numbers, and causes. Do not invent.\n\n${chunk}`,
              },
            ],
            temperature: 0.2,
            max_tokens: 500,
            reasoning_effort: "low",
          },
          { timeout: NOTE_TIMEOUT_MS },
        );
        const content = completion.choices[0]?.message?.content?.trim();
        if (content) notes[index] = content;
      } catch (error) {
        devWarn("[summify.analyze] source_note_failed", {
          part: index + 1,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(NOTE_CONCURRENCY, chunks.length) }, () => worker()),
  );

  const written = notes
    .map((note, index) => (note ? `Part ${index + 1} of ${chunks.length}\n${note}` : null))
    .filter((note): note is string => Boolean(note));
  if (written.length === 0) return null;
  return written.join("\n\n");
}
