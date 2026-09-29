"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { HomeHeroActions } from "@/components/public/HomeHeroActions";
import { UploadWorkspace } from "@/components/upload/UploadWorkspace";

type WorkspacePhase = "empty" | "ingesting" | "configure" | "analyzing" | "results";

function LiveWorkspaceGlow() {
  const shiftRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shift = shiftRef.current;
    if (!shift) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let offscreen = false;
    let hidden = document.hidden;

    const syncPause = () => {
      shift.dataset.paused = offscreen || hidden || reduce.matches ? "true" : "false";
    };

    const observer = new IntersectionObserver(([entry]) => {
      offscreen = !entry?.isIntersecting;
      syncPause();
    }, { threshold: 0.08 });
    observer.observe(shift);

    const onVisibility = () => {
      hidden = document.hidden;
      syncPause();
    };

    syncPause();
    reduce.addEventListener("change", syncPause);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      observer.disconnect();
      reduce.removeEventListener("change", syncPause);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 sm:-inset-10" aria-hidden>
      <div ref={shiftRef} className="home-workspace-glow-shift absolute inset-0" data-paused="false">
        <div className="home-workspace-glow-blob absolute left-1/2 top-6 h-40 w-[min(100%,460px)] rounded-full bg-violet-500/35 blur-[56px] sm:h-64 sm:blur-[80px]" />
        <div className="home-workspace-glow-blob home-workspace-glow-blob--alt absolute left-1/2 top-20 h-32 w-[min(100%,400px)] rounded-full bg-cyan-400/20 blur-[56px] sm:top-28 sm:h-52 sm:blur-[80px]" />
      </div>
    </div>
  );
}

export function HomeHero() {
  const [phase, setPhase] = useState<WorkspacePhase>("empty");
  const expanded = phase === "configure" || phase === "analyzing" || phase === "results";

  return (
    <section
      className="relative overflow-x-clip border-b border-white/[0.04] px-4 pb-8 pt-12 sm:px-6 sm:pb-10 sm:pt-16 lg:px-8"
      aria-labelledby="public-hero-heading"
    >
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/2 top-0 h-[360px] w-[min(100%,680px)] -translate-x-1/2 rounded-full bg-violet-600/14 blur-[110px]" />
      </div>
      <div className="mx-auto max-w-6xl">
        <div
          className={
            expanded
              ? "grid gap-8"
              : "grid items-center gap-6 sm:gap-10 lg:grid-cols-[0.9fr_1.2fr] lg:gap-10"
          }
        >
          <div className="min-w-0">
            <Badge variant="accent" className="mb-4">
              Free AI summarizer
            </Badge>
            <h1
              id="public-hero-heading"
              className={
                expanded
                  ? "max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl"
                  : "max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl"
              }
            >
              Free AI summarizer for{" "}
              <span className="bg-gradient-to-r from-violet-300 via-cyan-200 to-sky-300 bg-clip-text text-transparent">
                PDFs, decks & videos
              </span>
              .
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-400">
              Upload a PDF, YouTube link, or article — get a structured AI summary first.
              Then study cards, quiz, mind map, and optional audio or podcast from the same upload.
            </p>
            {!expanded ? <HomeHeroActions /> : null}
          </div>
          <div className="relative min-w-0 touch-manipulation">
            {!expanded ? <LiveWorkspaceGlow /> : null}
            <div
              className={
                expanded
                  ? "min-w-0"
                  : "relative z-[1] rounded-[1.4rem] border border-violet-300/30 bg-zinc-950/50 p-2 shadow-[0_30px_90px_-36px_rgba(124,58,237,0.85)] ring-1 ring-cyan-300/15 sm:p-3"
              }
            >
              {!expanded ? (
                <div className="mb-2 flex items-center gap-2 px-1.5 pb-2 pt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                  <span className="text-[11px] font-semibold tracking-wide text-zinc-200">
                    Live workspace
                  </span>
                  <span className="ml-auto text-[10px] font-medium text-violet-200/90">
                    Click to analyze
                  </span>
                </div>
              ) : null}
              <UploadWorkspace surface="home" onPhaseChange={setPhase} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
