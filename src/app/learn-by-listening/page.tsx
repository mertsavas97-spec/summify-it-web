import { FormatLandingTemplate } from "@/components/seo/FormatLandingTemplate";
import { LEARN_BY_LISTENING } from "@/data/audio-study-landings";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Learn by Listening — AI Voice Study Workflows",
  description:
    "Learn by listening with Summify: study while walking or commuting, replay teacher-style audio lessons, and pair voice study with PDF and YouTube summaries.",
  path: "/learn-by-listening",
  keywords: ["learn by listening", "voice study", "study while walking", "AI learning audio"],
});

export default function LearnByListeningPage() {
  return <FormatLandingTemplate config={LEARN_BY_LISTENING} />;
}
