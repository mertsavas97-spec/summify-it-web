/**
 * A flashcard is one question and one answer.
 * They share a topic, but the answer must not finish the question's sentence.
 */

const GENERIC_FLASHCARD_STEM =
  /best supported by the source|which statement is best|which insight is (explicitly )?supported|which action item follows|which mechanism or idea is supported|what claim does the source make|what point does the source|how does the source (account|explain|define)|what does the source (claim|say|establish|identify)|which detail does the source|why does the source (tie|connect)|most important idea|what is the (main |key )?(point|takeaway|insight)|why does this matter|what should (you|i) remember|what memory hook helps recall|key insight|core idea|recall check|what happened regarding|which period best captures|according to the (text|source|analysis|document|article|passage)|based on the (text|source|analysis|document|article)|from the (text|source|analysis|document) (we can|it|you)|what does the (text|source|analysis|document|article|passage) (say|claim|highlight|suggest|indicate|establish|support|mean)|what is the (purpose|main idea|central idea|overall message) of the (text|document|article|analysis|source|passage)|how does the (text|source|analysis|document|article) (support|describe|explain|approach|account for)|how would you (describe|summarize|explain|define|rephrase)|can you (explain|describe|identify|list|summarize|name)|tell me about|what do you (know|think) about|what is your understanding of|why is (this|it) (important|significant|relevant)|what is the significance of|which of the following|what can be (learned|concluded|understood) from|in what (way|ways) does|what role does .{1,60} play in the (text|source|analysis|document|article)|how does this (relate|connect) to/i;

const CONTINUATION_OPENERS =
  /^(and|but|or|which|that|who|whose|whom|so that)\b/i;

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase().replace(/[.?!]+$/g, "");
}

function words(text: string): string[] {
  return normalize(text)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

export function isGenericFlashcardPrompt(text: string): boolean {
  return GENERIC_FLASHCARD_STEM.test(text.trim());
}

export function isStandaloneFlashcardQuestion(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 8) return false;
  if (isGenericFlashcardPrompt(trimmed)) return false;
  return /\?$/.test(trimmed) || /^(what|how|which|why|when|who|where)\b/i.test(trimmed);
}

/** True when the answer only finishes the question instead of answering it. */
export function isQuestionAnswerContinuation(question: string, answer: string): boolean {
  const q = normalize(question);
  const a = normalize(answer);
  if (!q || !a) return true;
  if (q === a || a.includes(q) || (q.includes(a) && a.length > 24)) return true;
  if (CONTINUATION_OPENERS.test(answer.trim())) return true;

  const qWords = words(question);
  const aWords = words(answer);
  if (qWords.length >= 4 && aWords.length >= 4) {
    const tail = qWords.slice(-4).join(" ");
    if (aWords.slice(0, 4).join(" ") === tail) return true;
  }

  const questionSet = new Set(qWords.filter((word) => word.length > 3));
  const answerContent = aWords.filter((word) => word.length > 3);
  if (answerContent.length >= 4) {
    const shared = answerContent.filter((word) => questionSet.has(word)).length;
    if (shared / answerContent.length >= 0.75) return true;
  }

  return false;
}

export function isDistinctFlashcardPair(question: string, answer: string): boolean {
  return (
    isStandaloneFlashcardQuestion(question) &&
    answer.trim().length > 0 &&
    !isQuestionAnswerContinuation(question, answer)
  );
}
