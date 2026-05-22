import { compactJsonLd } from "@/lib/schema/serialize";
import type { JsonLdObject } from "@/lib/schema/types";

type JsonLdProps = {
  data: JsonLdObject | JsonLdObject[];
};

function serializeGraph(graph: JsonLdObject): string {
  return JSON.stringify(compactJsonLd(graph));
}

/**
 * Renders Schema.org JSON-LD for crawlers.
 * Strips undefined values; each graph keeps its own @context.
 */
export function JsonLd({ data }: JsonLdProps) {
  const graphs = Array.isArray(data) ? data : [data];

  return (
    <>
      {graphs.map((graph, index) => (
        <script
          key={`${String(graph["@type"])}-${index}`}
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: serializeGraph(graph) }}
        />
      ))}
    </>
  );
}
