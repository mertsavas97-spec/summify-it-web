/**
 * SERVER ONLY — deep learn layer from analysis results (no persistence, no extra AI call).
 */

import type { AnalysisResult, LearnCardOutput, TextAnalysisMode } from "@/server/ai/schemas";
import { buildLearnKindTargets } from "@/server/intelligence/mode-routing";
import type { ComplexityLevel } from "@/server/intelligence/types";
import type { LearnWeightingProfile } from "@/types/modes";
import { dedupeLearnCandidates } from "./dedupeLearnCards";
import { rankLearnCandidates } from "./rankLearnCandidates";
import {
  polishPresentationCardContent,
  refinePresentationLearnTitle,
} from "./presentationSemanticTitles";
import { refineSemanticTitle } from "./refineLearnTitle";
import { isLowQualityPresentationFragment } from "@/server/presentation/presentationFragments";
import { buildAdaptiveLearnProfile } from "@/lib/cognition/adaptiveLearnProfiles";
import { filterLearnCandidates } from "@/lib/cognition/learnQualityFilters";
import type {
  BuildLearnIntelligenceOptions,
  BuildLearnIntelligenceResult,
  LearnCandidate,
  LearnCardKind,
  LearnCardCountRange,
} from "./types";
import { synthesizeProfileLearnCandidates } from "./profileLearnSynthesis";
import {
  attachCardRelationships,
  buildLearnDebugMeta,
  candidateToEnrichedOutput,
  enrichCandidatesForProfile,
  sortCandidatesByGroups,
} from "./adaptiveLearnEnrichment";
import {
  applyStrategyToCandidateRanking,
  applyStrategyToLearnCards,
  filterCandidatesByStrategy,
  learnStrategyDebugStats,
  resolveLearnStrategy,
  selectCandidatesByStrategy,
} from "./applyModeLearnStrategy";
import {
  applyLearnCardQuality,
  learnCardQualityDebugStats,
} from "./learnCardQuality";
import {
  applyLearningProgression,
  learnProgressionDebugStats,
} from "./learningProgression";
import {
  attachSourceTraceToLearnCards,
  sourceTraceDebugStats,
  type CandidateTraceHint,
} from "./sourceTrace";

const GENERIC_PHRASES = [
  /engaging experience/i,
  /enhance productivity/i,
  /improve engagement/i,
  /best practices/i,
  /share on social media/i,
  /engage (your )?audience/i,
];

const NARRATOR_OPENERS = [
  /^(the speaker|the video|the presenter) (discusses|talks about|covers|explains)\s+/i,
  /^this video (discusses|covers|explains)\s+/i,
];

function mapProviderType(type: string): LearnCardKind {
  if (type === "why") return "why_it_matters";
  if (
    type === "concept" ||
    type === "memory_hook" ||
    type === "quiz" ||
    type === "why_it_matters" ||
    type === "connection" ||
    type === "misconception"
  ) {
    return type as LearnCardKind;
  }
  return "concept";
}

function cardCountForComplexity(complexity: ComplexityLevel): LearnCardCountRange {
  switch (complexity) {
    case "low":
      return { min: 3, max: 5 };
    case "high":
      return { min: 8, max: 10 };
    default:
      return { min: 5, max: 7 };
  }
}

function modeKindTargets(
  mode: TextAnalysisMode,
  targetCount: number,
): Partial<Record<LearnCardKind, number>> {
  const base: Partial<Record<LearnCardKind, number>> = {
    concept: 2,
    why_it_matters: 1,
    memory_hook: 1,
    quiz: 1,
  };

  switch (mode) {
    case "creator":
      return {
        connection: Math.min(2, Math.ceil(targetCount * 0.25)),
        memory_hook: Math.min(2, Math.ceil(targetCount * 0.22)),
        concept: 1,
        quiz: 1,
        why_it_matters: 1,
      };
    case "academic":
      return {
        concept: Math.min(3, Math.ceil(targetCount * 0.35)),
        misconception: Math.min(2, Math.ceil(targetCount * 0.22)),
        quiz: 1,
        why_it_matters: 1,
      };
    case "executive":
      return {
        why_it_matters: Math.min(3, Math.ceil(targetCount * 0.35)),
        concept: 2,
        memory_hook: 1,
        quiz: 1,
      };
    case "legal":
      return {
        concept: Math.min(3, Math.ceil(targetCount * 0.3)),
        why_it_matters: 2,
        misconception: 1,
        quiz: 1,
      };
    default:
      return base;
  }
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 50 && s.length <= 320);
}

