import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicShareView } from "@/components/share/PublicShareView";
import { createPageMetadata } from "@/lib/metadata";
import { buildSharePageMetadata } from "@/lib/og/share-metadata";
import { getSavedAnalysisPreview } from "@/lib/saved-analysis-labels";
import { getPublicSharedAnalysis } from "@/server/analyses/getPublicSharedAnalysis";

type PageProps = {
  params: Promise<{ shareId: string }>;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shareId } = await params;

  if (!UUID_RE.test(shareId)) {
    return createPageMetadata({
      title: "Shared analysis",
      description: "This shared Summify analysis is not available.",
      path: `/share/${shareId}`,
      noIndex: true,
    });
  }

  const shared = await getPublicSharedAnalysis(shareId);
  if (!shared) {
    return createPageMetadata({
      title: "Shared analysis unavailable",
      description: "This link is private or no longer exists.",
      path: `/share/${shareId}`,
      noIndex: true,
    });
  }

  const title = shared.summary.title ?? shared.title;
  const preview = getSavedAnalysisPreview(shared.summary, 160);

  return buildSharePageMetadata({
    title,
    preview,
    shareId,
  });
}

export default async function PublicSharePage({ params }: PageProps) {
  const { shareId } = await params;

  if (!UUID_RE.test(shareId)) {
    notFound();
  }

  const shared = await getPublicSharedAnalysis(shareId);
  if (!shared) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-zinc-100">
      <PublicShareView shared={shared} shareId={shareId} />
    </div>
  );
}
