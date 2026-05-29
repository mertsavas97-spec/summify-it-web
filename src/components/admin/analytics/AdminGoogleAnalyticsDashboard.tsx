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
    "/upload": "Upload workspace",
    "/pricing": "Pricing",
    "/login": "Login",
    "/dashboard": "Dashboard",
    "/blog": "Blog",
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

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-sky-950/30 via-zinc-900/50 to-zinc-950/80 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge variant="accent" className="mb-2">
              Internal
            </Badge>
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Admin Analytics
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
              Google Analytics (GA4) overview.
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

      <div className="mt-6 rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-4 sm:p-5">
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
              Click “Connect Google Analytics” to authorize read-only access. Tokens stay on the server.
            </p>
          </div>
        ) : null}

        {!loading && data?.connected === true ? (
          <div className="mt-6 space-y-6">
            {!hasAnyData ? (
              <div className="rounded-xl border border-white/[0.08] bg-zinc-950/60 p-4">
                <p className="text-sm text-zinc-300">No analytics data for this range yet.</p>
                <p className="mt-2 text-xs text-zinc-500">
                  GA4 can take a bit to populate. Try a longer range like 30d.
                </p>
              </div>
            ) : null}

            {/* A) Overview */}
            <SectionHeader title="Overview" subtitle="Founder-friendly snapshot of the last period." />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <MetricCardStrong
                title="People"
                value={formatNumber(data.metrics.uniqueVisitors)}
                helper="Unique visitors"
              />
              <MetricCardStrong title="Sessions" value={formatNumber(data.metrics.visits)} helper="Total visits" />
              <MetricCardStrong
                title="Page opens"
                value={formatNumber(data.metrics.pageViews)}
                helper="All page views"
              />
              <MetricCardStrong
                title="Upload page opens"
                value={formatNumber(data.metrics.uploadVisits)}
                helper="Interest in summarizing"
              />
              <MetricCardStrong
                title="Pricing interest"
                value={formatNumber(data.metrics.pricingVisits)}
                helper="Visits to pricing"
              />
              <MetricCardStrong
                title="Login intent"
                value={formatNumber(data.metrics.loginVisits)}
                helper="Visits to login"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* B) Traffic trend */}
              <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-4">
                <SectionHeader
                  title="Traffic trend"
                  subtitle="Daily movement across the selected range."
                  compact
                />
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
                    Page opens
                  </Button>
                </div>

                <div className="mt-4">
                  {!hasTimeSeries ? (
                    <p className="text-xs text-zinc-500">No trend data yet.</p>
                  ) : (
                    <MiniLineChart series={trendSeries} />
                  )}
                </div>
              </div>

              {/* C) Conversion signals */}
              <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-4">
                <SectionHeader
                  title="Conversion signals"
                  subtitle="Quick, page-based signals that correlate with intent."
                  compact
                />

                <div className="mt-4 space-y-4">
                  <SignalBar
                    label="Landing to Upload"
                    value={safeDivide(data.metrics.uploadVisits, data.metrics.homepageVisits)}
                    rightLabel={formatPercent(safeDivide(data.metrics.uploadVisits, data.metrics.homepageVisits))}
                  />
                  <SignalBar
                    label="Upload to Pricing"
                    value={safeDivide(data.metrics.pricingVisits, data.metrics.uploadVisits)}
                    rightLabel={formatPercent(safeDivide(data.metrics.pricingVisits, data.metrics.uploadVisits))}
                  />
                  <SignalBar
                    label="Upload to Login"
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
            <SectionHeader title="Acquisition" subtitle="Where people are coming from." />
            <div className="grid gap-4 lg:grid-cols-2">
              <TrafficSourcesTable rows={data.breakdowns.trafficSources} />
              <DevicesCard rows={devicesNormalized} />
            </div>

            {/* E) Content / pages */}
            <SectionHeader title="Content / pages" subtitle="What’s being opened." />
            <TopPagesTable rows={data.breakdowns.topPages} />

            {/* F) Geography & devices */}
            <SectionHeader title="Geography & devices" subtitle="Where people are and what they use." />
            <div className="grid gap-4 lg:grid-cols-2">
              <CountriesCard rows={data.breakdowns.countries} />
              <DevicesCard rows={devicesNormalized} />
            </div>
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
      <div className="mt-3 h-[2px] w-10 rounded-full bg-purple-500/60" />
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
        <div className="h-full rounded-full bg-purple-500/70" style={{ width }} />
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
    <CardShell title="Traffic sources" right={<span className="text-xs text-zinc-500">People & Sessions</span>}>
      {rows.length === 0 ? (
        <p className="text-xs text-zinc-500">No data.</p>
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
    <CardShell title="Top pages" right={<span className="text-xs text-zinc-500">Views & People</span>}>
      {rows.length === 0 ? (
        <p className="text-xs text-zinc-500">No data.</p>
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
              <div key={`page-${row.key}`} className="grid grid-cols-[1fr_auto_auto_auto] gap-3">
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
    <CardShell title="Devices" right={<span className="text-xs text-zinc-500">% of people</span>}>
      {rows.length === 0 ? (
        <p className="text-xs text-zinc-500">No data.</p>
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
                    className="h-full rounded-full bg-purple-500/60"
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
    <CardShell title="Countries" right={<span className="text-xs text-zinc-500">People</span>}>
      {rows.length === 0 ? (
        <p className="text-xs text-zinc-500">No data.</p>
      ) : (
        <div className="space-y-2">
          {rows
            .slice()
            .sort((a, b) => b.value - a.value)
            .map((row) => {
              const pct = total > 0 ? row.value / total : 0;
              return (
                <div key={`country-${row.key}`} className="flex items-center justify-between gap-3">
                  <p className="truncate text-xs text-zinc-200">{row.key || "Unknown"}</p>
                  <div className="flex items-center gap-3">
                    <p className="w-14 text-right text-xs font-medium text-zinc-100">{formatNumber(row.value)}</p>
                    <p className="w-12 text-right text-xs text-zinc-500">{formatPercent(pct)}</p>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </CardShell>
  );
}

function MiniLineChart({ series }: { series: Array<{ date: string; value: number }> }) {
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

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-950/40">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full">
        <defs>
          <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(168,85,247,0.35)" />
            <stop offset="100%" stopColor="rgba(168,85,247,0)" />
          </linearGradient>
        </defs>

        {/* subtle grid */}
        <line x1={padX} y1={padY + innerH} x2={padX + innerW} y2={padY + innerH} stroke="rgba(255,255,255,0.08)" />
        <line x1={padX} y1={padY} x2={padX} y2={padY + innerH} stroke="rgba(255,255,255,0.08)" />

        <path d={areaD} fill="url(#trendFill)" />
        <path d={d} fill="none" stroke="rgba(168,85,247,0.9)" strokeWidth={2.5} />

        {points.slice(-1).map((pt) => (
          <circle key="last" cx={pt.x} cy={pt.y} r={4} fill="rgba(168,85,247,1)" />
        ))}
      </svg>
      <div className="flex items-center justify-between px-3 pb-3 text-[11px] text-zinc-500">
        <span>{first ? formatShortDate(first) : ""}</span>
        <span>{last ? formatShortDate(last) : ""}</span>
      </div>
    </div>
  );
}