function extractEntities(corpus: string): Set<string> {
  const matches =
    corpus.match(/\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}|[A-Z]{2,})\b/g) ?? [];
  return new Set(matches.map((m) => m.toLowerCase()));
}

function isGeneric(text: string): boolean {
  return GENERIC_PHRASES.some((p) => p.test(text));
}

function makeCandidate(
  kind: LearnCardKind,
  title: string,
  content: string,
  source: LearnCandidate["source"],
): LearnCandidate | null {
  const t = title.trim();
  const c = content.trim();
  if (!t || !c || isGeneric(`${t} ${c}`)) return null;
  return {
    kind,
    title: t.slice(0, 72),
    content: c.slice(0, 380),
    source,
    importance: 0.5,
    entities: [],
  };
}

function refineAllTitles(
  candidates: LearnCandidate[],
  entitySet: Set<string>,
  documentTitle?: string,
  isPresentation?: boolean,
): LearnCandidate[] {
  return candidates.map((c) => ({
    ...c,
    title: isPresentation
      ? refinePresentationLearnTitle(c, entitySet)
      : refineSemanticTitle(c, entitySet, documentTitle),
  }));
}

const GENERIC_MYTH_TITLES =
  /^(myth|misconception|clarify the risk|why it matters|importance of|approach critically|potential bias)/i;

function filterCandidatesByLearnSourcePolicy(
  candidates: LearnCandidate[],
  allowed?: LearnCandidate["source"][],
  blocked?: LearnCandidate["source"][],
): LearnCandidate[] {
  return candidates.filter((c) => {
    if (blocked?.includes(c.source)) return false;
    if (allowed && allowed.length > 0 && !allowed.includes(c.source)) return false;
    return true;
  });
}

function candidatesFromAnalysis(
  result: AnalysisResult,
  isDeckSource: boolean,
  flags: {
    suppressRiskActionLearnSynthesis?: boolean;
    suppressMisconceptionUnlessExplicit?: boolean;
    deprioritizeSummaryLearnSynthesis?: boolean;
  },
): LearnCandidate[] {
  const out: LearnCandidate[] = [];

  for (const card of result.learnCards) {
    const c = makeCandidate(
      mapProviderType(card.type),
      card.title,
      card.content,
      "ai_card",
    );
    if (c) out.push(c);
  }

  result.keyInsights.forEach((insight, i) => {
    const c = makeCandidate(
      i % 2 === 0 ? "concept" : "why_it_matters",
      insight.slice(0, 56),
      insight,
      "insight",
    );
    if (c) out.push(c);
  });

  if (!isDeckSource && !flags.deprioritizeSummaryLearnSynthesis) {
    splitSentences(result.summary).slice(0, 2).forEach((sentence) => {
      const c = makeCandidate(
        "concept",
        sentence.slice(0, 56),
        sentence,
        "summary",
      );
      if (c) out.push(c);
    });
  }

  if (!flags.suppressRiskActionLearnSynthesis) {
    result.risksOrWarnings.slice(0, 3).forEach((risk) => {
      if (/does not provide enough/i.test(risk)) return;
      if (
        /approach critically|consider potential bias|further research/i.test(risk)
      ) {
        return;
      }
      const c = makeCandidate("misconception", risk.slice(0, 48), risk, "risk");
      if (c && flags.suppressMisconceptionUnlessExplicit) {
        if (GENERIC_MYTH_TITLES.test(c.title)) return;
      }
      if (c) out.push(c);
    });
  }

  if (!isDeckSource && !flags.suppressRiskActionLearnSynthesis) {
    result.actionItems.slice(0, 2).forEach((action) => {
      if (/approach critically|further research|verify with a professional/i.test(action)) {
        return;
      }
      const c = makeCandidate("why_it_matters", action.slice(0, 48), action, "action");
      if (c) out.push(c);
    });
  }

  for (let i = 0; i < result.keyInsights.length - 1; i += 2) {
    const a = result.keyInsights[i];
    const b = result.keyInsights[i + 1];
    if (!b) continue;
    const c = makeCandidate(
      "connection",
      a.slice(0, 40),
      `${a}\n\n↔ ${b}`,
      "synthesized",
    );
    if (c) out.push(c);
  }

  const hookSource =
    result.keyInsights[0] ?? result.summary.split(/(?<=[.!?])\s+/)[0] ?? result.title;
  if (hookSource && hookSource.length > 12) {
    const hook = makeCandidate("memory_hook", hookSource.slice(0, 48), hookSource, "synthesized");
    if (hook) out.push(hook);
  }

  return out;
}

