/**
 * Phase 11D — domain-aware candidate synthesis (no extra LLM call).
 */

import type { AnalysisResult } from "@/server/ai/schemas";
import type { AdaptiveLearnProfile, LearnCardPattern } from "@/types/adaptive-learn";
import type { LearnCandidate, LearnCardKind } from "./types";

function slugId(prefix: string, index: number): string {
  return `${prefix}_${index}`;
}

function draft(
  kind: LearnCardKind,
  title: string,
  content: string,
  pattern: LearnCardPattern,
  groupId?: string,
): LearnCandidate {
  return {
    kind,
    title: title.slice(0, 72),
    content: content.slice(0, 380),
    source: "synthesized",
    importance: 0.62,
    entities: [],
    cardId: undefined,
    learnPattern: pattern,
    groupId,
  };
}

const YEAR = /\b(1[0-9]{3}|20[0-2][0-9])\b/;
const CAUSAL = /\b(because|therefore|thus|led to|resulted in|caused|due to)\b/i;
const MECHANISM = /\b(mechanism|process|step|pathway|cycle|reaction|system)\b/i;
const THEME = /\b(theme|motif|symbol|metaphor|imagery|tone|voice)\b/i;
const METRIC = /\b(\d+%|\$\d|revenue|margin|KPI|growth|cost)\b/i;

function historicalCandidates(result: AnalysisResult, profile: AdaptiveLearnProfile): LearnCandidate[] {
  const out: LearnCandidate[] = [];
  const insights = result.keyInsights.slice(0, 8);

  insights.forEach((line, i) => {
    if (YEAR.test(line)) {
      const c = draft(
        "memory_hook",
        line.slice(0, 48),
        line,
        "timeline_chain",
        "timeline_recall",
      );
      if (c) out.push({ ...c, cardId: slugId("tl", i), importance: 0.72 });
    }
    if (CAUSAL.test(line) && i > 0) {
      const prev = insights[i - 1];
      const c = draft(
        "connection",
        "Cause → effect",
        `${prev}\n\n→ ${line}`,
        "cause_effect_chain",
        "causes_consequences",
      );
      if (c) out.push({ ...c, cardId: slugId("fx", i), importance: 0.7 });
    }
    const figures = line.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g);
    if (figures?.[0]) {
      const c = draft(
        "concept",
        figures[0].slice(0, 48),
        line,
        "figure_significance",
        "key_figures",
      );
      if (c) out.push({ ...c, cardId: slugId("fig", i), importance: 0.65 });
    }
  });

  if (out.length < 2 && result.summary.length > 80) {
    const sentence = result.summary.split(/(?<=[.!?])\s+/)[0];
    if (sentence) {
      out.push({
        ...draft("concept", "Historical frame", sentence, "historical_anchor", "timeline_recall"),
        cardId: slugId("frame", 0),
        importance: 0.55,
      });
    }
  }

  void profile;
  return out;
}

function scientificCandidates(result: AnalysisResult, profile: AdaptiveLearnProfile): LearnCandidate[] {
  const out: LearnCandidate[] = [];
  result.keyInsights.slice(0, 8).forEach((line, i) => {
    if (MECHANISM.test(line)) {
      out.push({
        ...draft("concept", line.slice(0, 48), line, "mechanism_breakdown", "mechanisms"),
        cardId: slugId("mech", i),
        importance: 0.74,
      });
    }
    const terms = line.match(/\b[a-z]{4,}(?:\s+[a-z]{4,})?\b/gi);
    if (terms?.[0] && line.length < 200) {
      out.push({
        ...draft("memory_hook", terms[0].slice(0, 48), line, "terminology", "core_concepts"),
        cardId: slugId("term", i),
        importance: 0.66,
      });
    }
    if (i > 0 && MECHANISM.test(line)) {
      out.push({
        ...draft(
          "connection",
          "Process link",
          `${result.keyInsights[i - 1]}\n\n↔ ${line}`,
          "process_sequence",
          "systems",
        ),
        cardId: slugId("proc", i),
        importance: 0.68,
      });
    }
  });

  void profile;
  return out;
}

