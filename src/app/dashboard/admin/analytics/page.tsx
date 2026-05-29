import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin/requireAdmin";
import { createPageMetadata } from "@/lib/metadata";
import {
  ensureProfileForUser,
  formatPlanLabel,
  getProfile,
  getUserLimits,
} from "@/lib/auth";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { countUserAnalyses } from "@/server/analyses/countUserAnalyses";
import { DEFAULT_PAID_PREVIEW_PLAN } from "@/types/plan";
import { AdminGoogleAnalyticsDashboard } from "@/components/admin/analytics/AdminGoogleAnalyticsDashboard";

export const metadata: Metadata = createPageMetadata({
  title: "Admin Analytics",
  description: "Google Analytics metrics for Summify.",
  path: "/dashboard/admin/analytics",
  noIndex: true,
});

export default async function AdminAnalyticsPage() {
  const user = await requireAdminPage();
  await ensureProfileForUser();

  const [profile, limits, savedCount] = await Promise.all([
    getProfile(user.id),
    getUserLimits(user.id),
    countUserAnalyses(user.id),
  ]);

  const planLabel = formatPlanLabel(profile?.plan ?? DEFAULT_PAID_PREVIEW_PLAN, profile);
  const daily = limits?.daily_analysis_count ?? 0;

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <DashboardSidebar savedCount={savedCount} dailyCount={daily} planLabel={planLabel} />
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <AdminGoogleAnalyticsDashboard />
        </div>
      </div>
    </div>
  );
}
