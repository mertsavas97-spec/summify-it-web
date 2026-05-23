import type { Metadata } from "next";
import Link from "next/link";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireAdminPage } from "@/lib/admin/requireAdmin";
import { ensureProfileForUser, formatPlanLabel, getProfile, getUserLimits } from "@/lib/auth";
import { createPageMetadata } from "@/lib/metadata";
import { countUserAnalyses } from "@/server/analyses/countUserAnalyses";
import { DEFAULT_PAID_PREVIEW_PLAN } from "@/types/plan";
import { ApiHealthDashboardView } from "@/components/admin/ApiHealthDashboardView";
import { getApiHealth } from "@/server/admin/getApiHealth";

export const metadata: Metadata = createPageMetadata({
  title: "API Health & Usage",
  description: "Monitor external API configuration, usage, and health.",
  path: "/dashboard/admin/api-health",
  noIndex: true,
});

export default async function ApiHealthPage() {
  const user = await requireAdminPage();
  await ensureProfileForUser();

  const [profile, limits, savedCount, health] = await Promise.all([
    getProfile(user.id),
    getUserLimits(user.id),
    countUserAnalyses(user.id),
    getApiHealth(),
  ]);

  const planLabel = formatPlanLabel(profile?.plan ?? DEFAULT_PAID_PREVIEW_PLAN, profile);
  const daily = limits?.daily_analysis_count ?? 0;

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <DashboardSidebar
        savedCount={savedCount}
        dailyCount={daily}
        planLabel={planLabel}
      />
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <header className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-950/30 via-zinc-900/50 to-zinc-950/80 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Badge variant="accent" className="mb-2">
                  Internal
                </Badge>
                <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  API Health & Usage
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
                  Monitor external API configuration, usage metrics, estimated costs, and quota status.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button href="/dashboard/admin" size="sm" variant="secondary">
                  Back to Admin
                </Button>
                <Button href="/dashboard" size="sm" variant="secondary">
                  Workspace
                </Button>
              </div>
            </div>
          </header>

          <div className="mt-8">
            <ApiHealthDashboardView health={health} />
          </div>

          <p className="mt-8 text-center text-[11px] text-zinc-600">
            <Link href="/dashboard/admin" className="hover:text-zinc-400">
              Return to admin dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}