"use client";

import { Star, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    quote: "Summify cut my lecture prep time in half. The quiz cards actually help me remember what I read — not just highlight it.",
    author: "Sarah Chen",
    role: "Graduate Student, Stanford University",
    initials: "SC",
  },
  {
    quote: "Finally an AI tool that doesn't hallucinate citations. Contract Summary mode is a game-changer for client work.",
    author: "Marcus Webb",
    role: "Freelance Consultant, Former McKinsey",
    initials: "MW",
  },
  {
    quote: "Our team uses Executive Brief for every board deck. Decisions happen faster because we're all on the same page.",
    author: "Priya Sharma",
    role: "VP Operations, Series B Startup",
    initials: "PS",
  },
  {
    quote: "The mind map feature alone is worth Pro. I can see connections in research papers I'd never spot linearly.",
    author: "Dr. James Liu",
    role: "Postdoc Researcher, MIT",
    initials: "JL",
  },
  {
    quote: "Creator mode turns my 2-hour interviews into newsletter hooks and Twitter threads in minutes. Insane ROI.",
    author: "Alex Rivera",
    role: "Content Strategist, TechCrunch",
    initials: "AR",
  },
  {
    quote: "Switched from NotebookLM because Summify's quiz actually tests comprehension. My students' retention jumped 30%.",
    author: "Prof. Elena Rossi",
    role: "Lecturer, UC Berkeley",
    initials: "ER",
  },
  {
    quote: "The source-grounded quiz is unique — distractors are real facts from my doc, not generic templates. Actually teaches me.",
    author: "David Park",
    role: "Medical Student, Johns Hopkins",
    initials: "DP",
  },
  {
    quote: "Audio lessons let me study while commuting. Teacher-style narration is way better than robotic TTS.",
    author: "Lisa Nguyen",
    role: "Law Student, NYU",
    initials: "LN",
  },
  {
    quote: "Contract Summary caught an auto-renewal clause I missed. Saved us months of headache.",
    author: "Rachel Kim",
    role: "Founder, SaaS Startup (YC W24)",
    initials: "RK",
  },
] as const;

export function SocialProofCarousel() {
  return (
    <section className="border-b border-white/[0.04] px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="social-proof-heading">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-10">
          <h2 id="social-proof-heading" className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Trusted by students, researchers & teams
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-sm leading-relaxed text-zinc-500">
            Real people using Summify to turn passive reading into active learning.
          </p>
        </div>

        {/* Static Grid of Testimonials */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.author}
              className="rounded-2xl border border-white/[0.06] bg-zinc-950/45 p-6 shadow-[0_18px_60px_-44px_rgba(124,58,237,0.30)] h-full hover:border-violet-500/20 transition-colors"
            >
              <div className="flex gap-1 mb-4" aria-label="5 star rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className="h-5 w-5 fill-yellow-400 text-yellow-400" aria-hidden />
                ))}
              </div>
              <blockquote className="text-base leading-relaxed text-zinc-200 mb-5">
                <Quote className="h-5 w-5 text-violet-500/50 mb-2" aria-hidden />
                <p className="relative z-10">&ldquo;{t.quote}&rdquo;</p>
              </blockquote>
              <footer className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-white text-sm font-semibold"
                  aria-hidden
                >
                  {t.initials}
                </div>
                <div>
                  <cite className="not-italic text-sm font-medium text-zinc-100">{t.author}</cite>
                  <p className="text-[12px] text-zinc-500">{t.role}</p>
                </div>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}