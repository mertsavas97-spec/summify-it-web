import { stripAnalysisTimecodes } from "@/lib/analysis/stripTimecodes";
import { QUIZ_ANSWER_DELIMITER } from "@/types/text-analysis";

/**
 * Study-card titles must be a complete clause, and the description must be
 * complete prose. Never leave a mid-phrase cut ("5,000" / "Miles") or a
 * question the paragraph does not answer.
 */

const DANGLING_END =
  /(?:['’]s|\b(?:a|an|the|of|as|to|in|on|at|for|and|or|but|yet|nor|with|from|by|into|over|under|about|after|before|during|while|which|who|whose|that|roughly|covering|including|following|resulting|prompting|toward|towards|per|via))\s*$/i;

const FINITE_VERB =
  /\b(?:is|are|was|were|be|been|being|has|have|had|do|does|did|can|could|may|might|will|would|shall|should|sent|broke|led|drove|became|began|ended|won|lost|died|rose|fell|born|made|came|went|took|gave|kept|left|held|saw|said|found|built|set|met)\b|\b[a-z]+(?:ed|es)\b/i;

const VAGUE_EVENT =
  /^(this event|this point|the pivotal moment|the main subject|this period|the source)$/i;

const CHANGE_LANGUAGE =
  /\b(changed|change|became|abolished|shift(?:ed)?|reform(?:s|ed)?|broke|resulted|replaced|overthrew|seized|mobilized|elevated|ended|began|launched|introduced|failed|turned)\b/i;

function collapse(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function sentenceCase(text: string): string {
  const clean = collapse(text);
  if (!clean) return clean;
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function endsDangling(text: string): boolean {
  const clean = collapse(text).replace(/[,;:]+$/g, "").trim();
  if (!clean) return true;
  if (DANGLING_END.test(clean)) return true;
  if (/\d$/.test(clean)) return true;
  return false;
}

function hasFiniteVerb(text: string): boolean {
  return FINITE_VERB.test(text);
}

function clauseOk(text: string): boolean {
  const clean = collapse(text).replace(/[.]+$/g, "");
  const words = clean.split(" ").filter(Boolean);
  if (words.length < 4 || clean.length > 110) return false;
  if (endsDangling(clean)) return false;
  return hasFiniteVerb(clean);
}

function dropCoveringAsides(sentence: string): string {
  return collapse(
    sentence.replace(
      /,\s*(?:covering|including|lasting|spanning)\b(?:[^,]|,(?=\d))*,/gi,
      "",
    ),
  );
}

function longestCommaClause(text: string): string | null {
  let best: string | null = null;
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] !== ",") continue;
    const left = text.slice(0, index).trim();
    if (clauseOk(left)) best = left;
  }
  return best;
}

/** A complete headline clipped only at a clause boundary. */
export function declarativeCardHeadline(statement: string): string {
  const text = dropCoveringAsides(collapse(statement).replace(/[.]+$/g, ""));
  if (!text) return text;
  if (text.length <= 100 && !endsDangling(text) && hasFiniteVerb(text) && text.split(" ").length >= 4) {
    return text;
  }

  const contrast = text.match(/^(.*?),\s+(?:but|yet|whereas|although)\s+/i);
  if (contrast && clauseOk(contrast[1])) return contrast[1].trim();

  const atComma = longestCommaClause(text);
  if (atComma) return atComma;

  const butBare = text.match(/^(.*?)\s+but\s+/i);
  if (butBare && clauseOk(butBare[1])) return butBare[1].trim();

  const andSplit = text.match(/^(.*?)\s+and\s+/i);
  if (andSplit && clauseOk(andSplit[1])) return andSplit[1].trim();

  const words = text.split(" ");
  for (let count = Math.min(words.length, 18); count >= 4; count -= 1) {
    const slice = words.slice(0, count).join(" ").replace(/[,;:]+$/g, "");
    if (!endsDangling(slice) && hasFiniteVerb(slice) && slice.length <= 110) return slice;
  }

  const fallback = words.slice(0, 12).join(" ").replace(/[,;:]+$/g, "");
  return fallback.length > 0 ? fallback : text.slice(0, 110);
}

function splitSentences(text: string): string[] {
  return (text.match(/[^.!?]+(?:[.!?]+|(?=\s*$))/g) ?? [text])
    .map((part) => part.trim())
    .filter(Boolean);
}

function bodyOpensMidPhrase(body: string): boolean {
  const text = collapse(body);
  if (!/^[A-Z][\w’']*(?:,|\s+to\b|\s+of\b|\s+in\b)/.test(text)) return false;
  const beforeComma = text.split(",")[0] ?? text;
  return !hasFiniteVerb(beforeComma);
}

function shouldRejoin(title: string, body: string): boolean {
  const heading = collapse(title).replace(/[….]+$/g, "");
  const explanation = collapse(body);
  if (!heading || !explanation) return false;
  if (endsDangling(heading) || /[…]$/.test(heading) || heading.endsWith("...")) return true;
  if (/^[a-z“"]/.test(explanation) && !/^(e\.g\.|i\.e\.)/i.test(explanation)) return true;
  if (
    /^(but|yet|and|however)\s+(?!the\b|a\b|an\b|this\b|that\b|these\b|those\b|his\b|her\b|their\b|its\b|he\b|she\b|they\b|it\b)[a-z]/i.test(
      explanation,
    )
  ) {
    return true;
  }
  if (bodyOpensMidPhrase(explanation)) return true;
  return false;
}

export function isConceptLabel(title: string): boolean {
  const heading = collapse(title).replace(/[….]+$/g, "");
  if (!heading || heading.length > 48 || /\?$/.test(heading)) return false;
  if (endsDangling(heading) || hasFiniteVerb(heading)) return false;
  const words = heading.split(" ").filter(Boolean);
  return words.length >= 2 && words.length <= 8;
}

function titleRepeatsBody(title: string, body: string): boolean {
  const heading = collapse(title).replace(/[….]+$/g, "");
  const explanation = collapse(body);
  if (heading.length < 16 || explanation.length <= heading.length) return false;
  const words = heading.split(" ");
  const stable = words.length > 4 ? words.slice(0, -1).join(" ") : heading;
  const probe = stable.slice(0, 40).toLowerCase();
  return explanation.toLowerCase().startsWith(probe);
}

function isUnansweredChangeQuestion(title: string, body: string): boolean {
  if (!/^what changed after\b/i.test(title.trim())) return false;
  const event = title
    .trim()
    .replace(/^what changed after\s+/i, "")
    .replace(/\?+$/g, "")
    .trim();
  if (!event || VAGUE_EVENT.test(event)) return true;
  if (!CHANGE_LANGUAGE.test(body)) return true;
  const probe = event.toLowerCase().slice(0, 24);
  if (event.split(/\s+/).length >= 3 && !body.toLowerCase().includes(probe)) return true;
  return false;
}

function stripOverviewPreamble(text: string): string {
  const stripped = text.replace(
    /^[\s\S]{0,140}?\b(?:documentary|article|video|chapter|source)\s+overview\s+/i,
    "",
  );
  return stripped.length >= 40 ? collapse(stripped) : collapse(text);
}

function remainderHasSubject(text: string): boolean {
  return /^(the|a|an|this|that|these|those|his|her|their|its|he|she|they|it|we)\b/i.test(text);
}

function polishContrastBody(body: string): string {
  const raw = collapse(body).replace(/^(but|yet|and|however)\s+/i, "");
  if (raw === collapse(body)) return collapse(body);
  if (!remainderHasSubject(raw) || !hasFiniteVerb(raw)) return collapse(body);
  return sentenceCase(raw);
}

export function separateLearnCardCopy(
  title: string,
  content: string,
): { title: string; content: string } {
  const rawTitle = stripAnalysisTimecodes(collapse(title));
  const rawContent = stripAnalysisTimecodes(content);
  if (!rawContent || rawContent.includes("\n---\n")) {
    return { title: rawTitle, content: rawContent };
  }

  const cleaned = stripOverviewPreamble(rawContent);
  const rejoined = shouldRejoin(rawTitle, cleaned)
    ? collapse(
        `${rawTitle.replace(/[,;:….]+$/g, "")} ${
          /\d$/.test(rawTitle.trim())
            ? cleaned.charAt(0).toLowerCase() + cleaned.slice(1)
            : cleaned
        }`,
      )
    : cleaned;
  if (isConceptLabel(rawTitle) && !shouldRejoin(rawTitle, cleaned)) {
    const body = polishContrastBody(cleaned);
    if (body && !/^[a-z]/.test(body)) {
      return { title: rawTitle.replace(/[.]+$/g, ""), content: body };
    }
  }

  const replaceTitle =
    shouldRejoin(rawTitle, cleaned) ||
    isUnansweredChangeQuestion(rawTitle, rejoined) ||
    titleRepeatsBody(rawTitle, rejoined);

  if (!replaceTitle && clauseOk(rawTitle)) {
    const body = polishContrastBody(cleaned);
    if (!/^[a-z]/.test(body)) {
      return { title: rawTitle.replace(/[.]+$/g, ""), content: body };
    }
  }

  const sentences = splitSentences(rejoined);
  const first = sentences[0] ?? rejoined;
  const headline = declarativeCardHeadline(first).replace(/[.]+$/g, "");

  if (sentences.length >= 2 && clauseOk(headline)) {
    const firstBare = first.replace(/[.]+$/g, "");
    if (headline.length >= firstBare.length - 1) {
      return { title: headline, content: sentences.slice(1).join(" ") };
    }
  }

  return { title: headline, content: rejoined };
}

function cleanWhyAnswer(text: string): string {
  let clean = collapse(text).replace(/\s*(?:→|=>)\s*/g, " led to ");
  clean = clean.replace(/\bled to led to\b/gi, "led to");
  if (clean && !/[.!?]$/.test(clean)) clean += ".";
  return clean;
}

function asQuestionSubject(text: string): string {
  return text.replace(/^(A|An|The)\b/, (word) => word.toLowerCase());
}

function eventIsComplete(text: string): boolean {
  const clean = collapse(text).replace(/[.?!]+$/g, "");
  if (clean.length < 8 || clean.length > 90) return false;
  if (/^(he|she|they|it|this|that)\b/i.test(clean)) return false;
  if (/\b(?:1[0-9]|20)\d{2}$/.test(clean)) return true;
  return !endsDangling(clean);
}

const TIME_WORD =
  /^(early|earlier|late|later|mid|initial|recent|january|february|march|april|may|june|july|august|september|october|november|december)$/i;

const META_WHY_SUBJECT = /\b(scale|importance|significance|impact|reach)\b/i;

const CONSEQUENCE =
  /\b(because|led to|so that|which|resulting|resulted in|therefore|thus|caused|allowed|forced|trigger(?:ed|ing)?|precipitat\w*|marking|signaling|showing|intensifying|in order to)\b/i;

const FABRICATED_HOOK =
  /key turning point\s*(?:→|->)\s*institutional pressure|growth\s*(?:→|->)\s*rupture\s*(?:→|->)\s*resistance|3 july turned a club crisis/i;

function properName(text: string): string | null {
  const match = text.match(/\b[A-Z][\p{L}'’-]+(?:\s+[A-Z][\p{L}'’-]+){0,2}/u);
  if (!match) return null;
  if (/^(The|This|That|Why|How|But|And|His|Her|Early|Late|Mid)$/.test(match[0])) return null;
  if (TIME_WORD.test(match[0].split(/\s+/)[0] ?? "")) return null;
  if (/'s$|’s$/.test(match[0]) && match[0].split(/\s+/).length === 1) return null;
  return match[0];
}

function trimTrailingVerb(phrase: string): string {
  const verb =
    /^(raised|slowed|caused|made|joined|survived|led|rejected|shifted|marked|started|reduced|increased|failed|became|elevated|lifted)$/i;
  const words = phrase.split(" ");
  while (words.length > 2 && verb.test(words[words.length - 1] ?? "")) words.pop();
  return words.join(" ");
}

function namedEvent(text: string): string | null {
  const dated = text.match(
    /\b(the\s+[12]\d{3}\s+[A-Z][\p{L}'’-]+(?:\s+[a-z][\p{L}'’-]+){0,3})\b/u,
  );
  if (dated && eventIsComplete(dated[1])) return trimTrailingVerb(dated[1]);

  const article = text.match(
    /\b((?:the|a|an)\s+[a-z][\p{L}'’-]+(?:\s+[a-z][\p{L}'’-]+){0,3})\b/iu,
  );
  if (
    article &&
    eventIsComplete(article[1]) &&
    !/\b(the|a|an)\s+(start|query|mid|result|same|other|following)\b/i.test(article[1])
  ) {
    return trimTrailingVerb(article[1]);
  }
  return null;
}

function answerStatesConsequence(answer: string): boolean {
  return CONSEQUENCE.test(answer);
}

/** A why-subject must name a real person or event, not a date fragment. */
export function whySubjectIsUsable(subject: string): boolean {
  const clean = collapse(subject).replace(/\?+$/g, "");
  if (clean.length < 8 || clean.length > 90) return false;
  if (META_WHY_SUBJECT.test(clean)) return false;
  if (/\b(he|she|they|this event|this point|this claim|the source)\b/i.test(clean)) return false;
  if (/\b(could|would|should|might|cannot|did|does|was|were|is|are|had|have|has|been)\b/i.test(clean)) {
    return false;
  }
  const withoutArticle = clean.replace(/^(?:the|a|an)\s+/i, "");
  const first = withoutArticle.split(/\s+/)[0]?.replace(/['’]s$/i, "") ?? "";
  if (TIME_WORD.test(first)) return false;
  if (/^(early|late|mid)$/i.test(first)) return false;
  const content = withoutArticle
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(
      (word) =>
        word.length > 3 &&
        !TIME_WORD.test(word) &&
        !/^(with|from|this|that|have|been|into|when|after|before|during)$/.test(word),
    );
  if (content.length < 2) return false;
  if (/\b(?:1[0-9]|20)\d{2}$/.test(clean)) return true;
  return !endsDangling(clean);
}

function isGoodWhyQuestion(title: string, answer: string): boolean {
  const question = collapse(title);
  if (!/^(why|how)\b/i.test(question) || !question.endsWith("?")) return false;
  if (
    /\b(this event|this point|this document|this claim|main subject|pivotal moment|become decisive|matter here)\b/i.test(
      question,
    )
  ) {
    return false;
  }
  if (/\b(he|she|they)\b/i.test(question)) return false;
  if (endsDangling(question.replace(/\?$/, "")) && !/\b(?:1[0-9]|20)\d{2}\?$/.test(question)) {
    return false;
  }
  const matterSubject = question.match(/^why (?:did|does|do) (.+?) matter\b/i)?.[1];
  if (matterSubject && !whySubjectIsUsable(matterSubject)) return false;
  if (!answerStatesConsequence(answer)) return false;
  const words = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !/^(why|how|does|did|what|that|with|from|this|have|been|matter|here)$/.test(word));
  const answerText = answer.toLowerCase();
  const hits = words.filter((word) => answerText.includes(word));
  return hits.length >= 2;
}

function acceptableWhyQuestion(question: string): string | null {
  const clean = collapse(question);
  if (clean.length > 120 || !clean.endsWith("?")) return null;
  const subject = clean.match(/^Why did (.+?) matter\?$/)?.[1];
  if (!subject || !whySubjectIsUsable(subject)) return null;
  return clean;
}

function whyQuestionFromAnswer(answer: string): string | null {
  const text = collapse(answer).replace(/[.]+$/g, "");
  if (!answerStatesConsequence(text)) return null;
  const name = properName(text);

  const signal = text.match(
    /,\s+(?:signaling|showing|marking)\s+(?:his|her|their|its|an|a|the)?\s*(.+)$/i,
  );
  if (signal && name) {
    const point = signal[1].replace(/^(?:early|initial|later)\s+/i, "").trim();
    const question = acceptableWhyQuestion(`Why did ${name}'s ${point} matter?`);
    if (question && eventIsComplete(point)) return question;
  }

  const which = text.match(/,\s+which\s+[\s\S]+$/i);
  if (which) {
    const before = text.slice(0, text.length - which[0].length);
    const event = namedEvent(before) ?? namedEvent(text);
    if (event) return acceptableWhyQuestion(`Why did ${asQuestionSubject(event)} matter?`);
  }

  const led = text.match(/^(.+?)\s+led to\s+/i);
  if (led && eventIsComplete(led[1])) {
    return acceptableWhyQuestion(`Why did ${asQuestionSubject(led[1].trim())} matter?`);
  }

  const because = text.match(/^(.+?)\s+because\s+/i);
  if (because) {
    const beforeVerb = because[1].match(
      /^(.+?)\s+\b(?:slowed|raised|caused|made|left|broke|failed|reduced|increased|cut|stopped|blocked|forced|let|kept|sent|drove)\b/i,
    );
    const subject = beforeVerb?.[1]?.trim() ?? namedEvent(because[1]);
    if (subject && eventIsComplete(subject)) {
      return acceptableWhyQuestion(`Why did ${asQuestionSubject(subject)} matter?`);
    }
  }

  const event = namedEvent(text);
  if (event) return acceptableWhyQuestion(`Why did ${asQuestionSubject(event)} matter?`);
  return null;
}

/**
 * Why-card title is a question the answer actually explains.
 * Returns null when the sentence has no complete subject and no consequence —
 * callers drop the card instead of inventing "Why did December matter?".
 */
export function formatWhyCard(
  title: string,
  content: string,
): { title: string; content: string } | null {
  const answer = cleanWhyAnswer(stripOverviewPreamble(stripAnalysisTimecodes(content)));
  const current = stripAnalysisTimecodes(collapse(title));
  if (!answer) return null;
  if (answer.includes("\n---\n")) return { title: current, content: answer };
  if (isGoodWhyQuestion(current, answer)) return { title: current, content: answer };
  const next = whyQuestionFromAnswer(answer);
  if (!next) return null;
  return { title: next, content: answer };
}

function isTruncatedQuestion(title: string): boolean {
  const text = collapse(title);
  if (!text) return false;
  const quotes = text.match(/[“”"]/g)?.length ?? 0;
  if (quotes % 2 === 1) return true;
  return /^(what|why|how|which|when|who|where)\b/i.test(text) && !text.endsWith("?");
}

/** True when the answer is the cut-off tail of the question, not a full reply. */
export function answerStartsAsCut(question: string, answer: string): boolean {
  const q = collapse(question).replace(/[?]+$/g, "");
  const a = collapse(answer);
  if (!q || !a) return true;
  if (a.toLowerCase() === q.toLowerCase()) return true;
  if (q.length >= 40 && a.toLowerCase().startsWith(q.toLowerCase())) return true;
  if (/^(and|but|or|which|that|who|whose|setting|including|resulting|while)\b/i.test(a)) return true;
  if (isTruncatedQuestion(question)) return true;
  const qWords = q.toLowerCase().split(/\s+/).filter((word) => word.length > 2);
  const aWords = a.toLowerCase().split(/\s+/).filter((word) => word.length > 2);
  if (qWords.length >= 4 && aWords.length >= 4 && aWords.slice(0, 4).join(" ") === qWords.slice(-4).join(" ")) {
    return true;
  }
  return false;
}

function wholeFact(title: string, content: string): string {
  const body = collapse(content);
  if (title.trim().endsWith("?")) return body;
  const heading = collapse(title).replace(/[….?]+$/g, "");
  if (isTruncatedQuestion(title)) return body;
  if (!heading) return body;
  if (!body) return /[.!?]$/.test(heading) ? heading : `${heading}.`;
  const head = heading.toLowerCase();
  const host = body.toLowerCase();
  if (host.startsWith(head.slice(0, Math.min(head.length, 48)))) return body;
  const continues =
    endsDangling(heading) ||
    /[,;:]$/.test(heading) ||
    /^(and|but|or|which|that|who|setting|including|resulting|while)\b/i.test(body);
  if (continues) {
    const joined = collapse(`${heading.replace(/[,;:]+$/g, "")} ${body.charAt(0).toLowerCase()}${body.slice(1)}`);
    return /[.!?]$/.test(joined) ? joined : `${joined}.`;
  }
  return body;
}

function nounSubject(clause: string): string | null {
  const cleaned = collapse(clause).replace(/^(yet|but|and|however|then)\s+/i, "");
  const event = namedEvent(cleaned);
  if (event && whySubjectIsUsable(event)) return asQuestionSubject(event);
  const beforeVerb = cleaned.match(
    /^((?:the|a|an)\s+[\p{L}0-9'’-]+(?:\s+[\p{L}0-9'’-]+){1,6})\s+\b(?:sowed|set|led|caused|became|began|ended|left|made|kept|raised|slowed|marked|launched|issued|died)\b/iu,
  );
  if (beforeVerb && whySubjectIsUsable(beforeVerb[1])) return asQuestionSubject(beforeVerb[1]);
  return null;
}

function effectPhrase(text: string): string | null {
  const clean = collapse(text).replace(/[.]+$/g, "");
  if (clean.length < 8 || clean.length > 80 || endsDangling(clean)) return null;
  if (TIME_WORD.test(clean.split(/\s+/)[0] ?? "")) return null;
  return clean;
}

function linkQuestion(fact: string): string | null {
  const text = collapse(fact).replace(/[.]+$/g, "");
  const pivot = text.match(
    /^(.{12,140}?)\s+(led to|set the stage for|setting the stage for|resulted in|resulting in)\s+(.{8,80})$/i,
  );
  if (!pivot) return null;
  const cause = nounSubject(pivot[1]);
  const effect = effectPhrase(pivot[3]);
  if (!cause || !effect) return null;
  const relation = /setting the stage/i.test(pivot[2])
    ? "set the stage for"
    : /resulting in/i.test(pivot[2])
      ? "result in"
      : pivot[2].toLowerCase();
  const question = `How did ${cause} ${relation} ${effect}?`;
  if (question.length > 140 || answerStartsAsCut(question, fact)) return null;
  return question;
}

function conceptQuestion(fact: string): string | null {
  const event = namedEvent(fact);
  if (event && whySubjectIsUsable(event)) {
    const question = `What followed ${asQuestionSubject(event)}?`;
    if (!answerStartsAsCut(question, fact)) return question;
  }
  const name = properName(fact);
  if (name && !TIME_WORD.test(name) && fact.length > name.length + 24) {
    const question = `What did ${name} change here?`;
    if (!answerStartsAsCut(question, fact)) return question;
  }
  return null;
}

function hookFromFact(fact: string): { title: string; content: string } | null {
  if (fact.length < 18 || fact.length > 140) return null;
  if (/↔|→|\.{3}|…/.test(fact)) return null;
  const label = properName(fact);
  if (!label || label.length < 3 || label.length > 32 || TIME_WORD.test(label)) return null;
  if (answerStartsAsCut(label, fact)) return null;
  return { title: label, content: fact };
}

/**
 * One complete question and one complete answer.
 * The answer is the whole fact. It is never the leftover half of the question.
 */
export function repairStudyCard(
  type: string,
  title: string,
  content: string,
): { type: string; title: string; content: string } | null {
  const heading = collapse(stripAnalysisTimecodes(title));
  const body = collapse(stripAnalysisTimecodes(content));
  if (type === "quiz" && heading && body) {
    // Never collapse across the Q/A delimiter: `collapse()` would turn
    // "\n---\n" into " --- ", the answer would stop parsing, and every quiz
    // card would fail validation downstream (silently shrinking the deck).
    const delimiterAt = content.indexOf(QUIZ_ANSWER_DELIMITER);
    const rawQuestion = delimiterAt === -1 ? content : content.slice(0, delimiterAt);
    const rawAnswer =
      delimiterAt === -1 ? "" : content.slice(delimiterAt + QUIZ_ANSWER_DELIMITER.length);
    const question = collapse(rawQuestion);
    const answer = collapse(rawAnswer);
    if (question && answer) {
      return { type, title: heading, content: `${question}${QUIZ_ANSWER_DELIMITER}${answer}` };
    }
    return { type, title: heading, content: body };
  }
  if (!body || body.includes("\n---\n")) return null;
  if (isFabricatedMemoryHook(heading) || isFabricatedMemoryHook(body)) return null;

  const fact = wholeFact(heading, body);
  if (fact.length < 24) return null;

  if (
    isConceptLabel(heading) &&
    !answerStartsAsCut(heading, fact) &&
    fact.toLowerCase() !== heading.toLowerCase()
  ) {
    const kept = type === "why" || type === "why_it_matters" || type === "memory_hook" ? "concept" : type;
    return { type: kept, title: heading, content: fact };
  }

  if (/…|\.\.\.|↔/.test(fact)) return null;
  if (!heading.endsWith("?") || isTruncatedQuestion(heading) || isRejectedStudyQuestion(heading)) {
    return null;
  }
  if (answerStartsAsCut(heading, fact)) return null;
  if (type === "why" || type === "why_it_matters") {
    if (!isGoodWhyQuestion(heading, fact)) return null;
    return { type, title: heading, content: fact };
  }
  if (type === "memory_hook") return null;
  return { type, title: heading, content: fact };
}

/** Local templates must not mint a question. These shells are dropped, not rewritten. */
function isRejectedStudyQuestion(title: string): boolean {
  const question = collapse(title);
  if (/^what followed\b/i.test(question)) return true;
  if (/change here\??$/i.test(question)) return true;
  if (/main forces in this narrative/i.test(question)) return true;
  if (/\b(and later|and signs)\b/i.test(question)) return true;
  if (/\bintervenes\??$/i.test(question)) return true;
  if (/'s forced matter\??$/i.test(question)) return true;
  return false;
}

/** Title is the cut-off start of the answer sentence. */
export function isClippedSentencePair(title: string, body: string): boolean {
  const heading = collapse(title).replace(/[….]+$/g, "");
  const explanation = collapse(body);
  if (!heading || !explanation || /\?$/.test(title.trim())) return false;
  const probe = heading.toLowerCase();
  const host = explanation.toLowerCase();
  const repeated = host.startsWith(probe.slice(0, Math.min(probe.length, 48))) || host.includes(probe);
  if (!repeated) return false;
  if (endsDangling(heading)) return true;
  return heading.length >= 72;
}

export function isFabricatedMemoryHook(content: string): boolean {
  return FABRICATED_HOOK.test(content.trim());
}

/** Applies to every lens and every source. A card stays only as a distinct pair. */
export function isPublishableStudyCard(type: string, title: string, content: string): boolean {
  const heading = title.trim();
  const body = content.trim();
  if (!heading || !body) return false;
  if (isFabricatedMemoryHook(body) || isFabricatedMemoryHook(heading)) return false;

  if (type === "quiz") return true;

  if (type === "why" || type === "why_it_matters") {
    return isGoodWhyQuestion(heading, body);
  }

  if (type === "memory_hook") {
    if (body.length < 12 || body.length > 140) return false;
    if (/↔|…|\.{3}/.test(body)) return false;
    return !isClippedSentencePair(heading, body);
  }

  if (isClippedSentencePair(heading, body)) return false;
  return body.length >= 24;
}
