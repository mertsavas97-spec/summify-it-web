import type { Metadata } from "next";
import Link from "next/link";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { RecentSummaries } from "@/components/dashboard/RecentSummaries";
import { SavedDocuments } from "@/components/dashboard/SavedDocuments";
import { TemplateUsage } from "@/components/dashboard/TemplateUsage";
import {
  UsageTrackingPlaceholder,
  CachedAnalysesPlaceholder,
  ProviderHealthPlaceholder,
  LearnActivityPlaceholder,
} from "@/components/dashboard/InfrastructurePanel";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Dashboard",
  description:
    "Sample Summify.it dashboard UI — not indexed. Use the upload workspace for live analysis.",
  path: "/dashboard",
  noIndex: true,
});

export default function DashboardPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <DashboardSidebar />
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <DashboardHeader />

          <p className="mt-2 text-[11px] text-zinc-600">
            Public beta — this dashboard is a design preview with sample data. Live
            analysis runs in the{" "}
            <Link href="/upload" className="text-violet-400/80 hover:text-violet-300">
              workspace
            </Link>
            .
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <RecentSummaries />
              <SavedDocuments />
              <TemplateUsage />
            </div>
            <div className="space-y-4">
              <UsageTrackingPlaceholder />
              <CachedAnalysesPlaceholder />
              <ProviderHealthPlaceholder />
              <LearnActivityPlaceholder />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
