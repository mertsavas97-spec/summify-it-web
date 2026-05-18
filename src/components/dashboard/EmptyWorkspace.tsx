import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function EmptyWorkspace() {
  return (
    <Card compact className="border-dashed border-white/[0.06] bg-transparent">
      <p className="text-xs font-medium text-zinc-500">Quick action</p>
      <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">
        Upload a document to populate this workspace when backend connects.
      </p>
      <Button href="/upload" className="mt-3" size="sm" variant="secondary">
        Upload document
      </Button>
    </Card>
  );
}
