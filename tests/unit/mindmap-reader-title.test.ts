import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analysisToMindMap } from "../../src/lib/mindmap/analysisToMindMap";
import { splitReaderText } from "../../src/lib/mindmap/splitReaderText";
import { mindMapGraphToFlow } from "../../src/components/mindmap/mindMapFlowAdapter";

const LONG_QUESTION =
  "Why does the source argue that retrieval practice outperforms re-reading even when the study time is held constant across both groups?";

describe("splitReaderText", () => {
  it("shows a quiz card's whole question as the heading and the answer as the body", () => {
    const detail = `${LONG_QUESTION}\n---\nRetrieval practice because recalling strengthens memory traces.`;
    const { heading, body } = splitReaderText(detail, LONG_QUESTION);

    assert.equal(heading, LONG_QUESTION, "question renders complete, not cut");
    assert.equal(
      body,
      "Retrieval practice because recalling strengthens memory traces.",
      "answer follows without a raw --- rule",
    );
    assert.ok(!body.includes("---"), "no delimiter leaks into the reader");
  });

  it("keeps both halves when the card title differs from the stored question", () => {
    const question = "Which schedule did the authors test first?";
    const answer = "The blocked schedule across four weeks.";
    const { heading, body } = splitReaderText(`${question}\n---\n${answer}`, "Memory anchor");

    assert.equal(heading, "Memory anchor");
    assert.ok(body.includes(question), "question is still readable in full");
    assert.ok(body.includes(answer), "answer is still readable in full");
  });

  it("does not repeat a title that already opens the detail text", () => {
    const title = "Spaced repetition beats cramming for retention";
    const { heading, body } = splitReaderText(title, title);

    assert.equal(heading, "", "no duplicate heading");
    assert.equal(body, title, "full text still shown");
  });

  it("promotes an untruncated title when the detail is separate text", () => {
    const { heading, body } = splitReaderText("The summary body of the card.", LONG_QUESTION);

    assert.equal(heading, LONG_QUESTION, "full question, no ellipsis");
    assert.equal(body, "The summary body of the card.");
  });
});

describe("mind map learn nodes", () => {
  it("keeps the full question even when the canvas card title is clamped", () => {
    const outcome = analysisToMindMap({
      title: "Sample analysis",
      summary: "A short summary of the source material used for this analysis.",
      keyInsights: ["Insight one about the method"],
      risksOrWarnings: [],
      actionItems: [],
      learnCards: [{ type: "quiz", title: LONG_QUESTION, content: `${LONG_QUESTION}\n---\nAnswer.` }],
      intelligenceMode: "the-student",
    });
    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;

    const node = outcome.graph.nodes.find((n) => n.metadata.type === "learn");
    assert.ok(node, "learn node exists");
    if (!node) return;

    assert.ok(node.title.length <= 64, "canvas chip stays short");
    assert.equal(node.fullTitle, LONG_QUESTION, "reader gets the untouched question");

    const flow = mindMapGraphToFlow(outcome.graph).nodes.find((n) => n.data.nodeType === "learn");
    assert.equal(flow?.data.fullTitle, LONG_QUESTION, "full title reaches the reader");
  });
});
