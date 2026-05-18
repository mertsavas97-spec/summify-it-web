type CardProps = {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  compact?: boolean;
};

export function Card({
  children,
  className = "",
  hover = false,
  compact = false,
}: CardProps) {
  return (
    <div
      className={`rounded-xl border border-white/[0.08] bg-zinc-900/70 backdrop-blur-sm ${
        compact ? "p-4" : "p-5"
      } ${
        hover
          ? "transition-[border-color,background-color,box-shadow] duration-200 hover:border-white/12 hover:bg-zinc-900/90 hover:shadow-md hover:shadow-black/20"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
