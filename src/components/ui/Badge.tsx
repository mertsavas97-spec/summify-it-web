type BadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "accent" | "muted";
  className?: string;
};

const variantStyles = {
  default: "border-white/10 bg-white/5 text-zinc-300",
  accent:
    "border-violet-400/30 bg-violet-500/15 text-violet-200",
  muted: "border-white/5 bg-zinc-800/50 text-zinc-400",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
