import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analysisSessionResetForTrigger } from "../../src/lib/analysis-session-reset";

describe("P0 funnel: analysis session reset", () => {
  it("preserves results/ghost for analyze and retry triggers", () => {
    for (const trigger of [
      "url_analyze",
      "youtube_analyze",
      "text_analyze",
      "retry_analyze",
    ] as const) {
      assert.equal(
        analysisSessionResetForTrigger(trigger),
        "preserve_until_success",
        trigger,
      );
    }
  });

  it("hard-resets only on explicit abandon", () => {
    for (const trigger of ["replace_source", "file_selected", "text_edited"] as const) {
      assert.equal(
        analysisSessionResetForTrigger(trigger),
        "abandon_session",
        trigger,
      );
    }
  });
});
