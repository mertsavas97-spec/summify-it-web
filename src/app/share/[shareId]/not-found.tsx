import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/Button";

export default function ShareNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0b0f] px-4 text-center">
      <BrandMark href="/" size="nav" className="mb-8" />
      <h1 className="text-xl font-semibold text-white">This shared analysis isn’t available</h1>
      <p className="mt-2 max-w-md text-sm text-zinc-500">
        The link may be private, disabled, or expired. Only analyses with public sharing enabled
        can be viewed here — raw uploads are never shared.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Button href="/upload" size="sm">
          Create your own analysis
        </Button>
        <Button href="/" size="sm" variant="secondary">
          Home
        </Button>
      </div>
      <p className="mt-8 text-xs text-zinc-600">
        <Link href="/login" className="text-violet-400/80 hover:text-violet-300">
          Sign in
        </Link>{" "}
        to manage your saved analyses.
      </p>
    </div>
  );
}
