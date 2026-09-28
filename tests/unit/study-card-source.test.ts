import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { studyCardCorpus } from "../../src/lib/learn/studyCardSource";

describe("study card source", () => {
  it("keeps the written summary and the analysis source together", () => {
    const corpus = studyCardCorpus(
      "Mao led the Long March and later reshaped the party.",
      "Transcript: the 1934 retreat covered about 5,000 miles.",
    );
    assert.match(corpus, /^SUMMARY\nMao led the Long March/);
    assert.match(corpus, /SOURCE\nTranscript: the 1934 retreat/);
  });

  it("uses the source alone when there is no summary", () => {
    assert.equal(studyCardCorpus("", "Only the transcript."), "Only the transcript.");
  });
});
