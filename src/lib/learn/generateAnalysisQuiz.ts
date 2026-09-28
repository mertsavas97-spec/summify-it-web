import type {
  AnalysisQuizInput,
  QuizDifficulty,
  QuizOption,
  QuizOptionKey,
  QuizQuestion,
} from "@/types/learn-quiz";
import { filterValidLearnCards } from "@/lib/learn/learnCardValidation";
import { isStudyPersonaModeId } from "@/lib/educational-source";

const OPTION_KEYS: QuizOptionKey[] = ["A", "B", "C", "D"];

const GENERIC_FILLERS = [
  "A detail not supported by this source",
  "An interpretation outside the document scope",
  "A timeline point from a different section",
  "A stakeholder not mentioned in the source",
] as const;

function hashSeed(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) {
    h = (h * 31 + text.charCodeAt(i)) >>> 0;
  }
  return h;
}

function shuffleWithSeed<T>(items: T[], seed: string): T[] {
  const copy = [...items];
  let s = hashSeed(seed);
  for (let i = copy.length - 1; i > 0; i -= 1) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizeFact(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function stripQuizParts(content: string): { question?: string; answer: string } {
  if (content.includes("\n---\n")) {
    const [q, a] = content.split("\n---\n");
    return {
      question: q?.trim() || undefined,
      answer: (a ?? content).trim(),
    };
  }
  return { answer: content };
}

function cardAnswerText(card: AnalysisQuizInput["learnCards"][number]): string {
  const raw =
    card.type === "quiz" ? stripQuizParts(card.content).answer : card.content;
  return normalizeFact(raw);
}

function looksLikeQuestion(text: string): boolean {
  const t = text.trim();
  return /\?$/.test(t) || /^(what|how|which|why|when|who|where)\b/i.test(t);
}

function hasMathOrShortFormula(answer: string): boolean {
  return /[=+\-×÷*/^]/.test(answer) || /\b\d+[a-z]\b/i.test(answer);
}

const GENERIC_STEM =
  /best supported by the source|which insight is explicitly|which action item follows|which mechanism or idea is supported|most important idea about/i;

function subjectPhrase(text: string): string {
  const cleaned = normalizeFact(text).replace(/[.?!]+$/, "");
  const defined = cleaned.match(
    /^(.{3,90}?)(?:\s+(?:is|are|was|were|means|refers to|introduces|shows|describes)\b)/i,
  );
  if (defined?.[1]) return defined[1].trim();
  // No copula to cut on: stop at the first verb so the subject stays a
  // phrase, not half a sentence ("solving an equation", not "…that makes").
  const words = cleaned.split(/\s+/);
  const cut = words.findIndex(
    (word, index) => index > 0 && LINKING_VERBS.has(word.toLowerCase()),
  );
  if (cut > 0) return words.slice(0, cut).join(" ");
  return words.slice(0, 8).join(" ");
}

/** Question kind — picks the stem family so one quiz never repeats a shell. */
type StemCategory =
  | "definition"
  | "method"
  | "explanation"
  | "cause"
  | "numeric"
  | "general";

const WH_WORDS = new Set([
  "what",
  "which",
  "how",
  "why",
  "when",
  "who",
  "where",
]);

const AUX_WORDS = new Set([
  "is",
  "are",
  "was",
  "were",
  "am",
  "does",
  "do",
  "did",
  "can",
  "could",
  "should",
  "would",
  "will",
  "shall",
  "may",
  "might",
  "must",
  "has",
  "have",
  "had",
  "been",
  "being",
]);

/** Verbs that mark a subject–verb pair, so the topic stays a noun phrase. */
const LINKING_VERBS = new Set([
  "denote",
  "denotes",
  "compare",
  "compares",
  "matter",
  "matters",
  "mean",
  "means",
  "show",
  "shows",
  "use",
  "uses",
  "used",
  "change",
  "changes",
  "affect",
  "affects",
  "follow",
  "follows",
  "require",
  "requires",
  "contain",
  "contains",
  "represent",
  "represents",
  "describe",
  "describes",
  "explain",
  "explains",
  "apply",
  "applies",
  "depend",
  "depends",
  "make",
  "makes",
  "work",
  "works",
  "happen",
  "happens",
  "increase",
  "decrease",
  "reduce",
  "improve",
  "determine",
  "determines",
  "measure",
  "measures",
  "include",
  "includes",
  "involve",
  "involves",
  "provide",
  "provides",
  "suggest",
  "suggests",
  "indicate",
  "indicates",
  "state",
  "states",
  "say",
  "says",
  "claim",
  "claims",
  "argue",
  "argues",
  "appear",
  "appears",
  "become",
  "becomes",
  "find",
  "finds",
  "give",
  "gives",
  "take",
  "takes",
  "keep",
  "keeps",
  "allow",
  "allows",
  "help",
  "helps",
  "lead",
  "leads",
  "grow",
  "grows",
  "fail",
  "fails",
  "remain",
  "remains",
  "start",
  "starts",
  "turn",
  "turns",
  "seem",
  "seems",
  // past-tense forms — a fact sentence is mostly past tense
  "denoted",
  "compared",
  "changed",
  "affected",
  "followed",
  "required",
  "contained",
  "represented",
  "described",
  "explained",
  "applied",
  "depended",
  "made",
  "worked",
  "increased",
  "decreased",
  "reduced",
  "improved",
  "determined",
  "measured",
  "included",
  "involved",
  "provided",
  "suggested",
  "indicated",
  "stated",
  "claimed",
  "argued",
  "appeared",
  "became",
  "found",
  "gave",
  "took",
  "kept",
  "allowed",
  "helped",
  "led",
  "grew",
  "failed",
  "remained",
  "started",
  "turned",
  "seemed",
  "happened",
  // predicates study decks ask about, present and past
  "occur",
  "occurs",
  "occurred",
  "publish",
  "published",
  "sign",
  "signed",
  "return",
  "returned",
  "dissolve",
  "dissolved",
  "warn",
  "warned",
  "write",
  "wrote",
  "adopt",
  "adopted",
  "storm",
  "stormed",
  "seize",
  "seized",
  "kill",
  "killed",
  "die",
  "died",
  "born",
  "suffer",
  "suffered",
  "collapse",
  "collapsed",
  "abdicate",
  "abdicated",
  "fight",
  "fought",
  "form",
  "formed",
  "declare",
  "declared",
  "trigger",
  "triggered",
  "stage",
  "staged",
  "resulted",
  "abolished",
  "shifted",
  "reformed",
  "replaced",
  "overthrew",
  "mobilized",
  "elevated",
  "began",
  "launched",
  "introduced",
  "executed",
  "execute",
  "executes",
  "arrested",
  "deported",
  "define",
  "defines",
  "defined",
  "create",
  "created",
  "build",
  "built",
  "develop",
  "developed",
  "establish",
  "established",
  "organize",
  "organized",
  "recruit",
  "recruited",
  "refer",
  "refers",
  "referred",
  "begin",
  "begins",
]);

const SOURCE_SUBJECTS =
  /^(?:the source|this|it|the document|this document|the speaker|the author|the lesson|the video)$/i;

/**
 * Strip the question shell off a card title so the subject reads naturally in
 * a new stem: "What is a variable?" → "a variable",
 * "How do you solve 1 + 2 = x?" → "solve 1 + 2 = x",
 * "Why does the source compare arithmetic and algebra?" → "arithmetic and algebra".
 */
/** Leading question scaffolding — never part of the subject phrase. */
const PREP_WORDS = new Set([
  "in",
  "on",
  "at",
  "by",
  "for",
  "from",
  "with",
  "to",
  "of",
  "about",
  "during",
  "after",
  "before",
  "between",
  "under",
  "over",
  "against",
]);

/** Determiners/pronouns that already read as a complete noun phrase. */
const NO_ARTICLE = new Set([
  "a",
  "an",
  "the",
  "this",
  "that",
  "these",
  "those",
  "it",
  "its",
  "they",
  "their",
  "his",
  "her",
  "our",
  "my",
  "each",
  "every",
  "no",
  "one",
  "some",
  "any",
  "both",
  "all",
]);

/** "the pamphlet" reads; "the Lenin" does not — only bare common nouns get an article. */
function withArticle(topic: string): string {
  const words = topic.split(/\s+/).filter(Boolean);
  const first = words[0] ?? "";
  if (!first || words.length > 6) return topic;
  if (NO_ARTICLE.has(first.toLowerCase())) return topic;
  // a bare verb phrase ("apply topic 1") is not a noun — leave it alone
  if (LINKING_VERBS.has(first.toLowerCase())) return topic;
  // "Lenin's brother" needs no article, and "the Lenin's …" would be wrong
  if (/['’]/.test(first)) return topic;
  if (!/^[a-z]/.test(first)) return topic;
  return `the ${topic}`;
}

function topicFromQuestion(title: string): string {
  let words = normalizeFact(title)
    .replace(/[?!.]+$/, "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "";

  // Strip the question scaffolding first: "In which month…", "Which pamphlet
  // did…", "What is…" all reduce to the content phrase underneath.
  for (;;) {
    const first = words[0]?.toLowerCase();
    if (!first) break;
    if (WH_WORDS.has(first) || PREP_WORDS.has(first) || AUX_WORDS.has(first)) {
      words = words.slice(1);
      continue;
    }
    break;
  }
  if (words.length === 0) return normalizeFact(title).replace(/[?!.]+$/, "");

  // Inverted question: "Which pamphlet did Lenin publish in 1902…" — keep the
  // noun phrase before the auxiliary, never the inverted clause.
  const auxAt = words.findIndex((word, index) => index > 0 && AUX_WORDS.has(word.toLowerCase()));
  if (auxAt > 0) words = words.slice(0, auxAt);

  // "How do you solve …" — the reader is the subject, keep verb + object.
  if (words[0]?.toLowerCase() === "you") {
    words = words.slice(1);
  } else if (
    words.length >= 3 &&
    SOURCE_SUBJECTS.test(words.slice(0, 2).join(" ")) &&
    !words.slice(0, 2).join(" ").toLowerCase().startsWith("the source ")
  ) {
    // "… it / this … <verb> …" — drop the stand-in subject and its verb.
    words = words.slice(3);
  } else if (words.length >= 3 && words[0]!.toLowerCase() === "the" && words[1]!.toLowerCase() === "source") {
    words = words.slice(3);
  } else if (words.length >= 3 && LINKING_VERBS.has(words[1]!.toLowerCase())) {
    // "symbols denote variables …" → topic is the noun phrase, not the clause.
    words = words.slice(0, 1);
  }

  // "… what implied multiplication mean?" — a trailing verb breaks "define X".
  // Stop once only a determiner-headed noun phrase is left ("the change").
  for (;;) {
    if (words.length <= 1) break;
    const last = words[words.length - 1]!.toLowerCase();
    const secondLast = words[words.length - 2]!.toLowerCase();
    const trailingVerb = AUX_WORDS.has(last) || LINKING_VERBS.has(last);
    if (!trailingVerb || NO_ARTICLE.has(secondLast)) break;
    words = words.slice(0, -1);
  }

  const topic = withArticle(words.join(" ").trim());
  return topic.length >= 2 ? topic : normalizeFact(title).replace(/[?!.]+$/, "");
}

/** Words that only ever end a phrase that was cut mid-clause. */
const DANGLING_SUBJECT_END = new Set([
  "a", "an", "the", "of", "for", "to", "in", "on", "at", "by", "with", "from",
  "into", "over", "under", "as", "after", "before", "between", "during",
  "and", "or", "that", "which", "what", "who", "when", "where", "how", "why",
  "is", "are", "was", "were", "did", "does", "do", "has", "have",
]);

/**
 * A subject is usable when it is a noun phrase — not a leftover clause.
 * "the pamphlet" passes; "pamphlet did Lenin publish", "in which month" or a
 * nine-word sentence fragment fail and the card is skipped instead.
 *
 * `strict` adds the checks that only question titles can trip: their subject
 * is derived by stripping the question shell, so an inversion or a stray
 * predicate is still possible. Fact-derived subjects were already cut at a
 * verb by `subjectPhrase`, so they are held to the shared rules only.
 */
function isCleanSubject(subject: string, strict: boolean): boolean {
  // a title separator ("1887 – The execution of …") means we sliced mid-heading
  if (/[:;|–—]/.test(subject)) return false;
  const words = subject.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 9) return false;
  const bare = (word: string) => word.replace(/["“”'‘’?!.,;:()[\]*/]/g, "").toLowerCase();
  const last = bare(words[words.length - 1]!);
  // a function word or a verb left hanging at the end → the phrase was cut mid-clause
  if (!last || DANGLING_SUBJECT_END.has(last)) return false;
  if (strict && LINKING_VERBS.has(last)) return false;
  // an auxiliary left inside the phrase → still an inverted question clause
  if (words.some((word, index) => index > 0 && AUX_WORDS.has(bare(word)))) return false;
  if (!strict) return true;
  // a question word inside the phrase ("approximately how many kulaks")
  if (words.some((word, index) => index >= 1 && WH_WORDS.has(bare(word)))) return false;
  // a predicate verb parked in the middle → the phrase is really a clause
  // ("the significant event … occurred in 1905"), which no shell can repair.
  return !words.some(
    (word, index) => index >= 2 && LINKING_VERBS.has(bare(word)),
  );
}

function stemCategoryFor(title: string, fact: string): StemCategory {
  const lower = title.toLowerCase();
  if (/^why\b/.test(lower)) return "cause";
  if (/^how\s+(do|can|should|did|would)\s+you\b|^how\s+to\b/.test(lower)) return "method";
  if (/^how\b/.test(lower)) return "explanation";
  if (/^(?:what|which)\s+(?:is|are|was|were)\b/.test(lower)) return "definition";
  if (/\b(because|caused|led to|due to|resulted)\b/i.test(fact)) return "cause";
  if (/\b(means|defined|refers to|is a|is an|are the)\b/i.test(fact)) return "definition";
  if (/\d/.test(fact)) return "numeric";
  return "general";
}

/**
 * Distinct shells per category. `generateAnalysisQuiz` walks these with a
 * used-set so no two questions in one quiz share a phrasing, and no shell is
 * ever the card's own wording — the card supplies the subject, never the line.
 */
const STEM_FORMS: Record<StemCategory, Array<(subject: string) => string>> = {
  definition: [
    (s) => `How does the source define ${s}?`,
    (s) => `What does the source say ${s} means?`,
    (s) => `Which statement about ${s} matches the source?`,
  ],
  method: [
    (s) => `How does the source say to ${s}?`,
    (s) => `What does the source say you should do to ${s}?`,
    (s) => `What approach does the source give to ${s}?`,
  ],
  explanation: [
    (s) => `How does the source explain ${s}?`,
    (s) => `How does the source describe ${s}?`,
    (s) => `What does the source say about ${s}?`,
  ],
  cause: [
    (s) => `Why does the source tie this result to ${s}?`,
    (s) => `What reason does the source give behind ${s}?`,
    (s) => `According to the source, what drives ${s}?`,
  ],
  numeric: [
    (s) => `Which specific detail does the source give for ${s}?`,
    (s) => `What figure does the source attach to ${s}?`,
    (s) => `Which number in the source matters most for ${s}?`,
  ],
  general: [
    (s) => `What claim does the source make about ${s}?`,
    (s) => `What does the source conclude about ${s}?`,
    (s) => `Which point about ${s} does the source support?`,
  ],
};

/**
 * Rejects a shell that reads like broken English when glued to this subject
 * ("about Which symbols…", "define X mean"): the caller drops the card or
 * insight instead of shipping a mangled question.
 */
function isReadableStem(stem: string, sourceWording?: string): boolean {
  if (!stem || stem.length > 160) return false;
  // a question clause parked in an object slot
  if (/\b(?:to|about|for|in|of|with|by)\s+(?:the source\b|which\b|what\b|how\b|why\b|when\b|who\b|where\b)/i.test(stem)) {
    return false;
  }
  // a bare auxiliary/pronoun in an object slot
  if (/\b(?:about|to|for)\s+(?:you\b|does\b|do\b|is\b|are\b|was\b|were\b|it\b)/i.test(stem)) {
    return false;
  }
  // "define implied multiplication mean" — copula left on the subject
  if (/\b(?:define|describes?|explains?)\s+\S+\s+means?\b/i.test(stem)) return false;
  if (sourceWording && tokenOverlap(stem, sourceWording) > 0.75) return false;
  return true;
}

function tokenOverlap(a: string, b: string): number {
  const tokenize = (text: string) =>
    new Set(
      normalizeFact(text)
        .toLowerCase()
        .split(/[^a-z0-9x+=]+/i)
        .filter((t) => t.length > 1),
    );
  const left = tokenize(a);
  const right = tokenize(b);
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / (left.size + right.size - shared);
}

/**
 * Keep the shell natural around whatever phrase we derived: "A variable is …"
 * → "a variable", but never lowercase the second half of a name like
 * "Mao Zedong".
 */
function sentenceCaseSubject(subject: string): string {
  const words = subject.split(/\s+/);
  const first = words[0] ?? "";
  if (!/^[A-Z]/.test(first)) return subject;
  const next = words[1] ?? "";
  const isNamePart = /^[A-Z][a-z]/.test(next) && !/^(A|An|The|This|That|These|Those|It|Its|If|When|Where|While|After|Before)$/.test(first);
  if (isNamePart) return subject;
  return first.toLowerCase() + subject.slice(first.length);
}

/**
 * Builds one readable, unused shell around the subject. Falls back to the
 * general family when the category's shells all read badly with this phrase —
 * a dropped stem would shrink the quiz for no quality gain.
 */
function buildStem(
  category: StemCategory,
  subject: string,
  used: Set<string> | undefined,
  sourceWording?: string,
  strict = false,
): string | null {
  if (!isCleanSubject(subject, strict)) return null;
  // Two cards can derive the same short subject ("the date"): a second shell
  // around the same phrase still reads as a repeat, so the card is skipped.
  const subjectKey = subject.toLowerCase().replace(/\s+/g, " ").trim();
  if (used?.has(`subject:${subjectKey}`)) return null;
  const families: StemCategory[] =
    category === "general" ? ["general"] : [category, "general"];
  const candidates: Array<{ family: StemCategory; index: number; form: (s: string) => string }> = [];
  for (const family of families) {
    STEM_FORMS[family].forEach((form, index) => candidates.push({ family, index, form }));
  }
  // preferred: a shell this quiz has not used yet
  candidates.sort((a, b) => {
    const aUsed = used?.has(`${a.family}-${a.index}`) ? 1 : 0;
    const bUsed = used?.has(`${b.family}-${b.index}`) ? 1 : 0;
    return aUsed - bUsed;
  });

  for (const candidate of candidates) {
    const stem = candidate.form(subject);
    if (!isReadableStem(stem, sourceWording)) continue;
    // two cards can derive the same short subject ("the date") — an exact
    // repeat inside one quiz reads as a bug, so that card is skipped.
    const exact = stem.toLowerCase().trim();
    if (used?.has(exact)) continue;
    used?.add(`${candidate.family}-${candidate.index}`);
    used?.add(exact);
    used?.add(`subject:${subjectKey}`);
    return stem;
  }
  return null;
}

/** A complete exam sentence tied to this fact. Not one shared shell for every item. */
function examQuestionForFact(
  fact: string,
  used?: Set<string>,
  sourceWording?: string,
): string | null {
  const subject = sentenceCaseSubject(subjectPhrase(fact));
  if (subject.length < 3) return null;
  const category = stemCategoryFor("", fact);
  return buildStem(category, subject, used, sourceWording);
}

/**
 * The card supplies the subject, never its own wording: a card question is
 * rewritten into a different shell, so a quiz is never a copy of the deck.
 */
export function stemFromLearnCard(
  card: AnalysisQuizInput["learnCards"][number],
  used?: Set<string>,
): string | null {
  const title = normalizeFact(card.title);
  if (title.length < 3 || GENERIC_STEM.test(title)) return null;

  const answer = cardAnswerText(card);
  const quizQuestion = card.type === "quiz" ? stripQuizParts(card.content).question ?? "" : "";
  const isQuestion = looksLikeQuestion(title) || looksLikeQuestion(quizQuestion);
  if (!isQuestion) {
    const fact = `${title} ${answer}`;
    if (GENERIC_STEM.test(fact)) return null;
    return examQuestionForFact(fact, used, title);
  }

  const subject = sentenceCaseSubject(topicFromQuestion(title));
  if (subject.length < 3) return null;
  const category = stemCategoryFor(title, `${title} ${answer}`);
  // "What figure does the source attach to X?" only fits when X is numeric.
  const resolved = category === "numeric" && !/\d/.test(subject) ? "general" : category;
  return buildStem(resolved, subject, used, title, true);
}

function buildDistractors(
  correct: string,
  pool: string[],
  seed: string,
  options?: { allowGenericFillers?: boolean },
): string[] | null {
  const allowGenericFillers = options?.allowGenericFillers !== false;
  const unique = [...new Set(pool.map(normalizeFact).filter((t) => t.length > 8))].filter(
    (t) => t.toLowerCase() !== correct.toLowerCase(),
  );
  const shuffled = shuffleWithSeed(unique, seed);
  const picks: string[] = [];
  for (const item of shuffled) {
    if (picks.length >= 3) break;
    if (item.length < 8) continue;
    const tooSimilar =
      item.toLowerCase().includes(correct.slice(0, 24).toLowerCase()) ||
      correct.toLowerCase().includes(item.slice(0, 24).toLowerCase());
    if (!tooSimilar) picks.push(item);
  }

  if (picks.length < 3 && allowGenericFillers) {
    while (picks.length < 3) {
      picks.push(GENERIC_FILLERS[picks.length] ?? "Not stated in the source material");
    }
  }

  if (picks.length < 3) return null;
  return picks.slice(0, 3);
}

function assignOptions(
  correctText: string,
  distractors: string[],
  questionId: string,
): { options: QuizOption[]; correctOptionKey: QuizOptionKey } {
  const merged = shuffleWithSeed([correctText, ...distractors], questionId).slice(0, 4);
  const correctIndex = merged.findIndex(
    (t) => t.toLowerCase() === correctText.toLowerCase(),
  );
  const safeCorrectIndex = correctIndex >= 0 ? correctIndex : 0;
  const options = merged.map((text, index) => ({
    key: OPTION_KEYS[index],
    text,
  }));
  return { options, correctOptionKey: OPTION_KEYS[safeCorrectIndex] };
}

function questionFromLearnCard(
  card: AnalysisQuizInput["learnCards"][number],
  pool: string[],
  index: number,
  studyMode: boolean,
  usedStems: Set<string>,
): QuizQuestion | null {
  const answer = cardAnswerText(card);
  const minLen = studyMode && hasMathOrShortFormula(answer) ? 2 : 12;
  if (answer.length < minLen) return null;

  const question = stemFromLearnCard(card, usedStems);
  if (!question) return null;
  const distractors = buildDistractors(answer, pool, `card-${card.cardId ?? index}`, {
    allowGenericFillers: false,
  });
  if (!distractors) return null;

  const { options, correctOptionKey } = assignOptions(
    answer,
    distractors,
    `q-${card.cardId ?? index}`,
  );

  const difficulty: QuizDifficulty =
    card.recallDifficulty === "hard"
      ? "hard"
      : card.recallDifficulty === "easy"
        ? "easy"
        : "medium";

  return {
    id: `quiz-card-${card.cardId ?? index}`,
    question,
    options,
    correctOptionKey,
    explanation: `The source supports this answer: ${answer}`,
    relatedLearnCardId: card.cardId,
    sourceTrace: card.sourceTrace,
    difficulty,
    theme: normalizeFact(card.title),
  };
}

function questionFromInsight(
  insight: string,
  pool: string[],
  index: number,
  usedStems: Set<string>,
): QuizQuestion | null {
  const fact = normalizeFact(insight);
  if (fact.length < 24) return null;
  if (/^(the|this|it)\s+(video|document|article)\s/i.test(fact)) return null;

  const question = examQuestionForFact(fact, usedStems);
  if (!question) return null;
  const distractors = buildDistractors(fact, pool, `insight-${index}`, {
    allowGenericFillers: false,
  });
  if (!distractors) return null;

  const { options, correctOptionKey } = assignOptions(
    fact,
    distractors,
    `q-insight-${index}`,
  );

  return {
    id: `quiz-insight-${index}`,
    question,
    options,
    correctOptionKey,
    explanation: `This point appears in the analysis key insights: ${fact}`,
    difficulty: "medium",
    theme: subjectPhrase(fact),
  };
}

/**
 * Builds multiple-choice quiz questions from analysis output and accessible Learn cards.
 * Study modes prefer real card stems and reject generic filler distractors.
 */
export function generateAnalysisQuiz(input: AnalysisQuizInput): QuizQuestion[] {
  const studyMode =
    input.studyMode === true || isStudyPersonaModeId(input.intelligenceModeId);

  const openCards = filterValidLearnCards(
    input.learnCards.filter((c) => !c.isLockedPreview),
    "quiz_generation",
  );
  // Distractors must be facts about the subject. Action items ("publish a blog
  // post…") and the raw summary blob read as advice, not as an option, so they
  // never enter the pool — a question that can only be answered by elimination
  // teaches nothing.
  const pool = [
    ...openCards.map(cardAnswerText),
    ...input.keyInsights,
    ...(studyMode ? [] : input.risksOrWarnings),
  ]
    .map(normalizeFact)
    .filter((t) => t.length > 8);

  const maxQuestions = Math.min(
    input.maxQuestions ?? 6,
    Math.max(3, openCards.length + 2),
  );

  const questions: QuizQuestion[] = [];
  // One shell per question: a quiz never repeats a phrasing, and never
  // mirrors the card's own wording (the card donates its subject only).
  const usedStems = new Set<string>();

  // Prefer definition / quiz / formula-style cards first in study mode
  const orderedCards = studyMode
    ? [...openCards].sort((a, b) => {
        const score = (c: (typeof openCards)[number]) => {
          if (c.type === "quiz") return 0;
          if (c.type === "concept" && looksLikeQuestion(c.title)) return 1;
          if (c.type === "memory_hook") return 2;
          return 3;
        };
        return score(a) - score(b);
      })
    : openCards;

  for (let i = 0; i < orderedCards.length && questions.length < maxQuestions; i += 1) {
    const q = questionFromLearnCard(orderedCards[i], pool, i, studyMode, usedStems);
    // Same theme twice in one quiz is a repeat, even with a fresh shell.
    if (q && !questions.some((existing) => existing.theme === q.theme)) questions.push(q);
  }

  for (let i = 0; i < input.keyInsights.length && questions.length < maxQuestions; i += 1) {
    const q = questionFromInsight(input.keyInsights[i], pool, i, usedStems);
    if (q && !questions.some((existing) => existing.theme === q.theme)) {
      questions.push(q);
    }
  }

  const ordered = input.variantSeed
    ? shuffleWithSeed(questions, `quiz-variant-${input.variantSeed}`)
    : questions;

  return ordered.slice(0, maxQuestions);
}