function literaryCandidates(result: AnalysisResult): LearnCandidate[] {
  const out: LearnCandidate[] = [];
  result.keyInsights.slice(0, 8).forEach((line, i) => {
    if (THEME.test(line)) {
      out.push({
        ...draft("concept", line.slice(0, 48), line, "thematic_link", "themes_motifs"),
        cardId: slugId("theme", i),
        importance: 0.72,
      });
      out.push({
        ...draft("memory_hook", line.slice(0, 40), line, "symbol_interpretation", "symbolism"),
        cardId: slugId("sym", i),
        importance: 0.68,
      });
    }
    if (/\b(character|narrator|protagonist|voice)\b/i.test(line)) {
      out.push({
        ...draft("why_it_matters", line.slice(0, 48), line, "character_psychology", "character_dynamics"),
        cardId: slugId("char", i),
        importance: 0.7,
      });
    }
    if (i > 0) {
      out.push({
        ...draft(
          "connection",
          "Narrative link",
          `${result.keyInsights[i - 1]}\n\n↔ ${line}`,
          "narrative_tension",
          "character_dynamics",
        ),
        cardId: slugId("nar", i),
        importance: 0.64,
      });
    }
  });
  return out;
}

function technicalCandidates(result: AnalysisResult): LearnCandidate[] {
  const out: LearnCandidate[] = [];
  const arch = /\b(architecture|component|module|service|API|pipeline|workflow|deploy)\b/i;
  result.keyInsights.slice(0, 8).forEach((line, i) => {
    if (arch.test(line)) {
      out.push({
        ...draft("concept", line.slice(0, 48), line, "architecture_decomposition", "architecture"),
        cardId: slugId("arch", i),
        importance: 0.73,
      });
    }
    if (/\b(then|first|next|after|before|step)\b/i.test(line) && i > 0) {
      out.push({
        ...draft(
          "connection",
          "Workflow step",
          `${result.keyInsights[i - 1]}\n\n→ ${line}`,
          "workflow_sequence",
          "workflows",
        ),
        cardId: slugId("flow", i),
        importance: 0.71,
      });
    }
    if (/\b(fail|error|degrad|outage|bottleneck)\b/i.test(line)) {
      out.push({
        ...draft("misconception", line.slice(0, 48), line, "debugging_path", "failure_points"),
        cardId: slugId("fail", i),
        importance: 0.6,
      });
    }
  });
  return out;
}

function executiveCandidates(result: AnalysisResult): LearnCandidate[] {
  const out: LearnCandidate[] = [];
  result.keyInsights.slice(0, 8).forEach((line, i) => {
    if (METRIC.test(line)) {
      out.push({
        ...draft("concept", line.slice(0, 48), line, "metric_significance", "metrics"),
        cardId: slugId("met", i),
        importance: 0.75,
      });
    }
    if (/\b(tradeoff|risk|opportunity|decision|strategy)\b/i.test(line)) {
      out.push({
        ...draft("why_it_matters", line.slice(0, 48), line, "tradeoff", "strategic_signals"),
        cardId: slugId("str", i),
        importance: 0.72,
      });
    }
  });
  return out;
}

export function synthesizeProfileLearnCandidates(
  result: AnalysisResult,
  profile: AdaptiveLearnProfile,
): LearnCandidate[] {
  switch (profile.profileId) {
    case "learn_historical_student_v1":
      return historicalCandidates(result, profile);
    case "learn_scientific_student_v1":
      return scientificCandidates(result, profile);
    case "learn_literary_student_v1":
      return literaryCandidates(result);
    case "learn_technical_developer_v1":
      return technicalCandidates(result);
    case "learn_business_executive_v1":
      return executiveCandidates(result);
    default:
      return [];
  }
}
