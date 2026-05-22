type LearningPhaseNavProps = {
  learnComplete: boolean;
  quizActive: boolean;
};

export function LearningPhaseNav({ learnComplete, quizActive }: LearningPhaseNavProps) {
  return (
    <nav
      className="mb-3 flex flex-wrap items-center gap-2 text-[10px] font-medium uppercase tracking-[0.12em]"
      aria-label="Learning path"
    >
      <PhasePill label="Summary" done />
      <span className="text-zinc-700" aria-hidden>
        →
      </span>
      <PhasePill label="Learn" done={learnComplete || quizActive} active={!learnComplete && !quizActive} />
      <span className="text-zinc-700" aria-hidden>
        →
      </span>
      <PhasePill
        label="Quiz"
        done={quizActive}
        active={learnComplete && !quizActive}
        locked={!learnComplete}
      />
    </nav>
  );
}

function PhasePill({
  label,
  done,
  active,
  locked,
}: {
  label: string;
  done?: boolean;
  active?: boolean;
  locked?: boolean;
}) {
  let className = "rounded-full border px-2.5 py-1 ";
  if (locked) className += "border-white/[0.06] text-zinc-600";
  else if (active) className += "border-violet-500/40 bg-violet-950/40 text-violet-200";
  else if (done) className += "border-emerald-500/25 bg-emerald-950/20 text-emerald-300/90";
  else className += "border-white/[0.08] text-zinc-500";

  return <span className={className}>{label}</span>;
}
