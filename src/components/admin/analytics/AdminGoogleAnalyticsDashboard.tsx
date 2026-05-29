"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type DatePreset = "today" | "7d" | "30d" | "90d" | "custom";

type TrendMetric = "people" | "sessions" | "pageOpens";

type GoogleAnalyticsResponse =
  | {
      connected: false;
      error?: string;
    }
  | {
      connected: true;
      dateRange: { startDate: string; endDate: string };
      metrics: {
        uniqueVisitors: number;
        visits: number;
        pageViews: number;
        homepageVisits: number;
        uploadVisits: number;
        pricingVisits: number;
        loginVisits: number;
      };
      timeseries: {
        peopleByDay: Array<{ date: string; value: number }>;
        sessionsByDay: Array<{ date: string; value: number }>;
        pageOpensByDay: Array<{ date: string; value: number }>;
      };
      breakdowns: {
        topPages: Array<{ key: string; value1: number; value2: number }>;
        trafficSources: Array<{ key: string; value1: number; value2: number }>;
        devices: Array<{ key: string; value: number }>;
        countries: Array<{ key: string; value: number }>;
      };
    };

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function safeDivide(n: number, d: number) {
  if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) return 0;
  return n / d;
}

function formatPercent(value: number) {
  const v = Math.max(0, Math.min(1, value));
  return new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 0 }).format(v);
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function presetLabel(preset: DatePreset, range?: { startDate: string; endDate: string }) {
  if (preset === "today") return "Showing today";
  if (preset === "7d") return "Showing last 7 days";
  if (preset === "30d") return "Showing last 30 days";
  if (preset === "90d") return "Showing last 90 days";
  if (preset === "custom" && range) return `Showing ${range.startDate} → ${range.endDate}`;
  return "";
}

function mapPageLabel(path: string): { label: string; sublabel?: string } {
  const clean = path || "(not set)";
  const base = clean.split("?")[0];
  const mapping: Record<string, string> = {
    "/": "Homepage",
    "/upload": "Upload Workspace",
    "/pricing": "Pricing",
    "/login": "Login",
    "/dashboard": "Dashboard",
    "/blog": "Blog",
    "/account": "Account",
  };
  const direct = mapping[base];
  if (direct) return { label: direct, sublabel: base };
  return { label: base, sublabel: base !== clean ? clean : undefined };
}

function mapSourceLabel(source: string): string {
  const s = (source || "").trim().toLowerCase();
  const mapping: Record<string, string> = {
    "(direct)": "Direct",
    google: "Google Search",
    "chatgpt.com": "ChatGPT",
    "facebook.com": "Facebook",
    "accounts.google.com": "Google OAuth / Login",
    "not set": "Unknown",
    "(not set)": "Unknown",
  };
  return mapping[s] ?? (source || "Unknown");
}

function mapDeviceLabel(device: string) {
  const d = (device || "").toLowerCase();
  if (d.includes("desktop")) return "Desktop";
  if (d.includes("mobile")) return "Mobile";
  if (d.includes("tablet")) return "Tablet";
  return device || "Unknown";
}

