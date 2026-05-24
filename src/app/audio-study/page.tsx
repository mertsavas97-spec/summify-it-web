import { FormatLandingTemplate } from "@/components/seo/FormatLandingTemplate";
import { AUDIO_STUDY_HUB } from "@/data/audio-study-landings";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Audio Study Mode — AI Voice Lessons",
  description:
    "Study while walking, during workouts, and across passive study time. Summify doesn't give you a summary. It becomes your study companion with audio-first lessons.",
  path: "/audio-study",
  keywords: ["audio study", "AI voice study", "learn by listening", "teacher-style lessons"],
});

export default function AudioStudyPage() {
  return <FormatLandingTemplate config={AUDIO_STUDY_HUB} />;
}
