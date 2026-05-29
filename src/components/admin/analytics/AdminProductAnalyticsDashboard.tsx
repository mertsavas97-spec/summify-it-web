"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LiveActivityFeed } from "@/components/admin/analytics/LiveActivityFeed";

type DatePreset = "7d" | "30d" | "90d" | "custom";
type UsageTrendMetric = "analyses" | "uploads" | "learnCards" | "audioMode" | "podcast";

type ProductAnalyticsResponse =
  | { available: false; message: string }
  | {
      available: true;
      dateRange: { startDate: string; endDate: string };
      overview: {
        analysesCompleted: number;
        uploadsCompleted: number;
        avgAnalysesPerUser: number;
        mostUsedMode: string | null;
        mostUsedSource: string | null;
        learnCardsOpened: number;
        audioModeClicks: number;
        podcastClicks: number;
      };
      timeseries: {
        analysesPerDay: Array<{ date: string; value: number }>;
        uploadsPerDay: Array<{ date: string; value: number }>;
        learnCardsPerDay: Array<{ date: string; value: number }>;
        audioModePerDay: Array<{ date: string; value: number }>;
        podcastPerDay: Array<{ date: string; value: number }>;
      };
      funnel: {
        visitor: number;
        upload: number;
        analysis: number;
        signup: number;
        pricing: number;
        subscription: number;
        rates: Record<string, number>;
      };
      topModes: Array<{ key: string; count: number }>;
      topSources: Array<{ key: string; count: number }>;
    };

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number) {
  const v = Math.max(0, Math.min(1, value));
  return new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 0 }).format(v);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function presetLabel(preset: DatePreset, range?: { startDate: string; endDate: string }) {
  if (preset === "7d") return "Showing last 7 days";
  if (preset === "30d") return "Showing last 30 days";
  if (preset === "90d") return "Showing last 90 days";
  if (preset === "custom" && range) return `Showing ${range.startDate} → ${range.endDate}`;
  return "";
}

function normalizeGaDate(date: string) {
  if (/^\d{8}$/.test(date)) {
    return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
  }
  return date;
}

function formatShortDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(d);
}

function formatFullDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "2-digit" }).format(d);
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function AdminProductAnalyticsDashboard() {
  const [preset, setPreset] = useState<DatePreset>("30d");
  const [customStart, setCustomStart] = useState<string>(todayIso());
  const [customEnd, setCustomEnd] = useState<string>(todayIso());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProductAnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trendMetric, setTrendMetric] = useState<UsageTrendMetric>("analyses");
  const [showTrendTable, setShowTrendTable] = useState(false);
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState<{ date: string; value: number } | null>(null);

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
        const res = await fetch(`/api/admin/analytics/product?${query}`, {
          credentials: "include",
          cache: "no-store",
        });
        const json = (await res.json()) as ProductAnalyticsResponse & { message?: string };
        if (cancelled) return;
        setData(json);
        if (!res.ok) {
          setError(json.message ?? "Failed to load product analytics");
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

   const rangeLabel = presetLabel(preset, data && "dateRange" in data ? data.dateRange : undefined);
   const available = data?.available === true;

   // Safe fallback defaults for analytics data
   const safeData = useMemo(() => {
     if (data?.available !== true) {
       return {
         overview: {},
         funnel: {
           visitor: 0,
           upload: 0,
           analysis: 0,
           signup: 0,
           pricing: 0,
           subscription: 0,
           rates: {},
         },
         topModes: [],
         topSources: [],
         timeseries: {
           analysesPerDay: [],
           uploadsPerDay: [],
           learnCardsPerDay: [],
           audioModePerDay: [],
           podcastPerDay: [],
         },
       };
     }
     return {
       overview: data.overview ?? {},
       funnel: data.funnel ?? {
         visitor: 0,
         upload: 0,
         analysis: 0,
         signup: 0,
         pricing: 0,
         subscription: 0,
         rates: {},
       },
       topModes: data.topModes ?? [],
       topSources: data.topSources ?? [],
       timeseries: {
         analysesPerDay: data.timeseries?.analysesPerDay ?? [],
         uploadsPerDay: data.timeseries?.uploadsPerDay ?? [],
         learnCardsPerDay: data.timeseries?.learnCardsPerDay ?? [],
         audioModePerDay: data.timeseries?.audioModePerDay ?? [],
         podcastPerDay: data.timeseries?.podcastPerDay ?? [],
       },
     };
   }, [data]);

   const trendSeries = useMemo(() => {
     if (data?.available !== true) return [] as Array<{ date: string; value: number }>;
     const raw =
       trendMetric === "analyses"
         ? safeData.timeseries.analysesPerDay ?? []
         : trendMetric === "uploads"
           ? safeData.timeseries.uploadsPerDay ?? []
           : trendMetric === "learnCards"
             ? safeData.timeseries.learnCardsPerDay ?? []
             : trendMetric === "audioMode"
               ? safeData.timeseries.audioModePerDay ?? []
               : safeData.timeseries.podcastPerDay ?? [];
     return (raw ?? []).map((p) => ({ date: normalizeGaDate(p.date), value: p.value }));
   }, [data, trendMetric, safeData]);

  const trendMetricLabel = {
    analyses: "Analyses",
    uploads: "Uploads",
    learnCards: "Learn Cards",
    audioMode: "Audio Mode",
    podcast: "Podcast",
  }[trendMetric];

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-950/25 via-zinc-900/50 to-zinc-950/80 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge variant="accent" className="mb-2">
              First-party
            </Badge>
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Product Analytics
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
              Usage-based analytics powered by <code className="text-zinc-300">product_events</code>.
            </p>
          </div>
        </div>
      </header>

      <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-zinc-400">Date range</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" variant={preset === "7d" ? "primary" : "secondary"} onClick={() => setPreset("7d")}>
                7d
              </Button>
              <Button size="sm" variant={preset === "30d" ? "primary" : "secondary"} onClick={() => setPreset("30d")}>
                30d
              </Button>
              <Button size="sm" variant={preset === "90d" ? "primary" : "secondary"} onClick={() => setPreset("90d")}>
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
            {rangeLabel ? <p className="mt-2 text-xs text-zinc-500">{rangeLabel}</p> : null}
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

        {!loading && data?.available === false ? (
          <div className="mt-4 rounded-xl border border-white/[0.08] bg-zinc-950/60 p-4">
            <p className="text-sm text-zinc-300">Product analytics unavailable.</p>
            <p className="mt-2 text-xs text-zinc-500">{data.message}</p>
          </div>
        ) : null}

        {!loading && available ? (
          <div className="mt-6 space-y-6">
            <SectionHeader title="Product Overview" subtitle="Core usage signals and user engagement." />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <MetricCardStrong title="Analyses" value={formatNumber(data.overview.analysesCompleted)} helper="Completed" />
              <MetricCardStrong title="Uploads" value={formatNumber(data.overview.uploadsCompleted)} helper="Completed" />
              <MetricCardStrong
                title="Avg Analyses/User"
                value={new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(data.overview.avgAnalysesPerUser)}
                helper="Per user"
              />
              <MetricCardStrong title="Learn Cards" value={formatNumber(data.overview.learnCardsOpened)} helper="Opened" />
              <MetricCardStrong title="Audio Mode" value={formatNumber(data.overview.audioModeClicks)} helper="Clicks" />
              <MetricCardStrong title="Podcast" value={formatNumber(data.overview.podcastClicks)} helper="Clicks" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <KeyValueCard title="Most Used Mode" value={data.overview.mostUsedMode ?? "—"} />
              <KeyValueCard title="Most Used Source" value={data.overview.mostUsedSource ?? "—"} />
            </div>

            {/* Live Activity Feed */}
            <LiveActivityFeed maxVisible={10} />

            {/* Usage Trend */}
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-4">
              <div className="flex items-center justify-between">
                <SectionHeader
                  title="Usage Trend"
                  subtitle="Daily product usage across selected range."
                  compact
                />
                <Button
                  size="sm"
                  variant={showTrendTable ? "primary" : "secondary"}
                  onClick={() => setShowTrendTable(!showTrendTable)}
                >
                  {showTrendTable ? "Hide" : "Show"} Table
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={trendMetric === "analyses" ? "primary" : "secondary"}
                  onClick={() => setTrendMetric("analyses")}
                >
                  Analyses
                </Button>
                <Button
                  size="sm"
                  variant={trendMetric === "uploads" ? "primary" : "secondary"}
                  onClick={() => setTrendMetric("uploads")}
                >
                  Uploads
                </Button>
                <Button
                  size="sm"
                  variant={trendMetric === "learnCards" ? "primary" : "secondary"}
                  onClick={() => setTrendMetric("learnCards")}
                >
                  Learn Cards
                </Button>
                <Button
                  size="sm"
                  variant={trendMetric === "audioMode" ? "primary" : "secondary"}
                  onClick={() => setTrendMetric("audioMode")}
                >
                  Audio Mode
                </Button>
                <Button
                  size="sm"
                  variant={trendMetric === "podcast" ? "primary" : "secondary"}
                  onClick={() => setTrendMetric("podcast")}
                >
                  Podcast
                </Button>
              </div>

              <div className="mt-4">
                {trendSeries.length === 0 ? (
                  <p className="text-xs text-zinc-500">No usage trend data available yet.</p>
                ) : showTrendTable ? (
                  <TrendDataTable series={trendSeries} metricLabel={trendMetricLabel} />
                ) : (
                  <MiniLineChart
                    series={trendSeries}
                    onHover={setHoveredTrendPoint}
                    hovered={hoveredTrendPoint}
                    metricLabel={trendMetricLabel}
                  />
                )}
              </div>
            </div>

            {/* Most Engaged Features */}
            <SectionHeader title="Most Engaged Features" subtitle="Feature adoption ranking." />
            <MostEngagedFeaturesCard overview={data.overview} />

            {/* Funnel */}
            <SectionHeader title="Funnel" subtitle="Visitor → Upload → Analysis → Signup → Pricing → Subscription" />
            <FunnelCardNew data={data.funnel} />

            {/* Top Modes & Sources in grid */}
            <SectionHeader title="Top Content" subtitle="Most popular analysis modes and sources." />
            <div className="grid gap-4 lg:grid-cols-2">
              <TopListCard title="Top Modes" rows={data.topModes} />
              <TopListCard title="Top Sources" rows={data.topSources} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, compact }: { title: string; subtitle?: string; compact?: boolean }) {
  return (
    <div className={compact ? "" : "mt-2"}>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      {subtitle ? <p className="mt-1 text-xs text-zinc-500">{subtitle}</p> : null}
    </div>
  );
}

function MetricCardStrong({ title, value, helper }: { title: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-zinc-950/70 to-zinc-950/40 p-4">
      <p className="text-xs font-medium text-zinc-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{helper}</p>
      <div className="mt-3 h-[2px] w-10 rounded-full bg-violet-500/60" />
    </div>
  );
}

function CardShell({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">{title}</p>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function KeyValueCard({ title, value }: { title: string; value: string }) {
  return (
    <CardShell title={title}>
      <p className="text-lg font-semibold text-white">{value}</p>
    </CardShell>
  );
}

function TopListCard({ title, rows }: { title: string; rows: Array<{ key: string; count: number }> }) {
  return (
    <CardShell title={title}>
      {rows.length === 0 ? (
        <p className="text-xs text-zinc-500">No data available yet.</p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_auto] gap-3 text-[11px] font-medium text-zinc-500">
            <p>Name</p>
            <p className="text-right">Count</p>
          </div>
          {rows.slice(0, 12).map((row) => (
            <div key={row.key} className="grid grid-cols-[1fr_auto] gap-3">
              <p className="truncate text-xs text-zinc-200">{row.key}</p>
              <p className="text-right text-xs font-medium text-zinc-100">{formatNumber(row.count)}</p>
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
}

function MostEngagedFeaturesCard({ overview }: { overview: {
  analysesCompleted: number;
  uploadsCompleted: number;
  avgAnalysesPerUser: number;
  mostUsedMode: string | null;
  mostUsedSource: string | null;
  learnCardsOpened: number;
  audioModeClicks: number;
  podcastClicks: number;
} }) {
  const features = [
    { label: "Learn Cards", value: overview.learnCardsOpened, icon: "📚" },
    { label: "Audio Lessons", value: overview.audioModeClicks, icon: "🎧" },
    { label: "Podcast Learning", value: overview.podcastClicks, icon: "🎙️" },
  ].sort((a, b) => b.value - a.value);

  const total = features.reduce((sum, f) => sum + f.value, 0);

  return (
    <CardShell title="Feature Engagement">
      {total === 0 ? (
        <p className="text-xs text-zinc-500">No feature engagement recorded yet.</p>
      ) : (
        <div className="space-y-3">
          {features.map((feature) => {
            const pct = total > 0 ? feature.value / total : 0;
            return (
              <div key={feature.label}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{feature.icon}</span>
                    <p className="text-xs font-medium text-zinc-300">{feature.label}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-zinc-100">{formatNumber(feature.value)}</p>
                    <p className="text-[11px] text-zinc-500">{formatPercent(pct)}</p>
                  </div>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-violet-500/60"
                    style={{ width: `${Math.round(clamp01(pct) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CardShell>
  );
}

function FunnelCardNew({
  data,
}: {
  data: {
    visitor: number;
    upload: number;
    analysis: number;
    signup: number;
    pricing: number;
    subscription: number;
    rates: Record<string, number>;
  };
}) {
  const rows = [
    { label: "Visitors", count: data.visitor, rate: null },
    { label: "Uploads", count: data.upload, rate: data.rates.visitor_to_upload },
    { label: "Analyses", count: data.analysis, rate: data.rates.upload_to_analysis },
    { label: "Signups", count: data.signup, rate: data.rates.analysis_to_signup },
    { label: "Pricing", count: data.pricing, rate: data.rates.signup_to_pricing },
    { label: "Subscriptions", count: data.subscription, rate: data.rates.pricing_to_subscription },
  ];

  const maxCount = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="space-y-3">
      {rows.map((row, idx) => {
        const widthPct = (row.count / maxCount) * 100;
        const dropOffPct = row.rate ? Math.max(0, 1 - (row.rate || 0)) : null;
        const isSevereDropOff = dropOffPct && dropOffPct > 0.7;

        return (
          <div key={row.label}>
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-100">{row.label}</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">{formatNumber(row.count)}</p>
              </div>
              {row.rate !== null && (
                <div className="text-right">
                  <p className={`text-xs font-semibold ${isSevereDropOff ? "text-rose-400" : "text-zinc-200"}`}>
                    {formatPercent(row.rate)}
                  </p>
                  {dropOffPct && (
                    <p className={`text-[11px] ${isSevereDropOff ? "text-rose-500/70" : "text-zinc-500"}`}>
                      {formatPercent(dropOffPct)} drop
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={`h-full rounded-full transition-all ${
                  isSevereDropOff ? "bg-rose-500/70" : "bg-violet-500/60"
                }`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            {idx < rows.length - 1 && (
              <div className="mt-2 flex justify-center">
                <svg className="h-3 w-3 text-zinc-500" fill="none" viewBox="0 0 16 16">
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 2v10M12 10l-4 4-4-4"
                  />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MiniLineChart({
  series,
  onHover,
  hovered,
  metricLabel,
}: {
  series: Array<{ date: string; value: number }>;
  onHover?: (point: { date: string; value: number } | null) => void;
  hovered?: { date: string; value: number } | null;
  metricLabel?: string;
}) {
  const width = 640;
  const height = 180;
  const padX = 12;
  const padY = 12;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const values = series.map((p) => p.value);
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const range = Math.max(1e-6, max - min);

  const points = series.map((p, i) => {
    const x = padX + (series.length === 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
    const y = padY + (1 - (p.value - min) / range) * innerH;
    return { x, y, ...p };
  });

  const d = points
    .map((pt, i) => {
      const cmd = i === 0 ? "M" : "L";
      return `${cmd}${pt.x.toFixed(2)},${pt.y.toFixed(2)}`;
    })
    .join(" ");

  const areaD = `${d} L${(padX + innerW).toFixed(2)},${(padY + innerH).toFixed(2)} L${padX.toFixed(
    2,
  )},${(padY + innerH).toFixed(2)} Z`;

  const first = series[0]?.date;
  const last = series[series.length - 1]?.date;

  const hoveredPoint = hovered ? points.find((p) => p.date === hovered.date) : null;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-950/40">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-44 w-full"
          onMouseMove={(e) => {
            if (!onHover) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * width;
            const closestPoint = points.reduce((prev, curr) =>
              Math.abs(curr.x - x) < Math.abs(prev.x - x) ? curr : prev,
            );
            onHover(closestPoint);
          }}
          onMouseLeave={() => {
            if (onHover) onHover(null);
          }}
        >
          <defs>
            <linearGradient id="trendFillProduct" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(168,85,247,0.35)" />
              <stop offset="100%" stopColor="rgba(168,85,247,0)" />
            </linearGradient>
          </defs>

          {/* subtle grid */}
          <line x1={padX} y1={padY + innerH} x2={padX + innerW} y2={padY + innerH} stroke="rgba(255,255,255,0.08)" />
          <line x1={padX} y1={padY} x2={padX} y2={padY + innerH} stroke="rgba(255,255,255,0.08)" />

          <path d={areaD} fill="url(#trendFillProduct)" />
          <path d={d} fill="none" stroke="rgba(168,85,247,0.9)" strokeWidth={2.5} />

          {/* Hover indicator */}
          {hoveredPoint && (
            <>
              <line
                x1={hoveredPoint.x}
                y1={padY}
                x2={hoveredPoint.x}
                y2={padY + innerH}
                stroke="rgba(255,255,255,0.2)"
                strokeDasharray="4"
              />
              <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r={5} fill="rgba(168,85,247,0.8)" />
              <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r={7} fill="none" stroke="rgba(168,85,247,0.4)" strokeWidth={1.5} />
            </>
          )}

          {points.slice(-1).map((pt) => (
            <circle key="last" cx={pt.x} cy={pt.y} r={4} fill="rgba(168,85,247,1)" />
          ))}
        </svg>
        <div className="flex items-center justify-between px-3 pb-3 text-[11px] text-zinc-500">
          <span>{first ? formatShortDate(first) : ""}</span>
          <span>{last ? formatShortDate(last) : ""}</span>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredPoint && (
        <div className="rounded-lg border border-violet-500/30 bg-violet-950/40 p-3">
          <p className="text-xs font-medium text-violet-100">{formatFullDate(hoveredPoint.date)}</p>
          <p className="mt-1 text-lg font-semibold text-white">{formatNumber(hoveredPoint.value)}</p>
          <p className="mt-0.5 text-xs text-violet-200">{metricLabel}</p>
        </div>
      )}
    </div>
  );
}

function TrendDataTable({
  series,
  metricLabel,
}: {
  series: Array<{ date: string; value: number }>;
  metricLabel: string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/[0.08] bg-zinc-950/40">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.08]">
            <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400">Date</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-zinc-400">{metricLabel}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.08]">
          {series.map((row) => (
            <tr key={row.date} className="hover:bg-white/[0.02]">
              <td className="px-3 py-2 text-xs text-zinc-300">{formatFullDate(row.date)}</td>
              <td className="px-3 py-2 text-right text-xs font-medium text-zinc-100">{formatNumber(row.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
