"use client";

import { useState } from "react";
import {
  FREE_CORE_MODE_IDS,
  PAID_PRIMARY_LENS_MODE_IDS,
  getIntelligenceModeById,
} from "@/config/modes";
import { isModeIncludedInPlan } from "@/lib/plan-features";
import type { IntelligenceModeDefinition, IntelligenceModeId } from "@/types/modes";
import type { PlanId } from "@/types/plan";

const FREE_LENS_BLURBS: Partial<Record<IntelligenceModeId, string>> = {
  "general-summary": "Balanced overview",
  "executive-brief": "Decisions & tradeoffs",
  "the-student": "Study & STEM",
  "the-creator": "Hooks & angles",
};

type WorkspaceLensPickerProps = {
  value: IntelligenceModeId;
  entitlementPlanId: PlanId;
  suggestedModeId: IntelligenceModeId | null;
  suggestionReason: string | null;
  onChange: (id: IntelligenceModeId) => void;
  onLockedSelect?: (mode: IntelligenceModeDefinition) => void;
  /** When true (default), show one line + Change; expand for the 4 free lenses. */
  compactFirst?: boolean;
};

function FreeLensGrid({
  value,
  freeModes,
  onChange,
}: {
  value: IntelligenceModeId;
  freeModes: IntelligenceModeDefinition[];
  onChange: (id: IntelligenceModeId) => void;
}) {
  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      data-workspace-lens-grid
      role="radiogroup"
      aria-label="Intelligence lens"
    >
      {freeModes.map((mode) => {
        const selected = value === mode.id;
        const blurb = FREE_LENS_BLURBS[mode.id] ?? mode.shortDescription;
        return (
          <button
            key={mode.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(mode.id)}
            className={`rounded-xl border px-2.5 py-2.5 text-left transition-all ${
              selected
                ? "border-violet-400/45 bg-violet-950/40 shadow-[0_0_0_1px_rgba(167,139,250,0.2)]"
                : "border-white/[0.08] bg-zinc-950/50 hover:border-violet-500/25 hover:bg-violet-950/15"
            }`}
          >
            <span className="flex flex-wrap items-center gap-1">
              <span className="text-xs font-semibold text-zinc-100">{mode.label}</span>
              {mode.id === "the-student" ? (
                <span className="rounded border border-sky-500/25 bg-sky-950/40 px-1 py-px text-[9px] font-semibold uppercase text-sky-300">
                  STEM
                </span>
              ) : null}
            </span>
            <span className="mt-1 block text-[10px] leading-snug text-zinc-500">{blurb}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Compact-first lens: one row with selected mode + Change.
 * Expand reveals the 4 free lenses (and Pro chips).
 */
export function WorkspaceLensPicker({
  value,
  entitlementPlanId,
  suggestedModeId,
  suggestionReason,
  onChange,
  onLockedSelect,
  compactFirst = true,
}: WorkspaceLensPickerProps) {
  const [expanded, setExpanded] = useState(!compactFirst);
  const mode = getIntelligenceModeById(value);
  const isSuggested = Boolean(suggestedModeId) && suggestedModeId === value;

  const freeModes = FREE_CORE_MODE_IDS.map((id) => getIntelligenceModeById(id)).filter(
    (m): m is IntelligenceModeDefinition => Boolean(m),
  );
  const paidModes = PAID_PRIMARY_LENS_MODE_IDS.map((id) => getIntelligenceModeById(id)).filter(
    (m): m is IntelligenceModeDefinition => Boolean(m),
  );

  function handleSelect(id: IntelligenceModeId) {
    onChange(id);
    if (compactFirst) setExpanded(false);
  }

  return (
    <div className="space-y-3" data-workspace-lens-picker data-compact-first={compactFirst}>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Lens</p>
        <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">
          Analysis angle for this source — e.g. Student for study & STEM, Creator for hooks.
        </p>
      </div>
      <div
        className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-950/40 px-3 py-2.5"
        data-workspace-lens-compact-row
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {mode?.label ?? value}
            {value === "the-student" ? (
              <span className="ml-1.5 align-middle text-[10px] font-semibold uppercase text-sky-300/90">
                STEM
              </span>
            ) : null}
          </p>
          {isSuggested && suggestionReason ? (
            <p className="mt-0.5 truncate text-[11px] text-sky-200/70" data-workspace-lens-suggestion>
              Suggested — {suggestionReason}
            </p>
          ) : mode?.shortDescription ? (
            <p className="mt-0.5 break-words text-[11px] text-zinc-500 [overflow-wrap:anywhere]">
              {mode.shortDescription}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 rounded-lg border border-white/[0.1] bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-semibold text-violet-200 transition-colors hover:border-violet-400/35 hover:text-white"
          aria-expanded={expanded}
        >
          {expanded ? "Done" : "Change"}
        </button>
      </div>

      {expanded ? (
        <div className="space-y-3 rounded-xl border border-white/[0.06] bg-black/20 p-3">
          <FreeLensGrid value={value} freeModes={freeModes} onChange={handleSelect} />
          <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.05] pt-2.5">
            <p className="text-[11px] text-zinc-600">Also on Pro:</p>
            {paidModes.map((paid) => {
              const included = isModeIncludedInPlan(paid.id, entitlementPlanId);
              const selected = value === paid.id;
              return (
                <button
                  key={paid.id}
                  type="button"
                  onClick={() => {
                    if (included) handleSelect(paid.id);
                    else onLockedSelect?.(paid);
                  }}
                  className={`rounded-lg border px-2 py-1 text-[11px] transition-colors ${
                    selected
                      ? "border-violet-400/40 bg-violet-950/35 text-violet-100"
                      : included
                        ? "border-white/[0.08] text-zinc-400 hover:border-violet-500/30 hover:text-zinc-200"
                        : "border-white/[0.06] text-zinc-600 hover:border-violet-500/20 hover:text-zinc-400"
                  }`}
                >
                  {paid.label}
                  {!included ? (
                    <span className="ml-1 text-[9px] uppercase text-violet-400/80">Pro</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Compact chip when Audio/Podcast path needs a visible lens affordance. */
export function WorkspaceLensCompactChip({
  modeId,
  onChangeClick,
}: {
  modeId: IntelligenceModeId;
  onChangeClick: () => void;
}) {
  const mode = getIntelligenceModeById(modeId);
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-950/50 px-3 py-2.5"
      data-workspace-lens-compact
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Lens</p>
        <p className="mt-0.5 truncate text-sm font-medium text-zinc-100">
          {mode?.label ?? modeId}
        </p>
      </div>
      <button
        type="button"
        onClick={onChangeClick}
        className="shrink-0 rounded-lg border border-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-violet-200 hover:border-violet-500/30"
      >
        Change
      </button>
    </div>
  );
}
