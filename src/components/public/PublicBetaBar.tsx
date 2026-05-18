import Link from "next/link";
import { PUBLIC_BETA_BANNER, PUBLIC_BETA_LABEL } from "@/lib/public-copy";

export function PublicBetaBar() {
  return (
    <div
      className="border-b border-violet-500/20 bg-violet-950/40 px-4 py-1.5 text-center text-xs leading-snug text-violet-200/90 sm:px-6"
      role="status"
    >
      <span className="font-medium text-violet-300">{PUBLIC_BETA_LABEL}</span>
      <span className="text-violet-200/75"> — {PUBLIC_BETA_BANNER}</span>
      <span className="mx-2 hidden text-violet-500/50 sm:inline">·</span>
      <Link
        href="/upload"
        className="font-medium text-violet-300 underline-offset-2 hover:underline"
      >
        Open workspace
      </Link>
    </div>
  );
}
