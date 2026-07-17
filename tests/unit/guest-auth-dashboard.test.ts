import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ANALYSIS_QUOTA_ERROR_CODES,
  isAnalysisQuotaError,
  isFreeDailyQuotaError,
  isGuestQuotaError,
} from "@/lib/analysis-quota";
import { sanitizeReturnTo } from "@/lib/auth/return-to";
import { resolveSourceLabel } from "@/server/analyses/resolveSourceLabel";

describe("analysis quota helpers", () => {
  it("detects guest quota by code and message", () => {
    assert.equal(
      isGuestQuotaError("Create a free account and get 5 analyses per day."),
      true,
    );
    assert.equal(
      isGuestQuotaError("ignored", ANALYSIS_QUOTA_ERROR_CODES.GUEST_LIMIT),
      true,
    );
    assert.equal(isGuestQuotaError("network error"), false);
  });

  it("detects free daily quota without stale 3-limit copy dependency", () => {
    assert.equal(isFreeDailyQuotaError("You've used today's 5 free analyses."), true);
    assert.equal(
      isFreeDailyQuotaError("x", ANALYSIS_QUOTA_ERROR_CODES.FREE_DAILY_LIMIT),
      true,
    );
    assert.equal(isAnalysisQuotaError("Create a free account and get 5 analyses per day."), true);
  });
});

describe("sanitizeReturnTo", () => {
  it("blocks open redirects", () => {
    assert.equal(sanitizeReturnTo("https://evil.example", "/account"), "/account");
    assert.equal(sanitizeReturnTo("//evil.example", "/account"), "/account");
    assert.equal(sanitizeReturnTo("/upload", "/account"), "/upload");
    assert.equal(sanitizeReturnTo("/upload?from=login", "/account"), "/upload?from=login");
  });
});

describe("resolveSourceLabel", () => {
  it("prefers file name and url title from source context", () => {
    assert.equal(
      resolveSourceLabel("file", { sourceKind: "file", fileName: "notes.pdf" }),
      "notes.pdf",
    );
    assert.equal(
      resolveSourceLabel("url", {
        sourceKind: "url",
        title: "IndieWire Feature",
        url: "https://example.com/a",
      }),
      "IndieWire Feature",
    );
    assert.equal(resolveSourceLabel("text", { sourceKind: "text" }), "Pasted text");
  });
});
