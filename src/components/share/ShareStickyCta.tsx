"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function ShareStickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 480);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="print-hide fixed inset-x-0 bottom-0 z-40 border-t border-violet-500/20 bg-[#0e1016]/95 px-4 py-3 backdrop-blur-xl sm:px-6"
      role="complementary"
      aria-label="Try Summify"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-center text-xs text-zinc-400 sm:text-left sm:text-sm">
          <span className="text-zinc-200">Turn your own PDF into summaries, mind maps, and review cards.</span>
        </p>
        <div className="flex shrink-0 flex-wrap justify-center gap-2">
          <Button href="/upload" size="sm">
            Upload your own source
          </Button>
          <Link
            href="/guides/pdf-to-flashcards-workflow"
            className="rounded-lg px-3 py-2 text-xs text-violet-400/90 hover:text-violet-300"
          >
            Practice what you learn
          </Link>
        </div>
      </div>
    </div>
  );
}
