import { FormatLandingTemplate } from "@/components/seo/FormatLandingTemplate";
import { PDF_TO_AUDIO_STUDY } from "@/data/audio-study-landings";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "PDF to Audio Study — Turn PDFs Into Audio Lessons",
  description:
    "Convert PDFs into AI audio study sessions. Summarize papers online, generate Learn cards and quizzes, then listen to teacher-style lessons on the go.",
  path: "/pdf-to-audio-study",
  keywords: ["PDF to audio", "audio study PDF", "listen to PDF", "AI study audio"],
});

export default function PdfToAudioStudyPage() {
  return <FormatLandingTemplate config={PDF_TO_AUDIO_STUDY} />;
}
