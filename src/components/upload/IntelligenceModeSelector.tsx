"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { getIntelligenceModeById, INTELLIGENCE_MODES } from "@/config/modes";
import { getPlanDefinition } from "@/data/pricingPlans";
import {
  formatRecommendedSources,
  getCategoryLabelForMode,
  getModesByCategory,
  MODE_CATEGORY_META,
  searchModes,
} from "@/lib/mode-groups";
import {
  countModesForEntitlement,
  formatEntitlementModeCountLabel,
  formatPlanBadgeLabel,
  getModeAccessState,
} from "@/lib/mode-access";
import { getCategoryColors } from "@/lib/mode-category-colors";
import { canRunAnalysis, getModeLabel } from "@/lib/mode-resolver";
import type { PlanId } from "@/types/plan";
import type { IntelligenceModeDefinition, IntelligenceModeId } from "@/types/modes";

const MODE_ICONS: Record<string, React.ReactNode> = {
  layers: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25L12 12.75 6.429 9.75z" />
    </svg>
  ),
  sparkles: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  ),
  briefcase: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.049.653-.959 1.077-1.936 1.077-1.872 0-3.574.287-4.807.859a48.105 48.105 0 00-3.413.387c-1.068.16-1.837 1.094-1.837 2.175v3.978a2.18 2.18 0 00.75 1.66m0 0a48.667 48.667 0 01-4.5 0" />
    </svg>
  ),
  "graduation-cap": (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0016.52 0M4.26 10.147l-1.54 5.18a.75.75 0 00.522.852l7.682 2.017a.75.75 0 00.522-.852l-1.54-5.18M4.26 10.147L12 13.5l7.74-3.353" />
    </svg>
  ),
  scale: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.007.285 2.991.428M18.75 4.97v2.26M6.75 4.97v2.26m0 0c-.506.092-1.01.19-1.5.297M6.75 7.23v7.5" />
    </svg>
  ),
};

function ModeIcon({ name }: { name: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-zinc-900/80 text-violet-300/90">
      {MODE_ICONS[name] ?? MODE_ICONS.layers}
    </span>
  );
}

type IntelligenceModeSelectorProps = {
  value: IntelligenceModeId;
  entitlementPlanId: PlanId;
  onChange: (id: IntelligenceModeId) => void;
  onLockedSelect?: (mode: IntelligenceModeDefinition) => void;
};

