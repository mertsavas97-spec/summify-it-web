import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function DashboardHeader() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Badge variant="muted" className="mb-1.5">
          Design preview
        </Badge>
        <h1 className="text-xl font-semibold text-white">Overview</h1>
        <p className="text-xs text-zinc-500">
          Sample data only · not connected to live analysis
        </p>
      </div>
      <Button href="/upload" size="sm">
        New summary
      </Button>
    </div>
  );
}