function synthesizeQuizCards(
  result: AnalysisResult,
  existing: LearnCandidate[],
  entitySet: Set<string>,
): LearnCandidate[] {
  const quizzes: LearnCandidate[] = [];
  const insights = result.keyInsights.slice(0, 3);

  for (const insight of insights) {
    const entities = insight.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g);
    const subject = entities?.[0] ?? "this source";
    const question = `What claim does the source make about ${subject}?`;
    const answer = insight;
    const draft = makeCandidate(
      "quiz",
      question.slice(0, 56),
      `${question}\n---\n${answer}`,
      "synthesized",
    );
    if (draft) {
      quizzes.push({
        ...draft,
        title: refineSemanticTitle(draft, entitySet, result.title),
      });
    }
  }

  if (quizzes.length === 0 && existing.length > 0) {
    const ref = existing[0];
    const draft = makeCandidate(
      "quiz",
      ref.title,
      `What does “${ref.title}” refer to in this document?\n---\n${ref.content.slice(0, 200)}`,
      "synthesized",
    );
    if (draft) {
      quizzes.push({
        ...draft,
        title: refineSemanticTitle(draft, entitySet, result.title),
      });
    }
  }

  return quizzes;
}

function selectDiversified(
  ranked: LearnCandidate[],
  mode: TextAnalysisMode,
  range: LearnCardCountRange,
  learnWeighting?: LearnWeightingProfile,
): LearnCandidate[] {
  const target = range.max;
  const targets = learnWeighting
    ? buildLearnKindTargets(mode, learnWeighting, target)
    : modeKindTargets(mode, target);
  const selected: LearnCandidate[] = [];
  const used = new Set<string>();

  const pick = (kind: LearnCardKind, limit: number) => {
    let count = 0;
    for (const c of ranked) {
      if (c.kind !== kind) continue;
      const key = c.title.toLowerCase();
      if (used.has(key)) continue;
      selected.push(c);
      used.add(key);
      count += 1;
      if (count >= limit) break;
    }
  };

  for (const [kind, limit] of Object.entries(targets)) {
    if (limit && limit > 0) pick(kind as LearnCardKind, limit);
  }

  for (const c of ranked) {
    if (selected.length >= target) break;
    const key = c.title.toLowerCase();
    if (used.has(key)) continue;
    selected.push(c);
    used.add(key);
  }

  return selected.slice(0, target);
}

