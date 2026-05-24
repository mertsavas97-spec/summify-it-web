import { InternalTextLink } from "@/components/public/InternalTextLink";
import type { FormatLandingConfig } from "@/data/format-landings/types";
import {
  AUDIO_STUDY_FAQS,
  AUDIO_STUDY_RELATED,
  audioStudyIntroBlock,
  audioStudyWorkflow,
} from "@/data/audio-study-landings/shared";

export const AUDIO_STUDY_HUB: FormatLandingConfig = {
  path: "/audio-study",
  breadcrumbLabel: "Audio Study Mode",
  hero: {
    badge: "Voice Study · Pro",
    title: "Audio-first studying for walking, workouts, and passive study time",
    description:
      "Summify doesn't give you a summary. It becomes your study companion with structured audio lessons you can use while walking, training, commuting, or recovering between deep work blocks.",
    primaryCta: { href: "/upload", label: "Try in workspace" },
    secondaryCta: { href: "/pricing", label: "See Pro plans" },
    mockVariant: "learn",
  },
  seoContent: {
    eyebrow: "AI study companion",
    title: "Listen, learn, and retain — not just summarize",
    blocks: [
      audioStudyIntroBlock(),
      {
        heading: "What you get",
        body: (
          <>
            Each session includes a full narration script, sectioned breakdowns, and MP3 playback
            with seek controls. Pair with{" "}
            <InternalTextLink href="/summarize-pdf">PDF summaries</InternalTextLink>,{" "}
            <InternalTextLink href="/modes/the-student">The Student mode</InternalTextLink>, and
            post-learn quizzes for a complete study workflow.
          </>
        ),
      },
    ],
  },
  workflow: audioStudyWorkflow(),
  features: {
    title: "Built for passive learning",
    items: [
      {
        title: "Teacher-style narration",
        description: "Clear explanations — not robotic bullet reading.",
      },
      {
        title: "Source-grounded scripts",
        description: "Lessons follow your analysis, Learn themes, and quiz ideas.",
      },
      {
        title: "Natural voice audio",
        description: "High-quality speech synthesis for Pro workspaces.",
      },
      {
        title: "Full study path",
        description: "Summary → Learn → Quiz → Audio Study in one platform.",
      },
    ],
  },
  useCases: {
    title: "When audio study helps most",
    cases: [
      {
        title: "Commuting & walking",
        description: "Review a chapter without staring at a screen.",
      },
      {
        title: "Eye fatigue",
        description: "Listen after long PDF or slide reading sessions.",
      },
      {
        title: "Second-pass review",
        description: "Reinforce quiz misses with a spoken recap.",
      },
    ],
  },
  faqs: AUDIO_STUDY_FAQS,
  relatedLinks: AUDIO_STUDY_RELATED,
  cta: {
    title: "Generate your first audio lesson",
    description: "Upload a document in the workspace and unlock voice study on Pro.",
    primaryLabel: "Open workspace",
    secondaryHref: "/pdf-to-audio-study",
    secondaryLabel: "PDF to audio study",
  },
};

