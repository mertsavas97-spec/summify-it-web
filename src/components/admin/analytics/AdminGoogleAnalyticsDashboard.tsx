"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type DatePreset = "today" | "7d" | "30d" | "90d" | "custom";

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
        uploadVisits: number;
        pricingVisits: number;
        loginVisits: number;
      };
      breakdowns: {
        topPages: Array<{ key: string; value: number }>;
        trafficSources: Array<{ key: string; value: number }>;
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

export function AdminGoogleAnalyticsDashboard() {
  const [preset, setPreset] = useState<DatePreset>("7d");
  const [customStart, setCustomStart] = useState<string>(todayIso());
  const [customEnd, setCustomEnd] = useState<string>(todayIso());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GoogleAnalyticsResponse | null>(null);
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

  return (
    <div>
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
          <div className="mt-5 space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <MetricCard label="Unique visitors" value={formatNumber(data.metrics.uniqueVisitors)} />
              <MetricCard label="Visits" value={formatNumber(data.metrics.visits)} />
              <MetricCard label="Page views" value={formatNumber(data.metrics.pageViews)} />
              <MetricCard label="Upload visits" value={formatNumber(data.metrics.uploadVisits)} />
              <MetricCard label="Pricing visits" value={formatNumber(data.metrics.pricingVisits)} />
              <MetricCard label="Login visits" value={formatNumber(data.metrics.loginVisits)} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <BreakdownCard title="Top pages" rows={data.breakdowns.topPages} />
              <BreakdownCard title="Traffic sources" rows={data.breakdowns.trafficSources} />
              <BreakdownCard title="Devices" rows={data.breakdowns.devices} />
              <BreakdownCard title="Countries" rows={data.breakdowns.countries} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-zinc-950/60 p-3">
      <p className="text-[11px] font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function BreakdownCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ key: string; value: number }>;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-zinc-950/60 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-3 space-y-2">
        {rows.length === 0 ? (
          <p className="text-xs text-zinc-500">No data.</p>
        ) : (
          rows.map((row) => (
            <div key={`${title}-${row.key}`} className="flex items-center justify-between gap-3">
              <p className="truncate text-xs text-zinc-300">{row.key || "(not set)"}</p>
              <p className="text-xs font-medium text-zinc-100">{formatNumber(row.value)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
