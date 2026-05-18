import { Card } from "@/components/ui/Card";
import { providerHealthMock } from "@/data/providerRoutes";
import { Badge } from "@/components/ui/Badge";

const statusColors = {
  healthy: "text-emerald-400",
  degraded: "text-amber-400",
  offline: "text-red-400",
} as const;

export function UsageTrackingPlaceholder() {
  return (
    <Card compact>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Usage tracking</h2>
        <Badge variant="muted">Mock</Badge>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <dt className="text-zinc-600">Summaries</dt>
          <dd className="font-medium text-zinc-300">3 / 3</dd>
        </div>
        <div>
          <dt className="text-zinc-600">Learn cards</dt>
          <dd className="font-medium text-zinc-300">12 generated</dd>
        </div>
        <div>
          <dt className="text-zinc-600">Cache hits</dt>
          <dd className="font-medium text-zinc-300">2</dd>
        </div>
        <div>
          <dt className="text-zinc-600">Plan</dt>
          <dd className="font-medium text-zinc-300">Free</dd>
        </div>
      </dl>
      <p className="mt-3 text-[10px] text-zinc-600">
        TODO: Stripe metered billing + UsageEvent persistence
      </p>
    </Card>
  );
}

export function CachedAnalysesPlaceholder() {
  return (
    <Card compact>
      <h2 className="text-sm font-semibold text-white">Cached analyses</h2>
      <ul className="mt-3 space-y-2">
        {[
          { doc: "Q3_Strategy_Memo.pdf", persona: "Executive", hits: 4 },
          { doc: "Vendor_MSA.pdf", persona: "Legal", hits: 2 },
        ].map((row) => (
          <li
            key={row.doc}
            className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-zinc-950/40 px-2.5 py-2 text-[11px]"
          >
            <span className="truncate text-zinc-400">{row.doc}</span>
            <span className="shrink-0 text-zinc-600">
              {row.persona} · {row.hits} hits
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] text-zinc-600">
        TODO: Redis / KV cache keyed by document hash + persona + mode
      </p>
    </Card>
  );
}

export function ProviderHealthPlaceholder() {
  return (
    <Card compact>
      <h2 className="text-sm font-semibold text-white">Provider health</h2>
      <ul className="mt-3 space-y-2">
        {providerHealthMock.map((p) => (
          <li
            key={p.name}
            className="flex items-center justify-between text-[11px]"
          >
            <span className="font-mono text-zinc-400">{p.name}</span>
            <span className="flex items-center gap-2">
              <span className={statusColors[p.status]}>{p.status}</span>
              <span className="text-zinc-600">{p.latencyMs}ms</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] text-zinc-600">
        TODO: Fallback chain from providerRoutes.ts
      </p>
    </Card>
  );
}

export function LearnActivityPlaceholder() {
  return (
    <Card compact>
      <h2 className="text-sm font-semibold text-white">Learn activity</h2>
      <p className="mt-1 text-[10px] text-zinc-600">Deferred generation queue</p>
      <ul className="mt-3 space-y-2">
        {[
          { title: "EMEA expansion concepts", cards: 4, status: "ready" },
          { title: "Contract obligations quiz", cards: 6, status: "queued" },
        ].map((item) => (
          <li
            key={item.title}
            className="rounded-lg border border-white/[0.04] bg-zinc-950/40 px-2.5 py-2"
          >
            <p className="text-[11px] font-medium text-zinc-300">{item.title}</p>
            <p className="text-[10px] text-zinc-600">
              {item.cards} cards · {item.status}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] text-zinc-600">
        TODO: POST /api/learn worker + LearnCard storage
      </p>
    </Card>
  );
}
