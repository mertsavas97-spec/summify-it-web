import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analysisToMindMap } from "../../src/lib/mindmap/analysisToMindMap";
import { layoutMindMapGraph } from "../../src/lib/mindmap/layoutMindMap";
import { resolveMindMapLens } from "../../src/lib/mindmap/resolveMindMapLens";
import { resolveMindMapNodeLabels } from "../../src/lib/mindmap/mindMapNodeLabels";
import { mindMapGraphToFlow } from "../../src/components/mindmap/mindMapFlowAdapter";

function makeInput(overrides: Partial<Parameters<typeof analysisToMindMap>[0]> = {}) {
  return {
    title: "Sample research paper",
    summary:
      "The paper argues that retrieval practice beats re-reading. It shows a 40% gain over six weeks. The authors then compare spaced and blocked schedules. Finally they outline classroom trade-offs and costs.",
    keyInsights: Array.from({ length: 12 }, (_, i) => `Insight ${i + 1} about the method`),
    risksOrWarnings: Array.from({ length: 6 }, (_, i) => `Risk ${i + 1} of adoption`),
    actionItems: Array.from({ length: 8 }, (_, i) => `Action ${i + 1} to try next`),
    learnCards: Array.from({ length: 15 }, (_, i) => ({
      type: "concept",
      title: `Concept ${i + 1}`,
      content: `Explanation for concept ${i + 1}`,
    })),
    ...overrides,
  };
}

describe("resolveMindMapLens", () => {
  it("gives the academic lens an educational map", () => {
    assert.equal(resolveMindMapLens("the-student"), "educational");
  });

  it("gives the executive lens a decisions-first map", () => {
    assert.equal(resolveMindMapLens("executive-brief"), "executive");
  });

  it("keeps the document shape for the neutral General lens", () => {
    assert.equal(resolveMindMapLens("general-summary", "meeting_notes"), "meeting");
    assert.equal(resolveMindMapLens("general-summary", "contract"), "contract");
  });

  it("falls back to document signals when no lens is known", () => {
    assert.equal(resolveMindMapLens(null, "meeting_notes"), "meeting");
    assert.equal(resolveMindMapLens(undefined, undefined, "youtube"), "narrative");
  });
});

describe("analysisToMindMap", () => {
  it("keeps every insight, risk, action and card the analysis returned", () => {
    const outcome = analysisToMindMap(makeInput());
    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;

    const insightNodes = outcome.graph.nodes.filter((n) => n.metadata.type === "insight");
    const riskNodes = outcome.graph.nodes.filter((n) => n.metadata.type === "risk");
    const actionNodes = outcome.graph.nodes.filter((n) => n.metadata.type === "action");
    const learnNodes = outcome.graph.nodes.filter((n) => n.metadata.type === "learn");

    assert.equal(insightNodes.length, 12, "all 12 insights belong on the map");
    assert.equal(riskNodes.length, 6, "all 6 risks belong on the map");
    assert.equal(actionNodes.length, 8, "all 8 actions belong on the map");
    assert.equal(learnNodes.length, 15, "all 15 cards belong on the map");
  });

  it("adds a source-flow branch for deep sources", () => {
    const deep = analysisToMindMap(makeInput({ sourceChars: 40_000 }));
    const shallow = analysisToMindMap(makeInput({ sourceChars: 4_000 }));
    assert.equal(deep.ok && shallow.ok, true);
    if (!deep.ok || !shallow.ok) return;

    const deepTimeline = deep.graph.nodes.filter((n) => n.metadata.type === "timeline");
    const shallowTimeline = shallow.graph.nodes.filter((n) => n.metadata.type === "timeline");
    assert.ok(deepTimeline.length > shallowTimeline.length, "deep source gains flow nodes");
    assert.equal(shallowTimeline.length, 0, "short source stays lean");
  });

  it("respects the lens on the graph profile", () => {
    const student = analysisToMindMap(makeInput({ intelligenceMode: "the-student" }));
    const executive = analysisToMindMap(makeInput({ intelligenceMode: "executive-brief" }));
    assert.equal(student.ok && executive.ok, true);
    if (!student.ok || !executive.ok) return;
    assert.equal(student.graph.profile, "educational");
    assert.equal(executive.graph.profile, "executive");
  });
});

describe("layoutMindMapGraph", () => {
  it("positions every node without stacking duplicates", () => {
    const outcome = analysisToMindMap(makeInput({ sourceChars: 40_000 }));
    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;

    const positions = layoutMindMapGraph(outcome.graph);
    assert.equal(positions.size, outcome.graph.nodes.length, "no node left unplaced");

    const seen = new Set<string>();
    for (const node of outcome.graph.nodes) {
      const pos = positions.get(node.id);
      assert.ok(pos, `position missing for ${node.id}`);
      if (!pos) continue;
      const key = `${Math.round(pos.x)}:${Math.round(pos.y)}`;
      assert.equal(seen.has(key), false, `nodes stacked at ${key}`);
      seen.add(key);
    }
  });
});

describe("lens-aware node labels", () => {
  it("speaks the lens' vocabulary instead of generic node types", () => {
    assert.equal(resolveMindMapNodeLabels("executive").action, "Decision");
    assert.equal(resolveMindMapNodeLabels("executive").insight, "Takeaway");
    assert.equal(resolveMindMapNodeLabels("educational").action, "Practice");
    assert.equal(resolveMindMapNodeLabels("educational").learn, "Memory anchor");
    assert.equal(resolveMindMapNodeLabels("contract").obligation, "Obligation");
  });

  it("falls back to the neutral set for unknown profiles", () => {
    const neutral = resolveMindMapNodeLabels(undefined);
    assert.equal(neutral.action, "Next step");
    assert.equal(neutral.insight, "Insight");
  });

  it("puts the label on every card the flow renders", () => {
    const outcome = analysisToMindMap(makeInput({ intelligenceMode: "the-student" }));
    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;

    const { nodes } = mindMapGraphToFlow(outcome.graph);
    assert.ok(nodes.length > 0);
    for (const node of nodes) {
      assert.ok(node.data.typeLabel, `missing typeLabel on ${node.id}`);
      assert.notEqual(node.data.typeLabel, "Node");
    }
    const actionCard = nodes.find((n) => n.data.nodeType === "action");
    assert.equal(actionCard?.data.typeLabel, "Practice");
  });
});

describe("tap-to-read full text", () => {
  it("keeps the untruncated source text on the node", () => {
    const longInsight = `Insight with a lot of detail: ${"segment ".repeat(40)}`.trim();
    const outcome = analysisToMindMap(
      makeInput({ keyInsights: [longInsight], intelligenceMode: "executive-brief" }),
    );
    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;

    const node = outcome.graph.nodes.find((n) => n.metadata.type === "insight");
    assert.ok(node, "insight node exists");
    if (!node) return;
    assert.equal(node.detail, longInsight, "detail is the full text");
    assert.ok(
      (node.insight ?? "").length < longInsight.length,
      "card preview stays clamped",
    );
  });

  it("carries detail through to the rendered card data", () => {
    const outcome = analysisToMindMap(makeInput());
    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;

    const { nodes } = mindMapGraphToFlow(outcome.graph);
    const rootCard = nodes.find((n) => n.data.nodeType === "root");
    assert.ok(rootCard?.data.detail, "root card exposes full summary");
    const withoutDetail = nodes.filter((n) => !n.data.detail);
    assert.equal(withoutDetail.length, 0, "every card can be tapped open");
  });
});
