"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { ChevronDown, FileSearch2, Gauge } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { calculateDocumentIq } from "@/lib/documentIq/calculateDocumentIq";
import { getIntelligenceModeById } from "@/config/modes";
import type { ExtractionMetadata } from "@/types/extraction";

type MetricTone = {
  label: string;
  barFrom: string;
  barTo: string;
  glow: string;
};

const METRICS: Array<{
  key: "readability" | "complexity" | "density" | "actionability";
  tone: MetricTone;
}> = [
  {
    key: "readability",
    tone: {
      label: "Readability",
      barFrom: "from-sky-500/80",
      barTo: "to-sky-300/80",
      glow: "shadow-[0_0_18px_rgba(56,189,248,0.22)]",
    },
  },
  {
    key: "complexity",
    tone: {
      label: "Complexity",
      barFrom: "from-fuchsia-500/80",
      barTo: "to-violet-400/80",
      glow: "shadow-[0_0_18px_rgba(217,70,239,0.20)]",
    },
  },
  {
    key: "density",
    tone: {
      label: "Density",
      barFrom: "from-orange-500/80",
      barTo: "to-amber-300/80",
      glow: "shadow-[0_0_18px_rgba(249,115,22,0.18)]",
    },
  },
  {
    key: "actionability",
    tone: {
      label: "Actionability",
      barFrom: "from-emerald-500/80",
      barTo: "to-lime-300/80",
      glow: "shadow-[0_0_18px_rgba(16,185,129,0.16)]",
    },
  },
];

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function ProgressRing({ value }: { value: number }) {
  const pct = clamp(value);
  // Use conic-gradient for a lightweight circular progress.
  return (
    <div
      className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/[0.07] bg-black/25"
      style={{
        background: `conic-gradient(rgba(167,139,250,0.95) ${pct}%, rgba(255,255,255,0.08) 0)`,
      }}
      aria-label={`Document IQ ${pct} out of 100`}
      role="img"
    >
      <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#0b0e15]">
        <span className="text-sm font-semibold text-violet-100 tabular-nums">{pct}</span>
      </div>
    </div>
  );
}

function getConfidencePresentation(confidence: number) {
  if (confidence >= 75) {
    return {
      label: "High confidence",
      className: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
    };
  }
  if (confidence >= 50) {
    return {
      label: "Medium confidence",
      className: "border-sky-400/20 bg-sky-500/10 text-sky-200",
    };
  }
  return {
    label: "Low confidence",
    className: "border-amber-400/20 bg-amber-500/10 text-amber-200",
  };
}

function MetricBar({ label, value, tone }: { label: string; value: number; tone: MetricTone }) {
  const pct = clamp(value);
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="font-medium text-zinc-400">{label}</span>
        <span className="tabular-nums text-zinc-500">{pct}</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full border border-white/[0.06] bg-white/[0.03]">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${tone.barFrom} ${tone.barTo} ${tone.glow}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function DlRow({ dt, dd }: { dt: string; dd: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-zinc-600">{dt}</dt>
      <dd className="text-right text-zinc-400">{dd}</dd>
    </div>
  );
}

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="rounded-2xl border border-white/[0.07] bg-white/[0.02]"
      open={defaultOpen}
    >
      <summary
        className="group cursor-pointer list-none rounded-2xl px-3.5 py-3 text-xs font-semibold text-zinc-200 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0e15]"
      >
        <span className="inline-flex items-center gap-2">
          <span className="text-zinc-400">{title}</span>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-600 transition-transform group-open:rotate-180" aria-hidden />
        </span>
      </summary>
      <div className="border-t border-white/[0.06] px-3.5 pb-3.5 pt-3">
        {children}
      </div>
    </details>
  );
}

