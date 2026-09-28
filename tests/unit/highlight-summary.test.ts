import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { highlightSummaryParagraphs } from "../../src/lib/analysis/highlightSummary";

function highlighted(parts: Array<{ text: string; highlight: boolean }>): string[] {
  return parts.filter((part) => part.highlight).map((part) => part.text);
}

describe("summary highlights", () => {
  const summary = [
    "In 1949 Mao Zedong proclaimed the People's Republic of China after a long civil war.",
    "Later campaigns reshaped village life in several regions.",
    "By 1958 the Great Leap Forward had mobilized rural labor on a national scale.",
    "Industrial output rose 18% in the opening phase.",
    "The discussion also covers the broader historical context of the period.",
  ].join(" ");

  const insights = [
    "In 1949 Mao Zedong proclaimed the People's Republic of China.",
    "The Great Leap Forward began by 1958.",
    "Industrial output rose 18% in the opening phase.",
    "The discussion covers the broader historical context.",
  ];

  it("marks the sentences that carry names, years, and quantities", () => {
    const parts = highlightSummaryParagraphs([summary], insights)[0];
    const hits = highlighted(parts);
    assert.ok(hits.some((hit) => /Mao Zedong proclaimed the People's Republic/.test(hit)));
    assert.ok(hits.some((hit) => /Great Leap Forward had mobilized/.test(hit)));
    assert.ok(hits.some((hit) => /Industrial output rose 18%/.test(hit)));
    assert.equal(hits.includes("18%"), false);
    assert.equal(hits.includes("Mao Zedong"), false);
  });

  it("leaves filler sentences untouched", () => {
    const parts = highlightSummaryParagraphs([summary], insights)[0];
    const rebuilt = parts.map((part) => part.text).join("");
    const filler = "Later campaigns reshaped village life in several regions.";
    const fillerSlice = parts.filter((part) => filler.includes(part.text.trim()) || part.text.includes("reshaped village"));
    assert.equal(rebuilt.includes(filler), true);
    assert.equal(
      parts.some((part) => part.highlight && part.text.includes("reshaped village")),
      false,
    );
    assert.equal(fillerSlice.every((part) => !part.highlight || !part.text.includes("context")), true);
    assert.equal(
      parts.some((part) => part.highlight && /broader historical context/i.test(part.text)),
      false,
    );
  });

  it("does not invent highlights when insights do not support the wording", () => {
    const parts = highlightSummaryParagraphs(
      ["The chapter explains several important ideas about the main process."],
      ["The document explains the main ideas of the chapter."],
    )[0];
    assert.deepEqual(highlighted(parts), []);
  });

  it("highlights the dated sentence instead of the bare year", () => {
    const dense = [
      "In 1911 Sun Yat-sen founded the Republic.",
      "In 1921 the Communist Party formed in Shanghai.",
      "In 1934 the Long March began.",
      "In 1949 Mao Zedong proclaimed the People's Republic of China.",
      "In 1958 the Great Leap Forward started.",
      "In 1966 the Cultural Revolution opened.",
    ].join(" ");
    const denseInsights = [
      "1911 Sun Yat-sen Republic",
      "1921 Communist Party Shanghai",
      "1934 Long March",
      "1949 Mao Zedong People's Republic of China",
      "1958 Great Leap Forward",
      "1966 Cultural Revolution",
    ];
    const hits = highlighted(highlightSummaryParagraphs([dense], denseInsights)[0]);
    assert.ok(hits.length >= 2);
    assert.ok(hits.length <= 6);
    assert.ok(hits.every((hit) => hit.length > 24));
    assert.equal(hits.some((hit) => hit.trim() === "1911"), false);
  });
});
