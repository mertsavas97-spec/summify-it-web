import Link from "next/link";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Badge } from "@/components/ui/Badge";

type AdminShellProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export function AdminShell({ title, description, children, actions }: AdminShellProps) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <DashboardSidebar savedCount={0} dailyCount={0} planLabel="Admin" />
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-950/30 via-zinc-900/50 to-zinc-950/80 p-5 sm:p-6">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="accent">Admin</Badge>
                <Link
                  href="/dashboard/admin"
                  className="text-[11px] text-zinc-500 transition-colors hover:text-violet-300"
                >
                  Metrics
                </Link>
                <span className="text-zinc-700">·</span>
                <Link
                  href="/dashboard/admin/blog"
                  className="text-[11px] text-zinc-500 transition-colors hover:text-violet-300"
                >
                  Blog CMS
                </Link>
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h1>
              {description ? (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">{description}</p>
              ) : null}
            </div>
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
