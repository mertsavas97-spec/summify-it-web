"use client";

import type { ApiHealthResponse, ProviderConfigStatus, ProviderUsageRollup, ProviderQuotaInfo, ApiUsageEvent } from "@/types/api-usage";

type ApiHealthDashboardViewProps = {
  health: ApiHealthResponse;
};

function getStatusBadge(status: ProviderConfigStatus["status"]) {
  switch (status) {
    case "configured":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Configured
        </span>
      );
    case "warning":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-200">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Warning
        </span>
      );
    case "error":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-200">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
          Error
        </span>
      );
    case "optional_missing":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-200">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
          Optional / Not configured
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-500/30 bg-zinc-500/10 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
          Not Configured
        </span>
      );
  }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatCurrency(value: number | null): string {
  if (value == null) return "No usage yet";
  if (value === 0) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

/** Overview stats cards. */
function OverviewSection({ overview }: { overview: ApiHealthResponse["overview"] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-white/[0.08] bg-zinc-950/40 p-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          Providers Configured
        </p>
        <p className="mt-2 text-2xl font-semibold text-white">
          {overview.configuredProviders} / {overview.totalProviders}
        </p>
      </div>
      <div className="rounded-xl border border-white/[0.08] bg-zinc-950/40 p-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          API Calls Today
        </p>
        <p className="mt-2 text-2xl font-semibold text-white">
          {overview.callsToday}
        </p>
      </div>
      <div className="rounded-xl border border-white/[0.08] bg-zinc-950/40 p-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          Failures Today
        </p>
        <p className="mt-2 text-2xl font-semibold text-white">
          {overview.failuresToday}
        </p>
      </div>
      <div className="rounded-xl border border-white/[0.08] bg-zinc-950/40 p-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          Est. Monthly Cost
        </p>
        <p className="mt-2 text-2xl font-semibold text-white">
          {formatCurrency(overview.estimatedMonthlyCostUsd)}
        </p>
        <p className="mt-1 text-[10px] text-zinc-500">
          Highest: {overview.highestUsageProvider ?? "N/A"}
        </p>
      </div>
    </div>
  );
}

/** Provider status card. */
function ProviderCard({
  config,
  usage,
  quota,
}: {
  config: ProviderConfigStatus;
  usage: ProviderUsageRollup | null;
  quota: ProviderQuotaInfo | null;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-zinc-950/40 p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">{config.name}</h3>
          <p className="mt-0.5 text-[10px] text-zinc-500 font-mono">{config.provider}</p>
        </div>
        {getStatusBadge(config.status)}
      </div>

      {/* Env vars */}
      <div className="mb-3 space-y-1">
        {config.requiredEnvVars.map((env) => (
          <div key={env.name} className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500">{env.name}</span>
            <span
              className={`text-[10px] ${
                env.present ? "text-emerald-400" : config.optional ? "text-zinc-500" : "text-rose-400"
              }`}
            >
              {env.present ? "Present" : config.optional ? "Optional" : "Missing"}
            </span>
          </div>
        ))}
      </div>

      {/* Usage stats */}
      {usage && (
        <div className="grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3">
          <div>
            <p className="text-[10px] text-zinc-500">Today</p>
            <p className="text-sm font-medium text-zinc-200">{usage.callsToday}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500">7 Days</p>
            <p className="text-sm font-medium text-zinc-200">{usage.calls7d}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500">Failures (7d)</p>
            <p className={`text-sm font-medium ${usage.failures7d > 0 ? "text-amber-400" : "text-zinc-200"}`}>
              {usage.failures7d}
            </p>
          </div>
        </div>
      )}

      {/* Cost */}
      {usage && usage.estimatedMonthlyCostUsd != null && (
        <div className="mt-2 border-t border-white/[0.06] pt-2">
          <p className="text-[10px] text-zinc-500">Est. Monthly Cost</p>
          <p className="text-sm font-medium text-zinc-200">
            {formatCurrency(usage.estimatedMonthlyCostUsd)}
          </p>
        </div>
      )}

      {usage && usage.calls7d === 0 && (
        <div className="mt-2 border-t border-white/[0.06] pt-2">
          <p className="text-[10px] text-zinc-500">Usage</p>
          <p className="text-sm font-medium text-zinc-400">No usage yet</p>
        </div>
      )}

      {/* Last activity */}
      <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-2 text-[10px]">
        <div>
          <span className="text-zinc-500">Last success: </span>
          <span className="text-zinc-400">{formatDate(config.lastSuccess)}</span>
        </div>
        <div>
          <span className="text-zinc-500">Last error: </span>
          <span className="text-zinc-400">{config.lastError ? formatDate(config.lastErrorTime) : "None"}</span>
        </div>
      </div>

      {/* Quota info */}
      {quota && (
        <div className="mt-2 border-t border-white/[0.06] pt-2">
          <p className="text-[10px] text-zinc-500">
            {quota.note ?? (quota.quotaRemaining != null ? `Quota: ${quota.quotaRemaining} / ${quota.quotaTotal}` : "No quota info")}
          </p>
        </div>
      )}
    </div>
  );
}

/** Recent events table. */
function RecentEventsTable({ events }: { events: ApiUsageEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-zinc-950/40 p-6 text-center text-sm text-zinc-500">
        No recent events. API usage tracking will appear here once events are logged.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-zinc-950/40">
      <table className="w-full text-left text-[10px]">
        <thead className="border-b border-white/[0.06] bg-zinc-900/50">
          <tr>
            <th className="px-3 py-2.5 font-medium text-zinc-400">Time</th>
            <th className="px-3 py-2.5 font-medium text-zinc-400">Provider</th>
            <th className="px-3 py-2.5 font-medium text-zinc-400">Operation</th>
            <th className="px-3 py-2.5 font-medium text-zinc-400">Status</th>
            <th className="px-3 py-2.5 font-medium text-zinc-400 text-right">Est. Cost</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {events.map((event) => (
            <tr key={event.id} className="hover:bg-white/[0.02]">
              <td className="px-3 py-2 text-zinc-500">{formatDate(event.createdAt ?? undefined)}</td>
              <td className="px-3 py-2 font-medium text-zinc-300">{event.provider}</td>
              <td className="px-3 py-2 text-zinc-400 font-mono">{event.operation}</td>
              <td className="px-3 py-2">
                {event.success ? (
                  <span className="text-emerald-400">Success</span>
                ) : (
                  <span className="text-rose-400" title={event.errorMessage ?? undefined}>Failed</span>
                )}
              </td>
              <td className="px-3 py-2 text-right font-mono text-zinc-400">
                {formatCurrency(event.estimatedCostUsd ?? null)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ApiHealthDashboardView({ health }: ApiHealthDashboardViewProps) {
  return (
    <div className="space-y-6">
      <OverviewSection overview={health.overview} />

      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-200">Provider Status</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {health.providers.map(({ config, usage, quota }) => (
            <ProviderCard key={config.provider} config={config} usage={usage} quota={quota} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-200">Recent API Events</h2>
        <RecentEventsTable events={health.recentEvents} />
        <p className="mt-2 text-[10px] text-zinc-500">
          Last updated: {new Date(health.lastUpdated).toLocaleString()}
        </p>
      </section>
    </div>
  );
}