export function DocumentIqCard({
  extractedText,
  metadata,
  guestSimplified = false,
  compact = false,
}: {
  extractedText: string;
  metadata?: ExtractionMetadata | null;
  guestSimplified?: boolean;
  /** Sidebar variant — hides recommendations footer and share CTA. */
  compact?: boolean;
}) {
  const trimmed = extractedText.trim();
  const isTooShort = trimmed.length < 220;

  const iq = useMemo(() => {
    if (isTooShort) return null;
    return calculateDocumentIq({ extractedText: trimmed, metadata });
  }, [isTooShort, metadata, trimmed]);
  const confidence = iq
    ? getConfidencePresentation(iq.detectedDocumentType.confidence)
    : null;

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-violet-400/[0.12] bg-[#0d1018]/85 shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur"
      data-document-iq-card
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-violet-600/[0.08] to-transparent" aria-hidden />
      <div className="relative border-b border-white/[0.06] px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <Gauge className="h-4 w-4 text-violet-300" aria-hidden />
                Document IQ
              </h2>
              <Badge variant="muted" className="border-violet-400/25 bg-violet-500/10 text-violet-200">
                beta
              </Badge>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Content profile and analysis readiness
            </p>
          </div>
        </div>
      </div>

      <div className="relative space-y-4 px-4 py-4 sm:px-5">
        {isTooShort ? (
          <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 text-xs leading-relaxed text-zinc-500">
            Document IQ will appear after enough text is extracted.
          </p>
        ) : iq ? (
          <>
            <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-950/55 via-[#11141d]/80 to-[#0b0e15] p-3.5 shadow-[0_0_34px_rgba(139,92,246,0.16)]">
              <div className="flex items-center gap-3">
                <ProgressRing value={iq.iqScore} />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/75">
                    Analysis readiness
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">{iq.iqLabel}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                    {iq.label} · heuristic profile
                  </p>
                </div>
              </div>
            </div>

            <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
              <h3 className="text-xs font-semibold text-zinc-200">Source</h3>
              <dl className="mt-3 space-y-2 text-xs">
                <DlRow dt="Reading time" dd={<span className="tabular-nums">~{iq.estimatedReadingMinutes} min</span>} />
                <DlRow dt="Characters" dd={<span className="tabular-nums">{iq.charCount.toLocaleString()}</span>} />
              </dl>
            </section>

            {guestSimplified ? (
              <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
                <h3 className="text-xs font-semibold text-zinc-200">Study Friendly</h3>
                <MetricBar label="Study Friendly" value={iq.readability} tone={METRICS[0].tone} />
              </section>
            ) : null}

            {!guestSimplified ? (
              <>
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3">
                  <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                    <FileSearch2 className="h-3.5 w-3.5" aria-hidden />
                    Detected source type
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">
                      {iq.detectedDocumentType.type}
                    </p>
                    {confidence ? (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${confidence.className}`}
                      >
                        {confidence.label}
                      </span>
                    ) : null}
                  </div>
                  <div
                    className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]"
                    aria-label={`Source type confidence ${iq.detectedDocumentType.confidence} out of 100`}
                    role="img"
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500/80 to-fuchsia-400/80 shadow-[0_0_18px_rgba(139,92,246,0.18)]"
                      style={{ width: `${clamp(iq.detectedDocumentType.confidence)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {METRICS.map(({ key, tone }) => (
                    <MetricBar
                      key={key}
                      label={tone.label}
                      value={iq[key]}
                      tone={tone}
                    />
                  ))}
                </div>

                <Accordion title="Why this score?">
                  <ul className="space-y-1.5 text-xs text-zinc-500">
                    {iq.whyThisScore.positives.map((item) => (
                      <li key={`p:${item}`} className="flex gap-2">
                        <span className="text-emerald-300/90">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                    {iq.whyThisScore.negatives.map((item) => (
                      <li key={`n:${item}`} className="flex gap-2">
                        <span className="text-rose-300/90">✕</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </Accordion>

                {!compact ? (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                    Recommended intelligence modes
                  </p>
                  <div className="mt-2 space-y-2">
                    {iq.recommendedIntelligenceModeIds.map((modeId) => {
                      const mode = getIntelligenceModeById(modeId as never);
                      const isActive = mode?.availability === "active";
                      return (
                        <button
                          key={modeId}
                          type="button"
                          onClick={() => {
                            window.dispatchEvent(
                              new CustomEvent("workspace:intelligence-mode-recommendation", {
                                detail: { modeId },
                              }),
                            );
                          }}
                          className="flex w-full items-center justify-between gap-3 rounded-xl border border-transparent px-1 py-1 text-left transition-colors outline-none hover:border-white/[0.06] hover:bg-white/[0.02] focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0e15]"
                          title="Switch active intelligence mode"
                        >
                          <p className="text-xs font-medium text-zinc-200">
                            <span className="mr-2 text-emerald-300/90">✓</span>
                            {mode?.label ?? modeId}
                          </p>
                          {isActive ? (
                            <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.10] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                              <span aria-hidden className="text-zinc-400">
                                🔒
                              </span>
                              Pro
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                ) : null}
              </>
            ) : null}
          </>
        ) : null}

        {!compact ? (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            size="sm"
            disabled
            className="w-full border border-white/[0.06] bg-white/[0.02] text-white/70 shadow-none opacity-70 hover:bg-white/[0.02]"
            title="Coming soon"
          >
            Share my Document IQ
            <span className="ml-2 rounded-full border border-white/[0.07] bg-white/[0.02] px-2 py-0.5 text-[10px] text-white/60">
              Coming soon
            </span>
          </Button>
          <p className="text-[11px] leading-relaxed text-zinc-600">
            Heuristic profile based on structure, density, readability, and action signals — not
            a quality grade.
          </p>
        </div>
        ) : (
          <p className="text-[11px] leading-relaxed text-zinc-600">
            Heuristic profile based on structure, density, readability, and action signals — not
            a quality grade.
          </p>
        )}
      </div>
    </section>
  );
}
