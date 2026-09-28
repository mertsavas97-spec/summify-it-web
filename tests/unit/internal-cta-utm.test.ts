import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { withCtaUtm } from "../../src/lib/analytics/utm";

describe("withCtaUtm", () => {
  it("tags internal paths with a consistent UTM triple", () => {
    assert.equal(
      withCtaUtm("/upload", "blog", "blog_end"),
      "/upload?utm_source=blog&utm_medium=internal_cta&utm_campaign=blog_end",
    );
  });

  it("uses & when the href already has a query string", () => {
    assert.equal(
      withCtaUtm("/pricing?ref=hero", "guide", "guide_strip"),
      "/pricing?ref=hero&utm_source=guide&utm_medium=internal_cta&utm_campaign=guide_strip",
    );
  });

  it("is idempotent for hrefs that already carry utm params", () => {
    const once = withCtaUtm("/upload", "blog", "blog_inline");
    assert.equal(withCtaUtm(once, "blog", "blog_inline"), once);
  });

  it("leaves external URLs untouched", () => {
    assert.equal(
      withCtaUtm("https://apps.apple.com/app/x", "guide", "guide_strip"),
      "https://apps.apple.com/app/x",
    );
  });
});
