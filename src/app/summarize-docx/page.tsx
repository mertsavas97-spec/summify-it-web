import { pageSeo } from "@/lib/page-metadata";
import { FormatLandingTemplate } from "@/components/seo/FormatLandingTemplate";
import { DOCX_LANDING } from "@/data/format-landings";

export const metadata = pageSeo.summarizeDocx;

export default function SummarizeDocxPage() {
  return <FormatLandingTemplate config={DOCX_LANDING} />;
}
