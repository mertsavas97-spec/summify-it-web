"use client";

import { Badge } from "@/components/ui/Badge";
import { formatNumber } from "@/lib/format-number";
import { getLearnModeHelperText, getLearnModeLabel } from "@/lib/learn-mode-copy";
import type { AnalysisResult, LearnCardOutput } from "@/types/text-analysis";
import type { IntelligenceModeId } from "@/types/modes";
import { LearnCardItem } from "./LearnCardItem";

const KIND_LABELS: Partial<Record<LearnCardOutput["type"], string>> = {
  concept: "Concept",
  why_it_matters: "Why",
  why: "Why",
  memory_hook: "Hook",
  quiz: "Quiz",
  connection: "Link",
  misconception: "Myth",
};

function countByKind(cards: AnalysisResult["learnCards"]): Partial<Record<LearnCardOutput["type"], number>> {
  const counts: Partial<Record<LearnCardOutput["type"], number>> = {};
  for (const card of cards) {
    counts[card.type] = (counts[card.type] ?? 0) + 1;
  }
  return counts;
}

type CardGroup = {
  id: string;
  title: string;
  cards: LearnCardOutput[];
};

function buildCardGroups(cards: LearnCardOutput[]): { groups: CardGroup[]; ungrouped: LearnCardOutput[] } {
  const order: string[] = [];
  const map = new Map<string, CardGroup>();
  const ungrouped: LearnCardOutput[] = [];

  for (const card of cards) {
    if (card.groupId && card.groupTitle) {
      if (!map.has(card.groupId)) {
        map.set(card.groupId, { id: card.groupId, title: card.groupTitle, cards: [] });
        order.push(card.groupId);
      }
      map.get(card.groupId)!.cards.push(card);
    } else {
      ungrouped.push(card);
    }
  }

  return { groups: order.map((id) => map.get(id)!), ungrouped };
}

type LearnSectionProps = {
  cards: AnalysisResult["learnCards"];
  modeId: IntelligenceModeId;
};

export function LearnSection({ cards, modeId }: LearnSectionProps) {
  const kindCounts = countByKind(cards);
  const badges = Object.entries(kindCounts)
    .filter(([, n]) => n && n > 0)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));

  const { groups, ungrouped } = buildCardGroups(cards);
  const useGroups = groups.length > 0;

  return (
    <section className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-gradient-to-b from-violet-950/15 via-zinc-950/40 to-zinc-950/60 px-4 py-3.5 sm:px-5 sm:py-4">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-6 left-1/4 h-24 w-24 rounded-full bg-indigo-500/5 blur-2xl"
        aria-hidden
      />

      <header className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-400/90">
              Adaptive Learn Layer
            </p>
            <h4 className="mt-1 text-sm font-semibold text-zinc-100">Learn cards</h4>
            <p className="mt-2 max-w-prose text-[11px] leading-relaxed text-zinc-500">
              Ranked, deduplicated study assets from this document — tuned for{" "}
              <span className="text-zinc-400">{getLearnModeLabel(modeId)}</span> mode.
              Session-only; no account required.
            </p>
          </div>
          <p className="shrink-0 rounded-lg border border-white/[0.08] bg-zinc-950/70 px-2.5 py-1.5 text-[10px] text-zinc-500">
            <span className="font-semibold tabular-nums text-violet-300/90">
              {formatNumber(cards.length)}
            </span>{" "}
            {cards.length === 1 ? "card" : "cards"}
          </p>
        </div>

        <p className="relative mt-3 max-w-prose text-[11px] leading-relaxed text-zinc-600">
          {getLearnModeHelperText(modeId)}
        </p>

        {badges.length > 0 && (
          <div className="relative mt-3 flex flex-wrap gap-1.5">
            {badges.map(([kind, count]) => (
              <Badge key={kind} variant="muted" className="text-[9px]">
                {KIND_LABELS[kind as LearnCardOutput["type"]] ?? kind} · {count}
              </Badge>
            ))}
          </div>
        )}
      </header>

      <div className="relative mt-4 space-y-4" data-workspace-learn-list>
        {useGroups ? (
          <>
            {groups.map((group) => (
              <div key={group.id} data-learn-group={group.id}>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-violet-400/80">
                  {group.title}
                  <span className="ml-1.5 font-normal text-zinc-600">({group.cards.length})</span>
                </p>
                <ul className="space-y-2">
                  {group.cards.map((card, i) => (
                    <LearnCardItem key={`${group.id}-${card.cardId ?? card.title}-${i}`} card={card} />
                  ))}
                </ul>
              </div>
            ))}
            {ungrouped.length > 0 ? (
              <ul className="space-y-2">
                {ungrouped.map((card, i) => (
                  <LearnCardItem key={`ungrouped-${card.cardId ?? card.title}-${i}`} card={card} />
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <ul className="space-y-2">
            {cards.map((card, i) => (
              <LearnCardItem key={`${card.type}-${card.cardId ?? card.title}-${i}`} card={card} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
