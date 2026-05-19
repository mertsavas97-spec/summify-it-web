import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ShareSocialActions } from "@/components/share/ShareSocialActions";
import { TrustSignals } from "@/components/growth/TrustSignals";

type ShareConversionSectionProps = {
  shareId: string;
  title: string;
};

export function ShareConversionSection({ shareId, title }: ShareConversionSectionProps) {
  return (
    <footer className="print-hide mt-14 space-y-8">
      <div className="rounded-2xl border border-violet-500/15 bg-gradient-to-br from-violet-950/30 to-zinc-950/80 p-6 sm:p-8">
        <p className="text-center text-[11px] font-medium uppercase tracking-wider text-violet-400/80">
          Generated with Summify
        </p>
        <h2 className="mt-3 text-center text-lg font-semibold text-white sm:text-xl">
          Turn your own PDF into summaries, mind maps, and review cards
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm leading-relaxed text-zinc-500">
          Upload PDFs, decks, videos, and articles. Pick an intelligence mode, export insights,
          and share polished read-only views — without exposing private files.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button href="/upload" size="sm">
            Upload your own source
          </Button>
          <Button href="/pricing" size="sm" variant="secondary">
            View plans
          </Button>
        </div>
        <div className="mt-6 flex justify-center">
          <ShareSocialActions shareId={shareId} title={title} />
        </div>
      </div>

      <TrustSignals variant="compact" className="justify-center" />

      <p className="text-center text-[10px] text-zinc-600">
        <Link href="/" className="hover:text-violet-400/80">
          Summify
        </Link>
        {" · "}
        <Link href="/privacy" className="hover:text-violet-400/80">
          Privacy
        </Link>
        {" · "}
        <Link href="/faq" className="hover:text-violet-400/80">
          FAQ
        </Link>
      </p>
    </footer>
  );
}
