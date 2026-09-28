import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inventoryFromKeyInsights } from "../../src/lib/learn/insightCardFacts";

describe("insight card facts", () => {
  it("keeps dated event sentences and drops the document title and cut answers", () => {
    const inventory = inventoryFromKeyInsights(
      [
        "1934 – The Long March covers roughly 5,000 miles; despite massive losses, Mao emerges as the undisputed leader of the CCP.",
        "Mao Zedong: Rise, Revolution, and the Cultural Revolution – A Historical Overview",
        "Mao left home at fourteen and became radicalized by…",
      ],
      "Mao Zedong: Rise, Revolution, and the Cultural Revolution – A Historical Overview",
    );
    assert.equal(inventory.events.length, 1);
    assert.match(inventory.events[0]!.what_happened, /Long March/);
  });
});