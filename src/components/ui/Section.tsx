type SectionProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "muted" | "bordered";
  containerClassName?: string;
};

const variantStyles = {
  default: "",
  muted: "border-y border-white/[0.04] bg-zinc-900/25",
  bordered: "border-t border-white/[0.04]",
};

export function Section({
  children,
  className = "",
  variant = "default",
  containerClassName = "",
}: SectionProps) {
  return (
    <section
      className={`px-4 py-14 sm:px-6 sm:py-16 lg:px-8 ${variantStyles[variant]} ${className}`}
    >
      <div className={`mx-auto max-w-6xl ${containerClassName}`}>{children}</div>
    </section>
  );
}
