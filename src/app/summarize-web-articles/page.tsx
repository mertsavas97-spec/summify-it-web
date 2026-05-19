import { pageSeo } from "@/lib/page-metadata";
import { FormatLandingTemplate } from "@/components/seo/FormatLandingTemplate";
import { WEB_ARTICLES_LANDING } from "@/data/format-landings";

export const metadata = pageSeo.summarizeWebArticles;

export default function SummarizeWebArticlesPage() {
  return <FormatLandingTemplate config={WEB_ARTICLES_LANDING} />;
}
