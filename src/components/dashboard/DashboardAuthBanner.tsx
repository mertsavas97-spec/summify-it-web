import Link from "next/link";
import { getOptionalUser } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

export async function DashboardAuthBanner() {
  const user = await getOptionalUser();

  if (!user) {
    return (
      <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-950/20 px-4 py-3">
        <p className="text-sm text-zinc-300">
          <Link href="/login" className="font-medium text-violet-300 hover:text-violet-200">
            Sign in
          </Link>{" "}
          to access your future workspace history. Analysis stays free without an account.
        </p>
        <Button href="/login" variant="secondary" size="sm" className="mt-3">
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-white/[0.08] bg-zinc-900/50 px-4 py-3">
      <p className="text-sm text-zinc-400">
        Signed in as <span className="text-zinc-200">{user.email}</span>. Workspace history
        and saved analyses are{" "}
        <span className="text-zinc-300">coming soon</span> — use the{" "}
        <Link href="/upload" className="text-violet-400/80 hover:text-violet-300">
          live workspace
        </Link>{" "}
        for now.
      </p>
      <Button href="/account" variant="secondary" size="sm" className="mt-3">
        Account
      </Button>
    </div>
  );
}