export const PDF_TO_AUDIO_STUDY: FormatLandingConfig = {
  path: "/pdf-to-audio-study",
  breadcrumbLabel: "PDF to Audio Study",
  hero: {
    badge: "PDF · Voice Study",
    title: "Convert PDFs into audio study sessions",
    description:
      "Upload research papers, textbooks, and reports — get structured analysis, Learn cards, quizzes, and teacher-style audio lessons from the same workspace.",
    primaryCta: { href: "/upload", label: "Summarize a PDF" },
    secondaryCta: { href: "/summarize-pdf", label: "PDF summarizer" },
  },
  seoContent: {
    eyebrow: "PDF workflows",
    title: "From static pages to spoken lessons",
    blocks: [
      {
        body: (
          <>
            Rereading the same PDF costs time and attention. After{" "}
            <InternalTextLink href="/summarize-pdf">AI PDF summarization</InternalTextLink>, Audio
            Study Mode reframes your notes as a lesson you can hear — ideal for revision passes
            before exams or client readouts.
          </>
        ),
      },
    ],
  },
  workflow: audioStudyWorkflow(),
  features: {
    title: "Why PDF + audio works",
    items: [
      { title: "Chunk by chapter", description: "Analyze one section at a time for focused audio." },
      { title: "English learn outputs", description: "Learn and quiz in fluent English from any source language." },
      { title: "Quiz then listen", description: "Identify weak concepts, then hear them explained." },
      { title: "Regenerate voices", description: "Pick a narrator voice and regenerate anytime." },
    ],
  },
  useCases: {
    title: "Popular PDF audio workflows",
    cases: [
      { title: "Exam cramming", description: "Listen to chapter recaps between classes." },
      { title: "Research skim", description: "Hear methodology and findings on a walk." },
      { title: "Policy briefs", description: "Executive listen-back for long reports." },
    ],
  },
  faqs: AUDIO_STUDY_FAQS,
  relatedLinks: AUDIO_STUDY_RELATED,
  cta: {
    title: "Turn your next PDF into audio",
    description: "Free summarization in beta · Audio Study on Pro.",
    primaryLabel: "Upload PDF",
  },
};

export const AI_AUDIO_STUDY_GUIDE: FormatLandingConfig = {
  path: "/ai-audio-study-guide",
  breadcrumbLabel: "AI Audio Study Guide",
  hero: {
    badge: "Guide",
    title: "AI audio study guide: listen instead of rereading",
    description:
      "A practical framework for passive learning with AI — when to listen, how to pair audio with quizzes, and how to keep lessons source-accurate.",
    primaryCta: { href: "/upload", label: "Start in workspace" },
    secondaryCta: { href: "/audio-study", label: "Audio Study overview" },
  },
  seoContent: {
    eyebrow: "Workflow design",
    title: "Design a listen-to-learn habit",
    blocks: [
      audioStudyIntroBlock(),
      {
        heading: "Audio recap generation",
        body: (
          <>
            Treat audio as a <em>recap layer</em>, not a replacement for first-pass reading.
            Generate lessons after Learn cards so the script reflects concepts you already
            practiced. Use{" "}
            <InternalTextLink href="/teacher-style-ai-learning">teacher-style AI learning</InternalTextLink>{" "}
            when you need spoken explanations of dense material.
          </>
        ),
      },
    ],
  },
  workflow: audioStudyWorkflow(),
  features: {
    title: "Guide principles",
    items: [
      { title: "Listen after active recall", description: "Quiz first, audio second — stronger retention." },
      { title: "Short sessions win", description: "4–8 minute lessons fit real commutes." },
      { title: "Verify once", description: "Spot-check facts in the PDF after listening." },
      { title: "Regenerate sparingly", description: "New voice or script only when content changes." },
    ],
  },
  useCases: {
    title: "Scenarios",
    subtitle: "Match audio study to your schedule.",
    cases: [
      { title: "Morning walk", description: "One lesson per day from yesterday’s reading." },
      { title: "Gym / chores", description: "Hands-free review of lecture PDFs." },
      { title: "Pre-meeting", description: "Hear executive briefs from uploaded reports." },
    ],
  },
  faqs: AUDIO_STUDY_FAQS,
  relatedLinks: AUDIO_STUDY_RELATED,
  cta: {
    title: "Apply the guide in Summify",
    description: "Upload a source and run the full study path today.",
    primaryLabel: "Open workspace",
  },
};

