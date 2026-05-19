import Image from "next/image";
import Link from "next/link";

const ICON_SRC = "/brand-icon.png";

const sizeMap = {
  nav: { px: 32, wordmark: "text-lg" },
  footer: { px: 24, wordmark: "text-sm" },
  sm: { px: 20, wordmark: "text-sm" },
} as const;

type BrandMarkProps = {
  size?: keyof typeof sizeMap;
  showWordmark?: boolean;
  href?: string;
  className?: string;
  priority?: boolean;
};

export function BrandMark({
  size = "nav",
  showWordmark = true,
  href,
  className = "",
  priority = false,
}: BrandMarkProps) {
  const { px, wordmark } = sizeMap[size];
  const label = showWordmark ? "Summify" : "Summify home";

  const content = (
    <>
      <Image
        src={ICON_SRC}
        alt={showWordmark ? "" : "Summify"}
        width={px}
        height={px}
        sizes={`${px}px`}
        className="shrink-0 rounded-[22%] ring-1 ring-white/[0.06]"
        priority={priority}
        aria-hidden={showWordmark}
      />
      {showWordmark && (
        <span className={`truncate font-semibold tracking-tight text-white ${wordmark}`}>
          Summify
        </span>
      )}
    </>
  );

  const wrapClass = `inline-flex min-w-0 items-center gap-2.5 ${className}`;

  if (href) {
    return (
      <Link href={href} className={wrapClass} aria-label={label}>
        {content}
      </Link>
    );
  }

  return (
    <span className={wrapClass} aria-label={showWordmark ? undefined : label}>
      {content}
    </span>
  );
}
