"use client";

import { useState } from "react";

type YoutubeThumbnailProps = {
  videoId: string;
  title?: string;
  className?: string;
};

export function YoutubeThumbnail({ videoId, title, className = "" }: YoutubeThumbnailProps) {
  const [src, setSrc] = useState(
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
  );

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-white/[0.08] ${className}`}
      data-workspace-youtube-thumbnail
    >
      <div className="relative aspect-video w-full bg-zinc-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={title ? `Thumbnail for ${title}` : "YouTube video thumbnail"}
          className="h-full w-full object-cover"
          onError={() => {
            setSrc(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent"
          aria-hidden
        />
      </div>
    </div>
  );
}