export function IntelligenceModeSelector({
  value,
  entitlementPlanId,
  onChange,
  onLockedSelect,
}: IntelligenceModeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hoverId, setHoverId] = useState<IntelligenceModeId | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const counts = useMemo(
    () => countModesForEntitlement(entitlementPlanId),
    [entitlementPlanId],
  );
  const countLabel = useMemo(
    () => formatEntitlementModeCountLabel(counts, entitlementPlanId),
    [counts, entitlementPlanId],
  );

  const filtered = useMemo(() => searchModes(query), [query]);
  const byCategory = useMemo(() => getModesByCategory(filtered), [filtered]);

  const selectedMode = useMemo(
    () => getIntelligenceModeById(value),
    [value],
  );

  const selectedAccess = useMemo(
    () =>
      selectedMode
        ? getModeAccessState(selectedMode, entitlementPlanId)
        : null,
    [selectedMode, entitlementPlanId],
  );

  const previewMode = useMemo(() => {
    const id = hoverId ?? value;
    return INTELLIGENCE_MODES.find((m) => m.id === id);
  }, [hoverId, value]);

  const previewAccess = useMemo(
    () =>
      previewMode
        ? getModeAccessState(previewMode, entitlementPlanId)
        : null,
    [previewMode, entitlementPlanId],
  );

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setHoverId(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  function handlePick(mode: IntelligenceModeDefinition) {
    const access = getModeAccessState(mode, entitlementPlanId);

    if (!access.canAccess) {
      onLockedSelect?.(mode);
      if (access.lockReason === "coming_soon") return;
      close();
      return;
    }

    onChange(mode.id);
    if (canRunAnalysis(mode.id, entitlementPlanId)) {
      close();
      return;
    }

    onLockedSelect?.(mode);
    close();
  }

  const isSelectedLocked = selectedAccess != null && !selectedAccess.canAccess;

  const selectedCategoryColors = selectedMode
    ? getCategoryColors(selectedMode.category)
    : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group mode-selector-shimmer relative flex w-full cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-all duration-200 hover:shadow-md hover:shadow-violet-500/5 ${
          isSelectedLocked
            ? "border-violet-500/25 bg-violet-950/15 hover:border-violet-500/35"
            : selectedCategoryColors
              ? `${selectedCategoryColors.border} bg-zinc-950/60 hover:border-violet-500/30 hover:bg-violet-950/15`
              : "border-white/[0.08] bg-zinc-950/60 hover:border-violet-500/30 hover:bg-violet-950/20"
        }`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Intelligence mode: ${getModeLabel(value)}. Click to change mode.`}
      >
        {selectedMode && <ModeIcon name={selectedMode.icon} />}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Intelligence mode
            </span>
            <span className="text-[11px] text-zinc-600 group-hover:text-violet-300/70">
              · Click to change
            </span>
            {selectedAccess?.effectiveAvailability === "locked" &&
              selectedAccess.upgradePlanId && (
              <span className="rounded border border-violet-500/25 bg-violet-950/30 px-1 py-px text-[9px] font-medium uppercase text-violet-300/90">
                {formatPlanBadgeLabel(selectedAccess.upgradePlanId)}
              </span>
            )}
            {selectedAccess?.effectiveAvailability === "coming_soon" && (
              <span className="rounded border border-zinc-600/40 bg-zinc-800/40 px-1 py-px text-[9px] font-medium uppercase text-zinc-500">
                Soon
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-sm font-medium text-zinc-100">
            {getModeLabel(value)}
          </span>
          {selectedMode && (
            <>
              <span
                className={`mt-0.5 block text-[11px] ${getCategoryColors(selectedMode.category).label}`}
              >
                {getCategoryLabelForMode(value)}
              </span>
              <span className="mt-1 line-clamp-2 text-[11px] leading-snug text-zinc-400">
                {selectedMode.shortDescription}
              </span>
            </>
          )}
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
          <ChevronRight className="h-4 w-4 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-300/80" />
          <span className="text-right text-[11px] leading-snug text-zinc-500 group-hover:text-zinc-400">
            {countLabel}
          </span>
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-3 py-6 backdrop-blur-sm sm:px-4 sm:pt-[8vh]"
          role="presentation"
          onClick={close}
        >
          <div
            className="flex max-h-[min(85dvh,720px)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-white/[0.1] bg-zinc-950 shadow-2xl shadow-black/50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="intelligence-mode-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 border-b border-white/[0.06] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p
                    id="intelligence-mode-dialog-title"
                    className="text-sm font-semibold text-zinc-100"
                  >
                    Intelligence modes
                  </p>
                  <p className="text-[11px] text-zinc-500">{countLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                >
                  Esc
                </button>
              </div>
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search modes…"
                className="mt-3 w-full rounded-lg border border-white/[0.08] bg-zinc-900/80 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
              />
            </div>

            <div className="grid min-h-0 flex-1 md:grid-cols-[1fr_240px]">
              <div className="min-h-0 overflow-y-auto p-3">
                {MODE_CATEGORY_META.map((cat) => {
                  const modes = byCategory.get(cat.id) ?? [];
                  if (modes.length === 0) return null;
                  const catColors = getCategoryColors(cat.id);
                  return (
                    <section key={cat.id} className="mb-4 last:mb-0">
                      <p
                        className={`mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${catColors.label}`}
                      >
                        {cat.label}
                        <span className="ml-1.5 font-normal text-zinc-500">
                          ({modes.length})
                        </span>
                      </p>
                      <ul className="space-y-1">
                        {modes.map((mode) => {
                          const access = getModeAccessState(mode, entitlementPlanId);
                          const isSelected = value === mode.id;
                          const isSoon = access.effectiveAvailability === "coming_soon";
                          const isLocked = access.effectiveAvailability === "locked";
                          const modeColors = getCategoryColors(mode.category);

                          return (
                            <li key={mode.id}>
                              <button
                                type="button"
                                disabled={isSoon}
                                onMouseEnter={() => setHoverId(mode.id)}
                                onFocus={() => setHoverId(mode.id)}
                                onClick={() => handlePick(mode)}
                                className={`flex w-full items-start gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-all ${
                                  isSelected
                                    ? `${modeColors.borderActive} bg-violet-950/35`
                                    : `border-transparent ${modeColors.hover}`
                                } ${isSoon ? "cursor-not-allowed opacity-50" : ""} ${isLocked ? "opacity-90" : ""}`}
                              >
                                <ModeIcon name={mode.icon} />
                                <span className="min-w-0 flex-1">
                                  <span className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-xs font-medium text-zinc-100">
                                      {mode.label}
                                    </span>
                                    {access.canAccess && (
                                      <span className="rounded border border-emerald-500/25 bg-emerald-950/30 px-1 py-px text-[9px] font-medium uppercase text-emerald-400/90">
                                        Available
                                      </span>
                                    )}
                                    {isLocked && access.upgradePlanId && (
                                      <span
                                        className={`rounded border px-1 py-px text-[9px] font-medium uppercase ${modeColors.badge}`}
                                      >
                                        {formatPlanBadgeLabel(access.upgradePlanId)}
                                      </span>
                                    )}
                                    {isSoon && (
                                      <span className="rounded border border-zinc-600/40 bg-zinc-800/40 px-1 py-px text-[9px] font-medium uppercase text-zinc-500">
                                        Soon
                                      </span>
                                    )}
                                  </span>
                                  <span className="mt-0.5 line-clamp-1 text-[11px] text-zinc-400">
                                    {mode.shortDescription}
                                  </span>
                                </span>
                                {isLocked && (
                                  <svg
                                    className="mt-1 h-3.5 w-3.5 shrink-0 text-zinc-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                                    />
                                  </svg>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  );
                })}
              </div>

              {previewMode && previewAccess && (
                <aside className="hidden shrink-0 border-l border-white/[0.06] bg-zinc-900/30 p-4 md:block">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-400/80">
                    Preview
                  </p>
                  <p className="mt-2 text-sm font-semibold text-zinc-100">{previewMode.label}</p>
                  <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
                    {previewMode.intelligenceLens}
                  </p>
                  <div className="mt-4 space-y-2 text-[10px]">
                    <p>
                      <span className="text-zinc-600">Output · </span>
                      <span className="text-zinc-400">{previewMode.outputStylePreview}</span>
                    </p>
                    <p>
                      <span className="text-zinc-600">Learn · </span>
                      <span className="text-zinc-400">{previewMode.learnEmphasis}</span>
                    </p>
                    <p>
                      <span className="text-zinc-600">Sources · </span>
                      <span className="text-zinc-400">
                        {formatRecommendedSources(previewMode.recommendedSources)}
                      </span>
                    </p>
                  </div>
                  {previewAccess.effectiveAvailability === "locked" &&
                    previewAccess.upgradePlanId && (
                    <p className="mt-4 rounded-lg border border-violet-500/20 bg-violet-950/20 px-2.5 py-2 text-[10px] leading-relaxed text-violet-200/80">
                      Upgrade to {getPlanDefinition(previewAccess.upgradePlanId).name} to run this
                      intelligence mode on your documents.
                    </p>
                  )}
                  {previewAccess.effectiveAvailability === "coming_soon" && (
                    <p className="mt-4 rounded-lg border border-zinc-600/30 bg-zinc-900/50 px-2.5 py-2 text-[10px] leading-relaxed text-zinc-400">
                      Coming soon — this mode is not selectable for analysis yet.
                    </p>
                  )}
                </aside>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
