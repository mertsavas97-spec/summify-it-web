import Image from "next/image";

type BlogScreenshotProps = {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  priority?: boolean;
};

/** Lazy-loaded editorial screenshot for blog articles. */
export function BlogScreenshot({
  src,
  alt,
  caption,
  width = 1200,
  height = 675,
  priority = false,
}: BlogScreenshotProps) {
  return (
    <figure className="my-8 overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-950/50 not-prose">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? undefined : "lazy"}
        priority={priority}
        className="h-auto w-full object-cover"
      />
      {caption ? (
        <figcaption className="border-t border-white/[0.06] px-4 py-2.5 text-xs text-zinc-500">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
