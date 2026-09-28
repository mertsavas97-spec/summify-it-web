"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

type ExpandableTextProps = {
  text: string;
  className?: string;
  /** Lines shown before Show more. */
  lines?: 3 | 4 | 5;
};

const CLAMP: Record<NonNullable<ExpandableTextProps["lines"]>, string> = {
  3: "line-clamp-3",
  4: "line-clamp-4",
  5: "line-clamp-5",
};

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function ExpandableText({ text, className = "", lines = 4 }: ExpandableTextProps) {
  const visibleRef = useRef<HTMLParagraphElement>(null);
  const fullRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [text]);

  useIsoLayoutEffect(() => {
    if (expanded) return;
    const visible = visibleRef.current;
    const full = fullRef.current;
    if (!visible || !full) return;

    const measure = () => {
      const shown = visible.clientHeight;
      const needed = full.scrollHeight;
      if (shown < 1 || needed < 1) return;
      setOverflows(needed > shown + 1);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(visible);
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [text, expanded, lines, className]);

  return (
    <div className="relative w-full min-w-0">
      <p
        ref={visibleRef}
        className={`break-words [overflow-wrap:anywhere] ${expanded ? "" : CLAMP[lines]} ${className}`}
      >
        {text}
      </p>
      {expanded ? null : (
        <p
          ref={fullRef}
          aria-hidden
          className={`pointer-events-none invisible absolute inset-x-0 top-0 break-words [overflow-wrap:anywhere] ${className}`}
        >
          {text}
        </p>
      )}
      {overflows || expanded ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setExpanded((value) => !value);
          }}
          className="mt-1.5 text-xs font-medium text-violet-300 hover:text-violet-200"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}