function denarrateContent(content: string): string {
  let text = content.trim();
  for (const pattern of NARRATOR_OPENERS) {
    text = text.replace(pattern, "");
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function polishLearnContent(
  kind: LearnCardKind,
  content: string,
  flags: { isYoutube: boolean; isPresentation: boolean },
): string {
  let text = content.trim();
  if (flags.isYoutube) {
    text = denarrateContent(text);
    if (kind === "connection") {
      text = text.replace(/^connect\s+/i, "").replace(/…/g, "").trim();
    }
  }
  if (flags.isPresentation) {
    text = polishPresentationCardContent(kind, text);
    text = text.replace(/---\s*slide\s+\d+[^-]*---/gi, "").trim();
  }
  const maxLen = flags.isYoutube || flags.isPresentation ? 240 : 320;
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

function toLearnCardOutput(
  candidate: LearnCandidate,
  flags: { isYoutube: boolean; isPresentation: boolean },
): LearnCardOutput {
  const base: LearnCardOutput = {
    type: candidate.kind as LearnCardOutput["type"],
    title: candidate.title.slice(0, 56),
    content: polishLearnContent(candidate.kind, candidate.content, flags),
  };
  return candidateToEnrichedOutput(candidate, base);
}

function shouldDeprioritizeSummary(profileId: string): boolean {
  return (
    profileId.startsWith("learn_historical") ||
    profileId.startsWith("learn_scientific") ||
    profileId.startsWith("learn_literary") ||
    profileId.startsWith("learn_technical")
  );
}

/**
 * Build adaptive learn cards from a validated analysis result.
 */
export function buildLearnIntelligence(
  result: AnalysisResult,
  options: BuildLearnIntelligenceOptions,
): BuildLearnIntelligenceResult {
  const learnProfile =
    options.adaptiveLearnProfile ??
    (options.personaAdaptivePlan
      ? buildAdaptiveLearnProfile(options.personaAdaptivePlan)
      : undefined);

  const learnStrategy = resolveLearnStrategy({
    modeId: options.intelligenceModeId,
    structureFamily: options.personaAdaptivePlan?.structureFamily,
    domain: learnProfile?.documentDomain ?? options.personaAdaptivePlan?.documentDomain,
    personaId: options.personaAdaptivePlan?.personaId ?? learnProfile?.personaId,
    pipelineMode: options.mode,
  });

  const corpus = [
    result.title,
    result.summary,
    ...result.keyInsights,
    ...result.risksOrWarnings,
  ].join(" ");
  const entitySet = extractEntities(corpus);
  const isPresentation = options.isPresentation === true;
  const isDeckSource = options.isYoutubeTranscript === true || isPresentation;

  const learnFlags = {
    suppressRiskActionLearnSynthesis: options.suppressRiskActionLearnSynthesis,
    suppressMisconceptionUnlessExplicit: options.suppressMisconceptionUnlessExplicit,
    deprioritizeSummaryLearnSynthesis:
      options.deprioritizeSummaryLearnSynthesis ??
      (learnProfile ? shouldDeprioritizeSummary(learnProfile.profileId) : false),
  };

  const profileCandidates = learnProfile
    ? synthesizeProfileLearnCandidates(result, learnProfile)
    : [];

  const policyFiltered = filterLearnCandidates(
    filterCandidatesByLearnSourcePolicy(
      [...candidatesFromAnalysis(result, isDeckSource, learnFlags), ...profileCandidates],
      options.allowedLearnSourceSections,
      options.blockedLearnSourceSections,
    ),
  );

  const { candidates: strategyFilteredCandidates, filteredCount: strategyFilteredCount } =
    filterCandidatesByStrategy(policyFiltered, learnStrategy);

  const baseCandidates = strategyFilteredCandidates.filter((c) => {
    if (!isPresentation) return true;
    return !(
      isLowQualityPresentationFragment(c.title) &&
      isLowQualityPresentationFragment(c.content.slice(0, 120))
    );
  });
  const quizCards = synthesizeQuizCards(result, baseCandidates, entitySet);
  const withTitles = refineAllTitles(
    [...baseCandidates, ...quizCards],
    entitySet,
    result.title,
    isPresentation,
  );

  const rankedBase = rankLearnCandidates(withTitles, options.mode, entitySet, {
    isPresentation,
  });
  const { candidates: ranked, boostedCount: strategyBoostedCount } =
    applyStrategyToCandidateRanking(rankedBase, learnStrategy);
  const deduped = dedupeLearnCandidates(
    ranked,
    result.summary,
    isDeckSource ? 0.58 : 0.62,
    result.keyInsights,
    { isPresentation },
  );
  const range = cardCountForComplexity(options.complexity);
  const selectionPool = learnProfile
    ? [...enrichCandidatesForProfile(deduped, learnProfile)].sort(
        (a, b) => b.importance - a.importance,
      )
    : deduped;

  let selected = selectCandidatesByStrategy(selectionPool, learnStrategy, range);
  if (selected.length < range.min) {
    selected = selectDiversified(selectionPool, options.mode, range, options.learnWeighting);
  }

  if (learnProfile) {
    selected = sortCandidatesByGroups(
      attachCardRelationships(enrichCandidatesForProfile(selected, learnProfile)),
      learnProfile,
    );
  }

  const outputFlags = {
    isYoutube: options.isYoutubeTranscript === true,
    isPresentation,
  };
  const candidateHints = new Map<string, CandidateTraceHint>();
  const finalCards = selected.map((c, i) => {
    const out = toLearnCardOutput(c, outputFlags);
    const id = out.cardId ?? `learn_${i}_${c.kind}`;
    candidateHints.set(id, { source: c.source, groupTitle: c.groupTitle });
    return out;
  });
  if (finalCards.length < range.min) {
    const usedTitles = new Set(finalCards.map((c) => c.title.toLowerCase()));
    for (let i = 0; i < deduped.length; i++) {
      const c = deduped[i];
      if (finalCards.length >= range.min) break;
      if (usedTitles.has(c.title.toLowerCase())) continue;
      const out = toLearnCardOutput(c, outputFlags);
      const id = out.cardId ?? `learn_fill_${i}_${c.kind}`;
      candidateHints.set(id, { source: c.source, groupTitle: c.groupTitle });
      finalCards.push(out);
      usedTitles.add(c.title.toLowerCase());
    }
  }

  const strategyPass = applyStrategyToLearnCards(
    finalCards.slice(0, range.max),
    learnStrategy,
    range.max,
  );
  strategyPass.stats.strategyFilteredCount += strategyFilteredCount;
  strategyPass.stats.strategyBoostedCount += strategyBoostedCount;

  const quality = applyLearnCardQuality(strategyPass.items, {
    documentTitle: result.title,
    summary: result.summary,
    keyInsights: result.keyInsights,
    targetMin: range.min,
    targetMax: range.max,
    strategy: learnStrategy,
  });
  const progression = applyLearningProgression(quality.cards, learnStrategy, {
    targetMax: range.max,
  });
  const progressionDebug = learnProgressionDebugStats(progression.stats);

  const traced = attachSourceTraceToLearnCards(progression.cards, {
    analysis: result,
    personaAdaptivePlan: options.personaAdaptivePlan,
    extractedText: options.extractedText,
    uiSectionLabels: options.personaAdaptivePlan?.uiSectionLabels,
    candidateHints,
  });
  const traceDebug = sourceTraceDebugStats(traced.stats);

  const qualityDebug = learnCardQualityDebugStats(quality.stats);
  const strategyDebug = learnStrategyDebugStats(strategyPass.stats);

  const adaptiveLearnMeta = learnProfile
    ? buildLearnDebugMeta(
        attachCardRelationships(enrichCandidatesForProfile(selected, learnProfile)),
        learnProfile,
      )
    : undefined;

  if (qualityDebug && adaptiveLearnMeta) {
    adaptiveLearnMeta.learnCardQuality = qualityDebug;
  }
  if (strategyDebug && adaptiveLearnMeta) {
    adaptiveLearnMeta.learnStrategy = strategyDebug;
  }
  if (progressionDebug && adaptiveLearnMeta) {
    adaptiveLearnMeta.learnProgression = progressionDebug;
  }
  if (traceDebug && adaptiveLearnMeta) {
    adaptiveLearnMeta.sourceTrace = traceDebug;
  }

  return {
    learnCards: traced.cards,
    meta: {
      candidateCount: withTitles.length,
      selectedCount: traced.cards.length,
      complexity: options.complexity,
      mode: options.mode,
      ...(adaptiveLearnMeta ? { adaptiveLearn: adaptiveLearnMeta } : {}),
      ...(qualityDebug ? { learnCardQuality: qualityDebug } : {}),
      ...(strategyDebug ? { learnStrategy: strategyDebug } : {}),
      ...(progressionDebug ? { learnProgression: progressionDebug } : {}),
      ...(traceDebug ? { sourceTrace: traceDebug } : {}),
    },
  };
}
