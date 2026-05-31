import Link from "next/link";
import { Headphones, Lock, Play } from "lucide-react";
import { AUDIO_STUDY_UPGRADE_HREF } from "@/lib/audio-study/access";

type VoiceStudyPromoProps = {
  /** When true, links to workspace; when false, upgrade teaser. */
  unlocked?: boolean;
  className?: string;
};

/** 
 * Compelling Audio Spotlight card for marketing.
 * Shows a mock player with waveform and play button.
 */
export function VoiceStudyPromo({ unlocked = false, className = "" }: VoiceStudyPromoProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-violet-300/50 bg-white p-6 shadow-[0_0_45px_-18px_rgba(124,58,237,0.28)] transition-all duration-300 hover:border-violet-400/50 dark:border-violet-500/30 dark:bg-zinc-950/60 dark:shadow-[0_0_50px_-12px_rgba(124,58,237,0.3)] dark:hover:border-violet-400/40 ${className}`.trim()}
    >
      {/* Background Glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-600/15 blur-[80px]" aria-hidden />
      <div className="pointer-events-none absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-cyan-500/10 blur-[70px]" aria-hidden />

      <div className="relative flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-950/40 text-violet-300">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">AI Audio Lesson</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-500">Teacher Mode · Natural Voice</p>
            </div>
          </div>
          <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-300">
            {unlocked ? "Pro" : "New"}
          </span>
        </div>

        {/* Mock Player Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 ring-1 ring-slate-200/70 dark:border-white/[0.08] dark:bg-zinc-900/40 dark:ring-white/[0.04]">
          <div className="flex items-center gap-4">
            <div className="relative">
                <div className="absolute -inset-2 rounded-full bg-violet-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                <button 
                  className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-500 text-white shadow-[0_8px_20px_-4px_rgba(139,92,246,0.5)] transition-transform hover:scale-105 active:scale-95"
                  aria-label="Play sample audio"
                >
                    <Play className="h-6 w-6 fill-current" />
                </button>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-zinc-100">Psychology of Learning</p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-500">Teacher Mode • 8 min lesson</p>
              <div className="mt-3 flex items-center gap-3">
                {/* Waveform Mock */}
                <div className="flex h-8 flex-1 items-end gap-[2px]" aria-hidden>
                  {[40, 70, 45, 90, 65, 30, 50, 80, 55, 40, 60, 75, 50, 35, 60, 85, 45, 30, 50, 70, 40, 60, 55, 45, 75, 90, 40].map((h, i) => (
                    <div 
                      key={i} 
                      className={`w-full rounded-t-[1px] transition-colors ${i < 12 ? 'bg-violet-500 dark:bg-violet-400' : 'bg-slate-300 dark:bg-zinc-700/50'}`} 
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-medium text-slate-500 dark:text-zinc-500 tabular-nums">08:24</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!unlocked && <Lock className="h-3 w-3 text-zinc-500" />}
            <p className="text-xs text-slate-600 dark:text-zinc-400">
              {unlocked ? "Available in 29+ study modes" : "Unlock for your documents"}
            </p>
          </div>
          <Link
            href={unlocked ? "/upload" : AUDIO_STUDY_UPGRADE_HREF}
            className="group/link text-xs font-semibold text-violet-400 transition-colors hover:text-violet-300"
          >
            {unlocked ? "Generate from an analysis" : "Get Pro Access"}
            <span className="ml-1 inline-block transition-transform group-hover/link:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
