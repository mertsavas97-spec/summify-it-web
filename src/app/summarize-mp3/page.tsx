import { pageSeo } from "@/lib/page-metadata";
import { FormatLandingTemplate } from "@/components/seo/FormatLandingTemplate";
import { MP3_LANDING } from "@/data/format-landings";

export const metadata = pageSeo.summarizeMp3;

export default function SummarizeMp3Page() {
  return <FormatLandingTemplate config={MP3_LANDING} />;
}
