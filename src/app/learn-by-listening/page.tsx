import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = {
  ...createPageMetadata({
    title: "Learn by Listening — AI Audio Study & Podcast Learning",
    description:
      "Study while walking, learn during workouts, and convert passive time into progress. Summify doesn't give you a summary. It becomes your study companion with audio-first learning.",
    path: "/learn-by-listening",
  }),
  keywords: [
    "learn by listening",
    "audio learning",
    "AI podcast study",
    "teacher-style audio lessons",
    "audio study mode",
    "passive learning",
    "study while commuting",
  ],
};

const benefits = [
  {
    title: "Study while commuting",
    description:
      "Turn your commute into study time. Listen to AI-generated lessons instead of reading dense documents on the train or bus.",
  },
  {
    title: "Passive learning that sticks",
    description:
      "Convert passive study time into consistent reinforcement with audio sessions you can replay anywhere.",
  },
  {
    title: "Teacher-style explanations",
    description:
      "Not robotic text-to-speech. Summify generates natural, conversational explanations that feel like a tutor walking you through the material.",
  },
  {
    title: "Podcast-style discussions",
    description:
      "For longer sources, get two-speaker podcast discussions that explore your content from multiple angles — like an educational podcast about your material.",
  },
];

const workflow = [
  {
    step: "1",
    title: "Upload your source",
    description:
      "PDFs, YouTube videos, articles, presentations, or any text document. Summify extracts and analyzes the content.",
  },
  {
    step: "2",
    title: "Choose Audio Study Mode",
    description:
      "Select from 29 intelligence modes, then click 'Generate audio lesson'. Summify creates a structured script optimized for listening.",
  },
  {
    step: "3",
    title: "Listen and learn",
    description:
      "Play your personalized audio lesson with natural voice synthesis. Skip, rewind, and revisit key concepts anytime.",
  },
];

const useCases = [
  {
    title: "Students",
    description:
      "Convert lecture slides, textbook chapters, and research papers into audio lessons. Review before exams while walking or exercising.",
    link: "/for-students",
  },
  {
    title: "Researchers",
    description:
      "Listen to literature reviews and paper summaries. Absorb key findings from multiple papers during your daily walk.",
    link: "/for-researchers",
  },
  {
    title: "Professionals",
    description:
      "Turn reports, briefs, and meeting notes into audio summaries. Stay informed during your commute.",
    link: "/for-teams",
  },
  {
    title: "Content creators",
    description:
      "Listen to your research and source materials while brainstorming. Audio learning frees your eyes for creative work.",
    link: "/for-creators",
  },
];

export default function LearnByListeningPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <header className="text-center">
        <Badge variant="accent" className="mb-4">
          Audio Learning
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Learn by Listening
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
          Study while walking, learn during workouts, and turn passive study time into active
          retention. Summify doesn't give you a summary. It becomes your study companion.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button href="/upload" size="lg">
            Start listening
          </Button>
          <Button href="/audio-study" variant="secondary" size="lg">
            Learn more
          </Button>
        </div>
      </header>

      {/* Benefits */}
      <section className="mt-16">
        <h2 className="text-center text-xl font-semibold text-zinc-200">
          Why learn by listening?
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-5"
            >
              <h3 className="text-base font-semibold text-zinc-100">
                {benefit.title}
              </h3>
              <p className="mt-2 text-sm text-zinc-400">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section className="mt-16">
        <h2 className="text-center text-xl font-semibold text-zinc-200">
          How it works
        </h2>
        <div className="mt-8 space-y-4">
          {workflow.map((item) => (
            <div
              key={item.step}
              className="flex items-start gap-4 rounded-xl border border-white/[0.08] bg-zinc-900/40 p-5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-sm font-semibold text-violet-300">
                {item.step}
              </span>
              <div>
                <h3 className="text-base font-semibold text-zinc-100">{item.title}</h3>
                <p className="mt-1 text-sm text-zinc-400">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section className="mt-16">
        <h2 className="text-center text-xl font-semibold text-zinc-200">
          Who is audio learning for?
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {useCases.map((useCase) => (
            <Link
              key={useCase.title}
              href={useCase.link}
              className="group rounded-xl border border-white/[0.08] bg-zinc-900/40 p-5 transition-colors hover:border-violet-500/30"
            >
              <h3 className="text-base font-semibold text-zinc-100 group-hover:text-violet-200">
                {useCase.title}
              </h3>
              <p className="mt-2 text-sm text-zinc-400">{useCase.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-16 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/30 via-zinc-900/50 to-zinc-950/80 p-8 text-center">
        <h2 className="text-xl font-semibold text-white">
          Ready to learn by listening?
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Upload any document and generate your first audio lesson in seconds.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Button href="/upload" size="lg">
            Try Audio Study Mode
          </Button>
          <Button href="/" variant="secondary" size="lg">
            Back to home
          </Button>
        </div>
      </section>
    </div>
  );
}
