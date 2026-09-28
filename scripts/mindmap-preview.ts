/**
 * Local QA helper — renders a deterministic mind map graph as an SVG preview.
 * Not part of the app; safe to delete after visual verification.
 * Run: npx tsx --tsconfig tsconfig.json scripts/mindmap-preview.ts
 */
import { writeFileSync } from "node:fs";
import { analysisToMindMap } from "../src/lib/mindmap/analysisToMindMap";
import { layoutMindMapGraph } from "../src/lib/mindmap/layoutMindMap";

const NODE_W = 230;
const NODE_H = 92;

const input = {
  title: "Spaced Repetition in Classroom Learning",
  summary:
    "The study compares retrieval practice against re-reading across six weeks. Students using spaced practice retained 40% more material. Blocked practice felt faster but faded within two weeks. Teachers reported higher preparation cost for spaced schedules. The authors recommend a mixed schedule for dense curricula. They also note that low-stakes testing reduces anxiety when introduced gradually. Finally they outline budget constraints for large classes and suggest peer-led repetition as a fallback.",
  keyInsights: Array.from({ length: 12 }, (_, i) => `Insight ${i + 1}: measurable retention gain`),
  risksOrWarnings: Array.from({ length: 6 }, (_, i) => `Risk ${i + 1}: adoption cost`),
  actionItems: Array.from({ length: 8 }, (_, i) => `Action ${i + 1}: pilot next term`),
  learnCards: Array.from({ length: 15 }, (_, i) => ({
    type: "concept",
    title: `Concept ${i + 1}`,
    content: `Explanation for concept ${i + 1}`,
  })),
  intelligenceMode: process.argv[2] ?? "the-student",
  sourceChars: 42_000,
};

const outcome = analysisToMindMap(input);
if (!outcome.ok) {
  console.error("graph failed:", outcome.reason);
  process.exit(1);
}

const positions = layoutMindMapGraph(outcome.graph);
const xs = [...positions.values()].map((p) => p.x);
const ys = [...positions.values()].map((p) => p.y);
const minX = Math.min(...xs) - 40;
const minY = Math.min(...ys) - 40;
const width = Math.max(...xs) + NODE_W + 40 - minX;
const height = Math.max(...ys) + NODE_H + 40 - minY;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const parts: string[] = [];
for (const edge of outcome.graph.edges) {
  const s = positions.get(edge.source);
  const t = positions.get(edge.target);
  if (!s || !t) continue;
  const sx = s.x - minX + NODE_W / 2;
  const sy = s.y - minY + NODE_H;
  const tx = t.x - minX + NODE_W / 2;
  const ty = t.y - minY;
  const mid = (sy + ty) / 2;
  parts.push(
    `<path d="M ${sx} ${sy} C ${sx} ${mid}, ${tx} ${mid}, ${tx} ${ty}" fill="none" stroke="rgba(139,92,246,0.4)" stroke-width="1.5"/>`,
  );
}

for (const node of outcome.graph.nodes) {
  const p = positions.get(node.id);
  if (!p) continue;
  const x = p.x - minX;
  const y = p.y - minY;
  const isRoot = node.metadata.type === "root";
  const w = isRoot ? 250 : NODE_W;
  parts.push(
    `<rect x="${x}" y="${y}" width="${w}" height="${NODE_H}" rx="12" fill="#11141d" stroke="${
      isRoot ? "#a78bfa" : "rgba(255,255,255,0.12)"
    }" stroke-width="${isRoot ? 2 : 1}"/>`,
  );
  parts.push(
    `<text x="${x + 12}" y="${y + 20}" fill="#c4b5fd" font-size="9" font-family="sans-serif" font-weight="700">${esc(
      node.metadata.type.toUpperCase(),
    )}</text>`,
  );
  parts.push(
    `<text x="${x + 12}" y="${y + 40}" fill="#fff" font-size="12" font-family="sans-serif" font-weight="600">${esc(
      node.title.slice(0, 30),
    )}</text>`,
  );
  if (node.insight) {
    parts.push(
      `<text x="${x + 12}" y="${y + 58}" fill="#71717a" font-size="9" font-family="sans-serif">${esc(
        node.insight.slice(0, 34),
      )}</text>`,
      `<text x="${x + 12}" y="${y + 72}" fill="#71717a" font-size="9" font-family="sans-serif">${esc(
        node.insight.slice(34, 68),
      )}</text>`,
    );
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#08090d"/>${parts.join(
  "",
)}</svg>`;

const label = String(input.intelligenceMode).replace(/[^a-z-]/g, "");
const out = `/tmp/mindmap-${label}.svg`;
writeFileSync(out, svg);

const profileCounts = outcome.graph.nodes.reduce<Record<string, number>>((acc, n) => {
  acc[n.metadata.type] = (acc[n.metadata.type] ?? 0) + 1;
  return acc;
}, {});
console.log(
  JSON.stringify(
    {
      profile: outcome.graph.profile,
      lens: input.intelligenceMode,
      nodes: outcome.graph.nodes.length,
      edges: outcome.graph.edges.length,
      byType: profileCounts,
      canvas: `${Math.round(width)}x${Math.round(height)}`,
      file: out,
    },
    null,
    2,
  ),
);
