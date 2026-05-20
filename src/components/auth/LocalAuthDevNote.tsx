type LocalAuthDevNoteProps = {
  nextPath: string;
  isLocalDev: boolean;
  envMismatch?: boolean;
};

export function LocalAuthDevNote({
  nextPath,
  isLocalDev,
  envMismatch = false,
}: LocalAuthDevNoteProps) {
  if (!isLocalDev) return null;

  const checkoutReturn = nextPath === "/pricing";

  return (
    <aside className="rounded-lg border border-amber-500/25 bg-amber-950/25 px-4 py-3 text-sm text-amber-100/90">
      <p className="font-medium text-amber-200">Local development</p>
      <p className="mt-1.5 text-xs leading-relaxed text-amber-100/80">
        For checkout testing on localhost, use <strong>email and password</strong> below.
        Magic links often fail locally; Google OAuth needs Supabase redirect URLs and{" "}
        <code className="text-amber-50">NEXT_PUBLIC_SITE_URL=http://localhost:3000</code> in{" "}
        <code className="text-amber-50">.env.local</code>.
      </p>
      {checkoutReturn ? (
        <p className="mt-2 text-xs text-amber-100/75">
          After sign-in you will return to <strong>/pricing</strong> and checkout can resume
          automatically.
        </p>
      ) : null}
      {envMismatch ? (
        <p className="mt-2 text-xs font-medium text-amber-200">
          Your <code className="text-amber-50">NEXT_PUBLIC_SITE_URL</code> points at production.
          Set it to <code className="text-amber-50">http://localhost:3000</code> and restart{" "}
          <code className="text-amber-50">npm run dev</code>.
        </p>
      ) : null}
    </aside>
  );
}