export const LEARN_BY_LISTENING: FormatLandingConfig = {
  path: "/learn-by-listening",
  breadcrumbLabel: "Learn by Listening",
  hero: {
    badge: "Learn by listening",
    title: "Learn by listening with AI voice study",
    description:
      "Passive learning does not mean passive thinking. Summify turns structured analyses into spoken lessons you can replay, pause, and seek — a premium study companion for busy learners.",
    primaryCta: { href: "/upload", label: "Try Summify free" },
    secondaryCta: { href: "/pricing", label: "Unlock voice study" },
  },
  seoContent: {
    eyebrow: "Passive learning",
    title: "Studying while walking, driving, or resting",
    blocks: [
      {
        body: (
          <>
            Listening works when the script is structured like a teacher: context, main idea,
            misconceptions, and recap. Summify’s{" "}
            <InternalTextLink href="/audio-study">Audio Study Mode</InternalTextLink> follows that
            shape automatically from your document intelligence — plus{" "}
            <InternalTextLink href="/summarize-youtube-video">YouTube</InternalTextLink> and PDF
            sources.
          </>
        ),
      },
    ],
  },
  workflow: audioStudyWorkflow(),
  features: {
    title: "Listen-to-learn benefits",
    items: [
      { title: "Reduce screen time", description: "Give your eyes a break without stopping review." },
      { title: "Repeatable", description: "Replay hard sections with seek controls." },
      { title: "Multimodal memory", description: "Combine reading, quiz, and audio encoding." },
      { title: "Study companion", description: "One workspace for summarize, learn, practice, listen." },
    ],
  },
  useCases: {
    title: "Who listens to learn",
    cases: [
      { title: "Students", description: "Lecture PDFs and video notes on the go." },
      { title: "Researchers", description: "Paper skims before deep annotation." },
      { title: "Operators", description: "Report listen-backs before standups." },
    ],
  },
  faqs: AUDIO_STUDY_FAQS,
  relatedLinks: AUDIO_STUDY_RELATED,
  cta: {
    title: "Start learning by listening",
    description: "Summaries, quizzes, and audio study lessons in one workspace.",
    primaryLabel: "Open workspace",
  },
};

export const TEACHER_STYLE_AI: FormatLandingConfig = {
  path: "/teacher-style-ai-learning",
  breadcrumbLabel: "Teacher-Style AI Learning",
  hero: {
    badge: "Teacher voice",
    title: "Teacher-style AI learning from your documents",
    description:
      "Hear explanations that sound like a clear instructor — structured sections, reflection questions, and natural voice audio grounded in your Summify analysis.",
    primaryCta: { href: "/upload", label: "Generate a lesson" },
    secondaryCta: { href: "/audio-study", label: "How Audio Study works" },
  },
  seoContent: {
    eyebrow: "AI teacher voice",
    title: "More than text-to-speech",
    blocks: [
      {
        body: (
          <>
            Raw TTS on a summary paragraph feels flat. Summify builds a{" "}
            <strong>lesson script</strong> first — then synthesizes audio. That is teacher-style
            AI learning: pedagogical structure plus voice. Ideal for{" "}
            <InternalTextLink href="/for-students">students</InternalTextLink> and{" "}
            <InternalTextLink href="/for-researchers">researchers</InternalTextLink> reviewing
            complex PDFs.
          </>
        ),
      },
    ],
  },
  workflow: audioStudyWorkflow(),
  features: {
    title: "Lesson structure",
    items: [
      { title: "Quick context", description: "Orient the listener in seconds." },
      { title: "Key concepts", description: "Three to five ideas with plain language." },
      { title: "Why it matters", description: "Connect facts to stakes and use." },
      { title: "Reflection prompts", description: "Three questions to close the loop." },
    ],
  },
  useCases: {
    title: "Teacher-style use cases",
    cases: [
      { title: "Lecture notes", description: "Spoken lessons from uploaded slides or PDFs." },
      { title: "Research papers", description: "Hear argument structure before annotating." },
      { title: "Training decks", description: "Narrated recap of PPTX uploads." },
    ],
  },
  faqs: AUDIO_STUDY_FAQS,
  relatedLinks: AUDIO_STUDY_RELATED,
  cta: {
    title: "Try teacher-style audio today",
    description: "Pro feature · grounded in your analysis.",
    primaryLabel: "Open workspace",
    secondaryHref: "/pricing",
    secondaryLabel: "View pricing",
  },
};

export const AUDIO_STUDY_LANDINGS = [
  AUDIO_STUDY_HUB,
  PDF_TO_AUDIO_STUDY,
  AI_AUDIO_STUDY_GUIDE,
  LEARN_BY_LISTENING,
  TEACHER_STYLE_AI,
] as const;

export const AUDIO_STUDY_PATHS = AUDIO_STUDY_LANDINGS.map((c) => c.path);
