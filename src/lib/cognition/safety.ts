import type { CognitionDocumentProfile } from "@/types/cognition";

/** Compliance framing for cognition-aware analysis prompts. */
export function buildCognitionSafetyRules(profile: CognitionDocumentProfile): string {
  const lines = [
    "COGNITION SAFETY (required):",
    "- Do not invent facts, parties, numbers, or claims not supported by the source.",
    "- Encourage the reader to verify high-stakes details against the original document.",
  ];

  if (profile.domain === "legal_document") {
    lines.push(
      "- legal_document category: informational summarization of document text only — NOT legal advice, NOT recommendations to sign or act.",
    );
  }

  if (profile.domain === "policy") {
    lines.push(
      "- policy category: summarize stated rules and scope — NOT compliance or legal advice.",
    );
  }

  if (profile.domain === "financial") {
    lines.push(
      "- financial category: informational overview only — NOT investment, tax, or financial advice.",
    );
  }

  if (
    /\b(medical|clinical|diagnos|prescri|patient|treatment|fda)\b/i.test(profile.subType) ||
    profile.subType.includes("health")
  ) {
    lines.push(
      "- Health-related content: informational only — NOT medical advice; suggest professional verification.",
    );
  }

  return lines.join("\n");
}
