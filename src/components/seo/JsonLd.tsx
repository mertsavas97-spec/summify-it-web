import type { JsonLdObject } from "@/lib/schema";

type JsonLdProps = {
  data: JsonLdObject | JsonLdObject[];
};

/**
 * Renders Schema.org JSON-LD for crawlers. Pass one object or multiple graphs.
 */
export function JsonLd({ data }: JsonLdProps) {
  const graphs = Array.isArray(data) ? data : [data];

  return (
    <>
      {graphs.map((graph, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
        />
      ))}
    </>
  );
}
