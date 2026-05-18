import { savedDocuments } from "@/data/dashboard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function SavedDocuments() {
  return (
    <Card compact>
      <h2 className="text-sm font-semibold text-white">Saved documents</h2>
      <ul className="mt-3 space-y-2">
        {savedDocuments.map((doc) => (
          <li
            key={doc.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.04] bg-zinc-950/40 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-zinc-300">
                {doc.name}
              </p>
              <p className="text-[10px] text-zinc-600">{doc.uploadedAt}</p>
            </div>
            <Badge
              variant={doc.status === "summarized" ? "accent" : "muted"}
              className="shrink-0 text-[10px]"
            >
              {doc.status === "summarized" ? "Done" : "Pending"}
            </Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}
