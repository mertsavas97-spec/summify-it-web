import { JsonLd } from "@/components/seo/JsonLd";
import { CTASection } from "@/components/public/CTASection";
import { FAQSection } from "@/components/public/FAQSection";
import { FeatureGrid } from "@/components/public/FeatureGrid";
import { FormatWorkflow } from "@/components/public/FormatWorkflow";
import { PublicHero } from "@/components/public/PublicHero";
import { RelatedLinksSection } from "@/components/public/RelatedLinksSection";
import { SeoBreadcrumbs } from "@/components/public/SeoBreadcrumbs";
import { SeoContentSection } from "@/components/public/SeoContentSection";
import { UseCaseSection } from "@/components/public/UseCaseSection";
import { pageSeo } from "@/lib/page-metadata";
import { seoLandingPageJsonLd } from "@/lib/schema";

export const metadata = pageSeo.videoSummarizer;

const FAQS = [
  {
    q: "Does this work with any YouTube video?",
    a: "Summify uses caption-based transcripts. Videos with captions or auto-generated subtitles work best.",
  },
  {
    q: "Do I need to sign up?",
    a: "No account is required for your first analysis. Create a free account to save summaries to your workspace.",
  },
  {
    q: "What do I get besides a text summary?",
    a: "Structured key points, Learn cards, optional quizzes, and teacher-style audio lessons from the same video.",
  },
];

export default function VideoSummarizerPage() {
  return (
    <>
      <JsonLd
        data={seoLandingPageJsonLd({
          path: "/video-summarizer",
          pageTitle: "YouTube Video Summarizer",
          description:
            "Summarize YouTube videos instantly with AI. Get transcripts, key points, and study quizzes from lectures and tutorials.",
          faqs: FAQS,
          howToSteps: [
            { name: "Paste YouTube URL", text: "Drop a lecture, tutorial, or long-form video link." },
            { name: "Fetch transcript", text: "Summify extracts captions server-side." },
            { name: "Get instant summary", text: "Key themes, insights, and structured notes in seconds." },
            { name: "Study with cards & audio", text: "Optional quizzes and listenable lessons on the go." },
          ],
        })}
      />
      <SeoBreadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Video Summarizer", href: "/video-summarizer" },
        ]}
      />
      <PublicHero
        badge="Free YouTube video summarizer"
        title="Free YouTube Video Summarizer AI"
        description={
          <>
            <span className="block text-base font-medium text-zinc-200">
              Turn any YouTube video into a summary, transcript, and study quiz in seconds.
            </span>
            <span className="mt-3 block text-sm text-zinc-500">
              Works with lectures and tutorials · Transcripts included · No signup for first summary
            </span>
          </>
        }
        primaryCta={{ href: "/upload", label: "Paste YouTube Link" }}
        secondaryCta={{ href: "/summarize-youtube-video", label: "YouTube study workflow" }}
      />
      <SeoContentSection
        eyebrow="Video intelligence"
        title="Summarize videos without rewatching the full runtime"
        blocks={[
          {
            body: "Paste a YouTube URL and Summify pulls the transcript, then runs AI analysis tuned to your intelligence mode — ideal when you need key points fast from lectures, tutorials, or long talks.",
          },
        ]}
      />
      <FeatureGrid
        title="What you get"
        features={[
          { title: "Video transcript", description: "Automatic transcript extraction from captioned YouTube videos." },
          { title: "Instant summary", description: "Key points extracted in seconds, not minutes of watching." },
          { title: "Audio lessons", description: "Listen to summaries while commuting or exercising." },
          { title: "Study quizzes", description: "Auto-generated quizzes to test what you learned." },
        ]}
      />
      <FormatWorkflow
        title="How to summarize a YouTube video"
        steps={[
          { title: "Paste link", description: "Standard, Shorts, or youtu.be URLs supported." },
          { title: "Extract transcript", description: "Caption-based extraction on the server." },
          { title: "Review summary", description: "Structured overview, insights, and themes." },
          { title: "Learn & quiz", description: "Cards and optional audio for revision." },
        ]}
      />
      <UseCaseSection
        title="Perfect for"
        cases={[
          { title: "Lecture recordings", description: "Save hours of re-watching class videos." },
          { title: "Tutorial videos", description: "Extract key steps from how-to content." },
          { title: "Long-form talks", description: "TED talks, interviews, and panels distilled fast." },
          { title: "Research presentations", description: "Get main findings without full playback." },
        ]}
      />
      <FAQSection items={FAQS} />
      <RelatedLinksSection
        links={[
          { href: "/pdf-summarizer", label: "PDF Summarizer", description: "Pair readings with video notes." },
          { href: "/youtube-video-summarizer", label: "YouTube video summarizer", description: "Educational video landing page." },
          { href: "/summarize-youtube-video", label: "YouTube to study workflow", description: "Full transcript-to-audio path." },
        ]}
      />
      <CTASection
        title="Start summarizing videos free"
        description="No signup required for your first summary. Paste a YouTube link in the workspace."
        primaryLabel="Try free now"
      />
    </>
  );
}
