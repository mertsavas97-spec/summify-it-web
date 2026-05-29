"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type DatePreset = "7d" | "30d" | "90d" | "custom";

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

export function AdminProductAnalyticsDashboard() {
  const [preset, setPreset] = useState<DatePreset>("30d");
  const [customStart, setCustomStart] = useState<string>(todayIso());
  const [customEnd, setCustomEnd] = useState<string>(todayIso());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProductAnalyticsResponse | null>(null);
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
            <SectionHeader title="Product Overview" subtitle="Core usage signals (not traffic)." />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <MetricCardStrong title="Analyses" value={formatNumber(data.overview.analysesCompleted)} helper="Completed" />
              <MetricCardStrong title="Uploads" value={formatNumber(data.overview.uploadsCompleted)} helper="Completed" />
              <MetricCardStrong
                title="Avg analyses/user"
                value={new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(data.overview.avgAnalysesPerUser)}
                helper="Users with analysis"
              />
              <MetricCardStrong title="Learn cards" value={formatNumber(data.overview.learnCardsOpened)} helper="Opened" />
              <MetricCardStrong title="Audio mode" value={formatNumber(data.overview.audioModeClicks)} helper="Clicks" />
              <MetricCardStrong title="Podcast" value={formatNumber(data.overview.podcastClicks)} helper="Clicks" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <KeyValueCard title="Most used intelligence mode" value={data.overview.mostUsedMode ?? "—"} />
              <KeyValueCard title="Most used source type" value={data.overview.mostUsedSource ?? "—"} />
            </div>

            <SectionHeader title="Funnel" subtitle="Visitor → Upload → Analysis → Signup → Pricing → Subscription" />
            <FunnelCard data={data.funnel} />

            <SectionHeader title="Top Modes" subtitle="Based on analysis_completed metadata." />
            <TopListCard rows={data.topModes} />

            <SectionHeader title="Top Sources" subtitle="Based on analysis_completed metadata." />
            <TopListCard rows={data.topSources} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mt-2">
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

function TopListCard({ rows }: { rows: Array<{ key: string; count: number }> }) {
  return (
    <CardShell title="">
      {rows.length === 0 ? (
        <p className="text-xs text-zinc-500">No data.</p>
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

function FunnelCard({
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
    { label: "Visitor", count: data.visitor },
    { label: "Upload", count: data.upload, rate: data.rates.visitor_to_upload },
    { label: "Analysis", count: data.analysis, rate: data.rates.upload_to_analysis },
    { label: "Signup", count: data.signup, rate: data.rates.analysis_to_signup },
    { label: "Pricing", count: data.pricing, rate: data.rates.signup_to_pricing },
    { label: "Subscription", count: data.subscription, rate: data.rates.pricing_to_subscription },
  ];

  return (
    <CardShell title="Visitor → Subscription" right={<span className="text-xs text-zinc-500">unique sessions</span>}>
      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div key={row.label} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-200">{idx === 0 ? row.label : `→ ${row.label}`}</p>
              {idx > 0 ? (
                <p className="mt-0.5 text-[11px] text-zinc-500">Stage conversion: {formatPercent(row.rate ?? 0)}</p>
              ) : null}
            </div>
            <p className="text-xs font-semibold text-zinc-100">{formatNumber(row.count)}</p>
          </div>
        ))}
      </div>
    </CardShell>
  );
}
