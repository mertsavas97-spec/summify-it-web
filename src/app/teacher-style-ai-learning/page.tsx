import { FormatLandingTemplate } from "@/components/seo/FormatLandingTemplate";
import { TEACHER_STYLE_AI } from "@/data/audio-study-landings";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Teacher-Style AI Learning — Spoken Lessons From Documents",
  description:
    "Teacher-style AI learning with structured lesson scripts and natural voice audio. Turn research papers, lectures, and reports into spoken study sessions.",
  path: "/teacher-style-ai-learning",
  keywords: ["teacher-style AI", "AI teacher voice", "spoken lessons", "audio learning AI"],
});

export default function TeacherStyleAiLearningPage() {
  return <FormatLandingTemplate config={TEACHER_STYLE_AI} />;
}
