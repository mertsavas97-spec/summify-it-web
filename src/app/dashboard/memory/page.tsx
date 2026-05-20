import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LEARN_DASHBOARD_PATH } from "@/lib/learn/paths";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Learn",
  description: "Practice and review insights from your saved Summify analyses.",
  path: "/dashboard/memory",
  noIndex: true,
});

type PageProps = {
  searchParams: Promise<{ analysisId?: string }>;
};

/** Legacy route — redirects to Learn dashboard while preserving query params. */
export default async function MemoryPageRedirect({ searchParams }: PageProps) {
  const { analysisId } = await searchParams;
  const target = analysisId
    ? `${LEARN_DASHBOARD_PATH}?analysisId=${encodeURIComponent(analysisId)}`
    : LEARN_DASHBOARD_PATH;
  redirect(target);
}