function normalizeGaDate(date: string) {
  // GA4 returns YYYYMMDD when using `date` dimension.
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

function sum(values: Array<{ value: number }>) {
  return values.reduce((acc, v) => acc + (Number(v.value) || 0), 0);
}

export function AdminGoogleAnalyticsDashboard() {
  const [preset, setPreset] = useState<DatePreset>("7d");
  const [customStart, setCustomStart] = useState<string>(todayIso());
  const [customEnd, setCustomEnd] = useState<string>(todayIso());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GoogleAnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trendMetric, setTrendMetric] = useState<TrendMetric>("people");
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
        const res = await fetch(`/api/admin/analytics/google?${query}`, {
          credentials: "include",
          cache: "no-store",
        });
        const json = (await res.json()) as GoogleAnalyticsResponse & { message?: string };
        if (cancelled) return;
        setData(json);
        if (!res.ok) {
          setError(json.message ?? "Failed to load Google Analytics data");
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const isConnected = data?.connected === true;

  const hasTimeSeries = data?.connected === true && data.timeseries.peopleByDay.length > 0;
  const hasAnyData =
    data?.connected === true &&
    (data.metrics.uniqueVisitors > 0 ||
      data.metrics.visits > 0 ||
      data.metrics.pageViews > 0 ||
      data.breakdowns.topPages.length > 0);

  const rangeLabel = presetLabel(preset, data?.connected === true ? data.dateRange : undefined);

  const trendSeries = useMemo(() => {
    if (data?.connected !== true) return [] as Array<{ date: string; value: number }>;
    const raw =
      trendMetric === "people"
        ? data.timeseries.peopleByDay
        : trendMetric === "sessions"
          ? data.timeseries.sessionsByDay
          : data.timeseries.pageOpensByDay;
    return raw.map((p) => ({ date: normalizeGaDate(p.date), value: p.value }));
  }, [data, trendMetric]);

  const devicesNormalized = useMemo(() => {
    if (data?.connected !== true) return [] as Array<{ key: string; value: number }>;
    const map = new Map<string, number>();
    for (const row of data.breakdowns.devices) {
      const k = mapDeviceLabel(row.key);
      map.set(k, (map.get(k) ?? 0) + row.value);
    }
    // Ensure stable ordering
    const order = ["Desktop", "Mobile", "Tablet"]; // show these first
    const rows = Array.from(map.entries()).map(([key, value]) => ({ key, value }));
    rows.sort((a, b) => {
      const ai = order.indexOf(a.key);
      const bi = order.indexOf(b.key);
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      return b.value - a.value;
    });
    return rows;
  }, [data]);

  const countriesSliced = useMemo(() => {
    if (data?.connected !== true) return [];
    return data.breakdowns.countries.slice().sort((a, b) => b.value - a.value).slice(0, 10);
  }, [data]);

  const trendMetricLabel = trendMetric === "people" ? "People" : trendMetric === "sessions" ? "Sessions" : "Page Opens";

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-sky-950/30 via-zinc-900/50 to-zinc-950/80 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge variant="accent" className="mb-2">
              GA4
            </Badge>
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Admin Analytics
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
              Google Analytics (GA4) overview. Traffic and acquisition metrics.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {!isConnected ? (
              <Button href="/api/admin/google-analytics/connect" size="sm" variant="secondary">
                Connect Google Analytics
              </Button>
            ) : (
              <Badge variant="accent" className="h-9 px-3 text-xs">
                Connected
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-zinc-400">Date range</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" variant={preset === "today" ? "primary" : "secondary"} onClick={() => setPreset("today")}>
                Today
              </Button>
              <Button size="sm" variant={preset === "7d" ? "primary" : "secondary"} onClick={() => setPreset("7d")}>
                7d
              </Button>
              <Button size="sm" variant={preset === "30d" ? "primary" : "secondary"} onClick={() => setPreset("30d")}>
                30d
              </Button>
              <Button size="sm" variant={preset === "90d" ? "primary" : "secondary"} onClick={() => setPreset("90d")}>
                90d
              </Button>
              <Button size="sm" variant={preset === "custom" ? "primary" : "secondary"} onClick={() => setPreset("custom")}>
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

        {!loading && data?.connected === false ? (
          <div className="mt-4 rounded-xl border border-white/[0.08] bg-zinc-950/60 p-4">
            <p className="text-sm text-zinc-300">
              Google Analytics is not connected yet.
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Click &quot;Connect Google Analytics&quot; to authorize read-only access. Tokens stay on the server.
            </p>
          </div>
        ) : null}

        {!loading && data?.connected === true ? (
          <div className="mt-6 space-y-6">
            {!hasAnyData ? (
              <div className="rounded-xl border border-white/[0.08] bg-zinc-950/60 p-4">
                <p className="text-sm text-zinc-300">No traffic data available yet.</p>
                <p className="mt-2 text-xs text-zinc-500">
                  GA4 can take time to populate. Try a longer range like 30d.
                </p>
              </div>
            ) : null}

            {/* A) Overview */}
            <SectionHeader title="Overview" subtitle="Founder-friendly snapshot of the selected period." />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <MetricCardStrong
                title="Visitors"
                value={formatNumber(data.metrics.uniqueVisitors)}
                helper="Unique people"
              />
              <MetricCardStrong title="Sessions" value={formatNumber(data.metrics.visits)} helper="Total visits" />
              <MetricCardStrong
                title="Page Views"
                value={formatNumber(data.metrics.pageViews)}
                helper="All views"
              />
              <MetricCardStrong
                title="Upload Intent"
                value={formatNumber(data.metrics.uploadVisits)}
                helper="Upload page"
              />
              <MetricCardStrong
                title="Pricing Interest"
                value={formatNumber(data.metrics.pricingVisits)}
                helper="Pricing page"
              />
              <MetricCardStrong
                title="Login Intent"
                value={formatNumber(data.metrics.loginVisits)}
                helper="Login page"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* B) Traffic trend */}
              <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-4">
                <div className="flex items-center justify-between">
                  <SectionHeader
                    title="Traffic Trend"
                    subtitle="Daily movement across the selected range."
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
                    variant={trendMetric === "people" ? "primary" : "secondary"}
                    onClick={() => setTrendMetric("people")}
                  >
                    People
                  </Button>
                  <Button
                    size="sm"
                    variant={trendMetric === "sessions" ? "primary" : "secondary"}
                    onClick={() => setTrendMetric("sessions")}
                  >
                    Sessions
                  </Button>
                  <Button
                    size="sm"
                    variant={trendMetric === "pageOpens" ? "primary" : "secondary"}
                    onClick={() => setTrendMetric("pageOpens")}
                  >
                    Page Views
                  </Button>
                </div>

                <div className="mt-4">
                  {!hasTimeSeries ? (
                    <p className="text-xs text-zinc-500">No trend data available yet.</p>
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

              {/* C) Conversion signals */}
              <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-4">
                <SectionHeader
                  title="Conversion Signals"
                  subtitle="Quick, page-based signals that correlate with intent."
                  compact
                />

                <div className="mt-4 space-y-4">
                  <SignalBar
                    label="Homepage → Upload"
                    value={safeDivide(data.metrics.uploadVisits, data.metrics.homepageVisits)}
                    rightLabel={formatPercent(safeDivide(data.metrics.uploadVisits, data.metrics.homepageVisits))}
                  />
                  <SignalBar
                    label="Upload → Pricing"
                    value={safeDivide(data.metrics.pricingVisits, data.metrics.uploadVisits)}
                    rightLabel={formatPercent(safeDivide(data.metrics.pricingVisits, data.metrics.uploadVisits))}
                  />
                  <SignalBar
                    label="Upload → Login"
                    value={safeDivide(data.metrics.loginVisits, data.metrics.uploadVisits)}
                    rightLabel={formatPercent(safeDivide(data.metrics.loginVisits, data.metrics.uploadVisits))}
                  />
                </div>

                <p className="mt-4 text-xs text-zinc-500">
                  Page-based signals from GA4, not exact user-level funnels.
                </p>
              </div>
            </div>

            {/* D) Acquisition */}
            <SectionHeader title="Acquisition" subtitle="Where visitors are coming from." />
            <div className="grid gap-4 lg:grid-cols-2">
              <TrafficSourcesTable rows={data.breakdowns.trafficSources} />
              <DevicesCard rows={devicesNormalized} />
            </div>

            {/* E) Content / pages */}
            <SectionHeader title="Content & Pages" subtitle="Most visited pages." />
            <TopPagesTable rows={data.breakdowns.topPages} />

            {/* F) Geography */}
            <SectionHeader title="Geography" subtitle="Where visitors are located." />
            <CountriesCard rows={countriesSliced} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MetricCardStrong({
  title,
  value,
  helper,
}: {
  title: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-zinc-950/70 to-zinc-950/40 p-4">
      <p className="text-xs font-medium text-zinc-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{helper}</p>
      <div className="mt-3 h-[2px] w-10 rounded-full bg-sky-500/60" />
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  compact,
}: {
  title: string;
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "" : "mt-2"}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs text-zinc-500">{subtitle}</p> : null}
        </div>
      </div>
    </div>
  );
}

function CardShell({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
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

function SignalBar({
  label,
  value,
  rightLabel,
}: {
  label: string;
  value: number;
  rightLabel: string;
}) {
  const width = `${Math.round(clamp01(value) * 100)}%`;
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-zinc-300">{label}</p>
        <p className="text-xs font-semibold text-zinc-100">{rightLabel}</p>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-sky-500/70" style={{ width }} />
      </div>
    </div>
  );
}

function TrafficSourcesTable({
  rows,
}: {
  rows: Array<{ key: string; value1: number; value2: number }>;
}) {
  return (
    <CardShell title="Traffic Sources" right={<span className="text-xs text-zinc-500">People & Sessions</span>}>
      {rows.length === 0 ? (
        <p className="text-xs text-zinc-500">No traffic sources recorded yet.</p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 text-[11px] font-medium text-zinc-500">
            <p>Source</p>
            <p className="text-right">People</p>
            <p className="text-right">Sessions</p>
          </div>
          {rows.map((row) => (
            <div key={`src-${row.key}`} className="grid grid-cols-[1fr_auto_auto] gap-3">
              <p className="truncate text-xs text-zinc-200">{mapSourceLabel(row.key || "(not set)")}</p>
              <p className="text-right text-xs font-medium text-zinc-100">{formatNumber(row.value1)}</p>
              <p className="text-right text-xs font-medium text-zinc-100">{formatNumber(row.value2)}</p>
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
}

function TopPagesTable({
  rows,
}: {
  rows: Array<{ key: string; value1: number; value2: number }>;
}) {
  return (
    <CardShell title="Top Pages" right={<span className="text-xs text-zinc-500">Views & People</span>}>
      {rows.length === 0 ? (
        <p className="text-xs text-zinc-500">No page data available yet.</p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 text-[11px] font-medium text-zinc-500">
            <p>Page</p>
            <p className="text-right">Views</p>
            <p className="text-right">People</p>
          </div>
          {rows.map((row) => {
            const { label, sublabel } = mapPageLabel(row.key);
            return (
              <div key={`page-${row.key}`} className="grid grid-cols-[1fr_auto_auto] gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-zinc-200">{label}</p>
                  {sublabel ? <p className="truncate text-[11px] text-zinc-500">{sublabel}</p> : null}
                </div>
                <p className="text-right text-xs font-medium text-zinc-100">{formatNumber(row.value1)}</p>
                <p className="text-right text-xs font-medium text-zinc-100">{formatNumber(row.value2)}</p>
              </div>
            );
          })}
        </div>
      )}
    </CardShell>
  );
}

function DevicesCard({ rows }: { rows: Array<{ key: string; value: number }> }) {
  const total = sum(rows);
  return (
    <CardShell title="Devices" right={<span className="text-xs text-zinc-500">% of visitors</span>}>
      {rows.length === 0 ? (
        <p className="text-xs text-zinc-500">No device data available yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const pct = total > 0 ? row.value / total : 0;
            return (
              <div key={`device-${row.key}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-zinc-300">{row.key}</p>
                  <p className="text-xs font-semibold text-zinc-100">{formatPercent(pct)}</p>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-sky-500/60"
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

function CountriesCard({ rows }: { rows: Array<{ key: string; value: number }> }) {
  const total = sum(rows);
  return (
    <CardShell title="Top Countries" right={<span className="text-xs text-zinc-500">People</span>}>
      {rows.length === 0 ? (
        <p className="text-xs text-zinc-500">No geographic data available yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const pct = total > 0 ? row.value / total : 0;
            return (
              <div key={`country-${row.key}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-xs font-medium text-zinc-200">{row.key || "Unknown"}</p>
                  <p className="text-xs font-semibold text-zinc-100">{formatNumber(row.value)}</p>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-sky-500/50"
                    style={{ width: `${Math.round(clamp01(pct) * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">{formatPercent(pct)}</p>
              </div>
            );
          })}
        </div>
      )}
    </CardShell>
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
            <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(14,165,233,0.35)" />
              <stop offset="100%" stopColor="rgba(14,165,233,0)" />
            </linearGradient>
          </defs>

          {/* subtle grid */}
          <line x1={padX} y1={padY + innerH} x2={padX + innerW} y2={padY + innerH} stroke="rgba(255,255,255,0.08)" />
          <line x1={padX} y1={padY} x2={padX} y2={padY + innerH} stroke="rgba(255,255,255,0.08)" />

          <path d={areaD} fill="url(#trendFill)" />
          <path d={d} fill="none" stroke="rgba(14,165,233,0.9)" strokeWidth={2.5} />

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
              <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r={5} fill="rgba(14,165,233,0.8)" />
              <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r={7} fill="none" stroke="rgba(14,165,233,0.4)" strokeWidth={1.5} />
            </>
          )}

          {points.slice(-1).map((pt) => (
            <circle key="last" cx={pt.x} cy={pt.y} r={4} fill="rgba(14,165,233,1)" />
          ))}
        </svg>
        <div className="flex items-center justify-between px-3 pb-3 text-[11px] text-zinc-500">
          <span>{first ? formatShortDate(first) : ""}</span>
          <span>{last ? formatShortDate(last) : ""}</span>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredPoint && (
        <div className="rounded-lg border border-sky-500/30 bg-sky-950/40 p-3">
          <p className="text-xs font-medium text-sky-100">{formatFullDate(hoveredPoint.date)}</p>
          <p className="mt-1 text-lg font-semibold text-white">{formatNumber(hoveredPoint.value)}</p>
          <p className="mt-0.5 text-xs text-sky-200">{metricLabel}</p>
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
