import { FormatLandingTemplate } from "@/components/seo/FormatLandingTemplate";
import { AI_AUDIO_STUDY_GUIDE } from "@/data/audio-study-landings";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "AI Audio Study Guide — Listen Instead of Rereading",
  description:
    "Practical AI audio study workflows: passive learning, audio recap generation, quiz-first review, and teacher-style voice lessons with Summify.",
  path: "/ai-audio-study-guide",
  keywords: ["AI audio study guide", "passive learning AI", "audio recap", "study companion"],
});

export default function AiAudioStudyGuidePage() {
  return <FormatLandingTemplate config={AI_AUDIO_STUDY_GUIDE} />;
}
