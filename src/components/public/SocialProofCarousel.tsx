"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    quote: "Summify cut my lecture prep time in half. The quiz cards actually help me remember what I read — not just highlight it.",
    author: "Sarah Chen",
    role: "Graduate Student, Stanford",
    avatar: "SC",
    initials: "SC",
  },
  {
    quote: "Finally an AI tool that doesn't hallucinate citations. Contract Summary mode is a game-changer for client work.",
    author: "Marcus Webb",
    role: "Freelance Consultant",
    avatar: "MW",
    initials: "MW",
  },
  {
    quote: "Our team uses Executive Brief for every board deck. Decisions happen faster because we're all on the same page.",
    author: "Priya Sharma",
    role: "VP Operations, Series B Startup",
    avatar: "PS",
    initials: "PS",
  },
  {
    quote: "The mind map feature alone is worth Pro. I can see connections in research papers I'd never spot linearly.",
    author: "Dr. James Liu",
    role: "Postdoc Researcher, MIT",
    avatar: "JL",
    initials: "JL",
  },
  {
    quote: "Creator mode turns my 2-hour interviews into newsletter hooks and Twitter threads in minutes. Insane ROI.",
    author: "Alex Rivera",
    role: "Content Strategist, TechCrunch",
    avatar: "AR",
    initials: "AR",
  },
  {
    quote: "Switched from NotebookLM because Summify's quiz actually tests comprehension. My students' retention jumped 30%.",
    author: "Prof. Elena Rossi",
    role: "Lecturer, UC Berkeley",
    avatar: "ER",
    initials: "ER",
  },
] as const;

export function SocialProofCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Auto-advance
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const goToPrev = () => setCurrentIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  const goToNext = () => setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext(); else goToPrev();
    }
    setTouchStart(null);
  };

  const visibleCount = 3;

  return (
    <section className="border-b border-white/[0.04] px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="social-proof-heading">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-10">
          <h2 id="social-proof-heading" className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Trusted by students, researchers & teams
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-sm leading-relaxed text-zinc-500">
            50,000+ people use Summify to turn passive reading into active learning.
          </p>
        </div>

        <div className="relative">
          {/* Track */}
          <div
            ref={trackRef}
            className="flex gap-4 overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            role="region"
            aria-label="User testimonials carousel"
          >
            {TESTIMONIALS.map((t) => (
              <article
                key={t.author}
                className="min-w-[calc(33.333%-1.33rem)] flex-shrink-0 sm:min-w-[calc(50%-0.5rem)] lg:min-w-[calc(33.333%-1.33rem)]"
                style={{ transform: `translateX(-${currentIndex * (100 / visibleCount)}%)` }}
              >
                <div className="rounded-2xl border border-white/[0.06] bg-zinc-950/45 p-6 shadow-[0_18px_60px_-44px_rgba(124,58,237,0.30)] h-full">
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
                </div>
              </article>
            ))}
          </div>

          {/* Navigation Arrows (desktop only) */}
          <div className="hidden lg:flex lg:absolute lg:top-1/2 lg:left-0 lg:right-0 lg:-translate-y-1/2 lg:px-8 lg:pointer-events-none lg:z-10">
            <button
              onClick={goToPrev}
              className="lg:pointer-events-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-zinc-950/80 text-zinc-300 hover:bg-violet-950/50 hover:border-violet-500/30 hover:text-white transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden />
            </button>
            <div className="flex-1" />
            <button
              onClick={goToNext}
              className="lg:pointer-events-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-zinc-950/80 text-zinc-300 hover:bg-violet-950/50 hover:border-violet-500/30 hover:text-white transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-6 w-6" aria-hidden />
            </button>
          </div>

          {/* Dots (mobile) */}
          <div className="flex lg:hidden justify-center gap-2 mt-6" role="tablist" aria-label="Testimonial navigation">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === currentIndex
                    ? "bg-violet-400 w-6"
                    : "bg-zinc-700 hover:bg-zinc-500"
                }`}
                role="tab"
                aria-selected={i === currentIndex}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Trusted by logos */}
        <div className="mt-16">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500 mb-6">
            Used at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 hover:opacity-100 transition-opacity">
            <span className="text-sm font-medium text-zinc-400">Stanford</span>
            <span className="text-sm font-medium text-zinc-400">MIT</span>
            <span className="text-sm font-medium text-zinc-400">UC Berkeley</span>
            <span className="text-sm font-medium text-zinc-400">TechCrunch</span>
            <span className="text-sm font-medium text-zinc-400">Y Combinator</span>
            <span className="text-sm font-medium text-zinc-400">McKinsey</span>
          </div>
        </div>
      </div>
    </section>
  );
}