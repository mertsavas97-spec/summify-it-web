"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type DatePreset = "7d" | "30d" | "90d" | "custom";

type FunnelStage = {
  key: string;
  label: string;
  count: number;
  prevRate: number;
  topRate: number;
  dropOffPrev: number;
  dropOffTop: number;
};

type FunnelResponse =
  | { available: false; message: string }
  | {
      available: true;
      dateRange: { startDate: string; endDate: string };
      funnel: {
        stages: FunnelStage[];
        insights: string[];
        hasEnoughData: boolean;
      };
    };

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number) {
  const v = Math.max(0, Math.min(1, value));
  return new Intl.NumberFormat(undefined, {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(v);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function presetLabel(preset: DatePreset, range?: { startDate: string; endDate: string }) {
  if (preset === "7d") return "Showing last 7 days";
  if (preset === "30d") return "Showing last 30 days";
  if (preset === "90d") return "Showing last 90 days";
  if (preset === "custom" && range)
    return `Showing ${range.startDate} → ${range.endDate}`;
  return "";
}

/* ------------------------------------------------------------------ */
/* Stage color helpers                                                 */
/* ------------------------------------------------------------------ */

const STAGE_COLORS = [
  { bar: "bg-violet-500/70", text: "text-violet-300" },
  { bar: "bg-indigo-500/70", text: "text-indigo-300" },
  { bar: "bg-blue-500/70", text: "text-blue-300" },
  { bar: "bg-cyan-500/70", text: "text-cyan-300" },
  { bar: "bg-emerald-500/70", text: "text-emerald-300" },
  { bar: "bg-amber-500/70", text: "text-amber-300" },
  { bar: "bg-rose-500/70", text: "text-rose-300" },
];

function stageColor(index: number) {
  return STAGE_COLORS[index % STAGE_COLORS.length];
}

/* ------------------------------------------------------------------ */
/* Main Component                                                     */
/* ------------------------------------------------------------------ */

export function AdminConversionFunnel() {
  const [preset, setPreset] = useState<DatePreset>("30d");
  const [customStart, setCustomStart] = useState<string>(todayIso());
  const [customEnd, setCustomEnd] = useState<string>(todayIso());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FunnelResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("preset", preset);
    if (preset === "custom") {
      params.set("startDate", customStart);
      params.set("endDate", customEnd);
    }
    return params.toString();
  }, [preset, customStart, customEnd]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/analytics/funnel?${query}`, {
          credentials: "include",
          cache: "no-store",
        });
        const json = (await res.json()) as FunnelResponse & { message?: string };
        if (cancelled) return;
        setData(json);
        if (!res.ok) {
          setError(json.message ?? "Failed to load funnel data");
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const rangeLabel = presetLabel(
    preset,
    data && "dateRange" in data ? data.dateRange : undefined,
  );
  const available = data?.available === true;
  const funnel = data && "funnel" in data ? data.funnel : null;
  const hasData = funnel?.hasEnoughData && (funnel?.stages?.length ?? 0) > 0;

  return (
    <div className="space-y-4">
      {/* ---- Header ---- */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-950/30 via-zinc-900/50 to-zinc-950/80 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-1 inline-block rounded-full bg-violet-500/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-violet-300">
              Conversion Funnel
            </p>
            <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Conversion Funnel
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
              Where users drop off in the Summify journey — from visitor to paid
              subscriber.
            </p>
          </div>
        </div>
      </div>

      {/* ---- Date Range Controls ---- */}
      <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-zinc-400">Date range</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={preset === "7d" ? "primary" : "secondary"}
                onClick={() => setPreset("7d")}
              >
                7d
              </Button>
              <Button
                size="sm"
                variant={preset === "30d" ? "primary" : "secondary"}
                onClick={() => setPreset("30d")}
              >
                30d
              </Button>
              <Button
                size="sm"
                variant={preset === "90d" ? "primary" : "secondary"}
                onClick={() => setPreset("90d")}
              >
                90d
              </Button>
              <Button
                size="sm"
                variant={preset === "custom" ? "primary" : "secondary"}
                onClick={() => setPreset("custom")}
              >
                Custom
              </Button>
            </div>
            {rangeLabel ? (
              <p className="mt-2 text-xs text-zinc-500">{rangeLabel}</p>
            ) : null}
          </div>

          {preset === "custom" ? (
            <div className="flex flex-wrap items-center gap-2">
              <div>
                <label className="block text-xs text-zinc-400">Start</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="mt-1 h-9 rounded-md border border-white/[0.12] bg-zinc-950 px-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400">End</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="mt-1 h-9 rounded-md border border-white/[0.12] bg-zinc-950 px-2 text-sm text-white"
                />
              </div>
            </div>
          ) : null}
        </div>

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        {loading ? <p className="mt-4 text-sm text-zinc-400">Loading…</p> : null}

        {/* ---- Empty State ---- */}
        {!loading && !error && (!available || !hasData) && (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-zinc-950/40 py-12 text-center">
            <svg
              className="mb-4 h-10 w-10 text-zinc-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
              />
            </svg>
            <p className="text-sm font-medium text-zinc-300">
              Not enough funnel data yet
            </p>
            <p className="mt-1 max-w-xs text-xs text-zinc-500">
              Funnel data will appear here once there is sufficient traffic and
              user activity in the selected date range.
            </p>
          </div>
        )}

        {/* ---- Funnel Visualization ---- */}
        {!loading && hasData && funnel ? (
          <div className="mt-6 space-y-6">
            <FunnelVisualization stages={funnel.stages} />
            <InsightsPanel insights={funnel.insights} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Funnel Visualization                                                */
/* ------------------------------------------------------------------ */

function FunnelVisualization({ stages }: { stages: FunnelStage[] }) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="space-y-1">
      {stages.map((stage, idx) => {
        const widthPct = Math.max(4, (stage.count / maxCount) * 100);
        const color = stageColor(idx);
        const isFirst = idx === 0;
        const dropOffPct = isFirst ? null : stage.dropOffPrev;
        const isSevereDropOff = !!dropOffPct && dropOffPct > 0.7;
        const isModerateDropOff = !!dropOffPct && dropOffPct > 0.4 && dropOffPct <= 0.7;

        return (
          <div key={stage.key}>
            {/* Drop-off arrow between stages */}
            {!isFirst && (
              <div className="flex items-center justify-center gap-2 py-1">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <div className="flex items-center gap-1.5">
                  <svg
                    className={`h-3 w-3 ${isSevereDropOff ? "text-rose-400" : isModerateDropOff ? "text-amber-400" : "text-zinc-500"}`}
                    fill="none"
                    viewBox="0 0 16 16"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 2v10M12 10l-4 4-4-4"
                    />
                  </svg>
                  <span
                    className={`text-[11px] font-medium ${
                      isSevereDropOff
                        ? "text-rose-400"
                        : isModerateDropOff
                          ? "text-amber-400"
                          : "text-zinc-500"
                    }`}
                  >
                    {formatPercent(stage.dropOffPrev)} drop-off
                  </span>
                </div>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>
            )}

            {/* Stage Card */}
            <div
              className={`rounded-xl border p-4 transition-all ${
                isFirst
                  ? "border-violet-500/20 bg-violet-950/15"
                  : isSevereDropOff
                    ? "border-rose-500/15 bg-rose-950/10"
                    : "border-white/[0.06] bg-zinc-950/30"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Stage info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${color.text} bg-white/[0.06]`}
                    >
                      {idx + 1}
                    </span>
                    <p className="text-sm font-semibold text-white">
                      {stage.label}
                    </p>
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-white">
                    {formatNumber(stage.count)}
                  </p>
                </div>

                {/* Right: Conversion rates */}
                {!isFirst && (
                  <div className="flex-shrink-0 text-right">
                    <div
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 ${
                        stage.prevRate >= 0.7
                          ? "bg-emerald-500/10"
                          : stage.prevRate >= 0.3
                            ? "bg-amber-500/10"
                            : "bg-rose-500/10"
                      }`}
                    >
                      <span
                        className={`text-xs font-bold ${
                          stage.prevRate >= 0.7
                            ? "text-emerald-300"
                            : stage.prevRate >= 0.3
                              ? "text-amber-300"
                              : "text-rose-300"
                        }`}
                      >
                        {formatPercent(stage.prevRate)}
                      </span>
                      <span className="text-[10px] text-zinc-500">from prev</span>
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      {formatPercent(stage.topRate)} from top
                    </p>
                    <p
                      className={`mt-0.5 text-[11px] ${
                        isSevereDropOff
                          ? "text-rose-400"
                          : isModerateDropOff
                            ? "text-amber-400"
                            : "text-zinc-600"
                      }`}
                    >
                      {formatPercent(stage.dropOffPrev)} drop-off
                    </p>
                  </div>
                )}
                {isFirst && (
                  <div className="flex-shrink-0 text-right">
                    <span className="inline-flex items-center rounded-lg bg-violet-500/10 px-2 py-1 text-xs font-bold text-violet-300">
                      Top of funnel
                    </span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isSevereDropOff
                      ? "bg-rose-500/70"
                      : isModerateDropOff
                        ? "bg-amber-500/60"
                        : color.bar
                  }`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Insights Panel                                                      */
/* ------------------------------------------------------------------ */

function InsightsPanel({ insights }: { insights: string[] }) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="rounded-xl border border-violet-500/20 bg-violet-950/20 p-4">
      <div className="flex items-center gap-2">
        <svg
          className="h-4 w-4 text-violet-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
          />
        </svg>
        <p className="text-xs font-semibold text-violet-200">
          Key Insights
        </p>
      </div>
      <ul className="mt-3 space-y-2">
        {insights.slice(0, 3).map((insight, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-400" />
            <span className="text-xs leading-relaxed text-violet-100">
              {insight}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}