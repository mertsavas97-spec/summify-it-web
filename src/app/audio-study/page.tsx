import { FormatLandingTemplate } from "@/components/seo/FormatLandingTemplate";
import { AUDIO_STUDY_HUB } from "@/data/audio-study-landings";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Audio Study Mode — AI Voice Lessons",
  description:
    "Study while walking, commuting, or working out. Teacher-style AI audio lessons that turn passive time into real progress.",
  path: "/audio-study",
  keywords: ["audio study", "AI voice study", "learn by listening", "teacher-style lessons"],
});

export default function AudioStudyPage() {
  return <FormatLandingTemplate config={AUDIO_STUDY_HUB} />;
}
