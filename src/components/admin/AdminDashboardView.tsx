import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import type { AdminMetrics, MetricSection } from "@/server/admin/getAdminMetrics";
import type { PlanId } from "@/types/plan";

function formatCount(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US").format(value);
}

function formatUsd(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTimestamp(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function SectionShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
      {description ? (
        <p className="mt-1 text-xs text-zinc-500">{description}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function UnavailableCard({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/[0.08] bg-zinc-950/50 px-4 py-6 text-center">
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}

function MetricGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
  );
}

function SectionContent<T>({
  section,
  render,
}: {
  section: MetricSection<T>;
  render: (data: T) => React.ReactNode;
}) {
  if (!section.available) {
    return <UnavailableCard message={section.message} />;
  }
  return <>{render(section.data)}</>;
}

const PLAN_LABELS: Record<PlanId, string> = {
  free: "Free",
  beta: "Beta",
  pro: "Pro",
  scholar: "Scholar",
  team: "Team",
};

type AdminDashboardViewProps = {
  metrics: AdminMetrics;
};

export function AdminDashboardView({ metrics }: AdminDashboardViewProps) {
  return (
    <div className="space-y-8">
      <p className="text-xs text-zinc-500">
        Last updated: {formatTimestamp(metrics.fetchedAt)}
      </p>

      <SectionShell title="Overview" description="Headline product health at a glance.">
        <SectionContent
          section={metrics.overview}
          render={(data) => (
            <MetricGrid>
              <DashboardStatCard label="Total users" value={formatCount(data.totalUsers)} />
              <DashboardStatCard
                label="Analyses today"
                value={formatCount(data.analysesToday)}
              />
              <DashboardStatCard
                label="Analyses (24h)"
                value={formatCount(data.analysesLast24h)}
              />
              <DashboardStatCard
                label="Paid subs"
                value={formatCount(data.activePaidSubscriptions)}
              />
            </MetricGrid>
          )}
        />
      </SectionShell>

      <SectionShell title="Users">
        <SectionContent
          section={metrics.users}
          render={(data) => (
            <div className="space-y-6">
              <MetricGrid>
                <DashboardStatCard label="Total users" value={formatCount(data.totalUsers)} />
                <DashboardStatCard
                  label="New today"
                  value={formatCount(data.newUsersToday)}
                />
                <DashboardStatCard
                  label="New (7d)"
                  value={formatCount(data.newUsersLast7Days)}
                />
                <DashboardStatCard
                  label="Active (24h)"
                  value={formatCount(data.activeUsersLast24h)}
                  hint="Any usage event"
                />
                <DashboardStatCard
                  label="Active (7d)"
                  value={formatCount(data.activeUsersLast7Days)}
                  hint="Any usage event"
                />
              </MetricGrid>
              <div>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  Plan distribution
                </p>
                <MetricGrid>
                  {(Object.keys(PLAN_LABELS) as PlanId[]).map((planId) => (
                    <DashboardStatCard
                      key={planId}
                      label={PLAN_LABELS[planId]}
                      value={formatCount(data.planDistribution[planId])}
                    />
                  ))}
                </MetricGrid>
              </div>
            </div>
          )}
        />
      </SectionShell>

      <SectionShell title="Usage">
        <SectionContent
          section={metrics.usage}
          render={(data) => (
            <MetricGrid>
              <DashboardStatCard
                label="Total analyses"
                value={formatCount(data.totalAnalyses)}
                hint="Events or saved rows"
              />
              <DashboardStatCard label="Today" value={formatCount(data.analysesToday)} />
              <DashboardStatCard label="Last 24h" value={formatCount(data.analysesLast24h)} />
              <DashboardStatCard label="Last 7d" value={formatCount(data.analysesLast7Days)} />
              <DashboardStatCard
                label="Unique analyzers (24h)"
                value={formatCount(data.uniqueAnalyzersLast24h)}
              />
              <DashboardStatCard
                label="Unique analyzers (7d)"
                value={formatCount(data.uniqueAnalyzersLast7Days)}
              />
              <DashboardStatCard
                label="Avg / active user (7d)"
                value={
                  data.avgAnalysesPerActiveUser7d != null
                    ? String(data.avgAnalysesPerActiveUser7d)
                    : "—"
                }
              />
            </MetricGrid>
          )}
        />
      </SectionShell>

      <SectionShell title="Subscriptions">
        <SectionContent
          section={metrics.subscriptions}
          render={(data) => (
            <div className="space-y-6">
              <MetricGrid>
                <DashboardStatCard
                  label="Active paid"
                  value={formatCount(data.activePaidSubscriptions)}
                />
                <DashboardStatCard label="Pro" value={formatCount(data.proActive)} />
                <DashboardStatCard label="Scholar" value={formatCount(data.scholarActive)} />
                <DashboardStatCard label="Team" value={formatCount(data.teamActive)} />
                <DashboardStatCard label="Monthly billing" value={formatCount(data.monthlyBilling)} />
                <DashboardStatCard label="Yearly billing" value={formatCount(data.yearlyBilling)} />
                <DashboardStatCard label="Canceled" value={formatCount(data.canceled)} />
                <DashboardStatCard label="Past due" value={formatCount(data.pastDue)} />
              </MetricGrid>
              {data.estimatedMrrUsd != null ? (
                <MetricGrid>
                  <DashboardStatCard
                    label="Est. MRR"
                    value={formatUsd(data.estimatedMrrUsd)}
                    hint="From plan list prices"
                  />
                  <DashboardStatCard
                    label="Est. ARR"
                    value={formatUsd(data.estimatedArrUsd)}
                    hint="MRR × 12"
                  />
                </MetricGrid>
              ) : (
                <p className="text-xs text-zinc-500">
                  Revenue estimates unavailable — showing subscription counts only.
                </p>
              )}
              <p className="text-[11px] text-zinc-600">
                Internal/manual accounts excluded from paid subscription counts.
              </p>
            </div>
          )}
        />
      </SectionShell>

      <SectionShell
        title="Sources & modes"
        description="Last 7 days from analysis_completed usage events."
      >
        <SectionContent
          section={metrics.sourcesAndModes}
          render={(data) => (
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  Source types
                </p>
                {data.bySourceKind.length === 0 ? (
                  <p className="text-sm text-zinc-500">No source data in this window.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.bySourceKind.map((row) => (
                      <li
                        key={row.kind}
                        className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-zinc-950/60 px-3 py-2 text-sm"
                      >
                        <span className="text-zinc-300">{row.label}</span>
                        <span className="tabular-nums text-zinc-100">{formatCount(row.count)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  Top intelligence modes
                </p>
                {data.topIntelligenceModes.length === 0 ? (
                  <p className="text-sm text-zinc-500">No mode data in this window.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.topIntelligenceModes.map((row) => (
                      <li
                        key={row.mode}
                        className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-zinc-950/60 px-3 py-2 text-sm"
                      >
                        <span className="truncate text-zinc-300" title={row.mode}>
                          {row.mode}
                        </span>
                        <span className="shrink-0 tabular-nums text-zinc-100">
                          {formatCount(row.count)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        />
      </SectionShell>

      <SectionShell
        title="Learn activity"
        description="From learn_started and learn_completed product events only."
      >
        <SectionContent
          section={metrics.learn}
          render={(data) => (
            <MetricGrid>
              <DashboardStatCard
                label="Learn started (today)"
                value={formatCount(data.learnStartedToday)}
              />
              <DashboardStatCard
                label="Learn started (7d)"
                value={formatCount(data.learnStartedLast7Days)}
              />
              <DashboardStatCard
                label="Learn completed (today)"
                value={formatCount(data.learnCompletedToday)}
              />
              <DashboardStatCard
                label="Learn completed (7d)"
                value={formatCount(data.learnCompletedLast7Days)}
              />
            </MetricGrid>
          )}
        />
      </SectionShell>

      <SectionShell title="Failures">
        <SectionContent
          section={metrics.failures}
          render={(data) => (
            <div className="space-y-4">
              <MetricGrid>
                <DashboardStatCard
                  label="Failed analyses (today)"
                  value={formatCount(data.failedAnalysesToday)}
                />
                <DashboardStatCard
                  label="Failed analyses (7d)"
                  value={formatCount(data.failedAnalysesLast7Days)}
                />
                {data.topFailureReason ? (
                  <DashboardStatCard label="Top failure stage" value={data.topFailureReason} />
                ) : null}
              </MetricGrid>
              {data.webhookFailuresToday != null ? (
                <div>
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    Polar webhook sync (billing)
                  </p>
                  <MetricGrid>
                    <DashboardStatCard
                      label="Webhook failures today"
                      value={formatCount(data.webhookFailuresToday)}
                    />
                    <DashboardStatCard
                      label="Webhook failures (7d)"
                      value={formatCount(data.webhookFailuresLast7Days)}
                    />
                    {data.topWebhookError ? (
                      <DashboardStatCard
                        label="Top webhook error"
                        value={data.topWebhookError}
                      />
                    ) : null}
                  </MetricGrid>
                </div>
              ) : null}
            </div>
          )}
        />
      </SectionShell>
    </div>
  );
}
