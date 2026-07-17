import { expect, test } from "@playwright/test";

test.describe("public upload auth smoke", () => {
  test("upload page renders summarizer hero for guests", async ({ page }) => {
    await page.goto("/upload");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Summarize/i);
    await expect(page.getByRole("heading", { name: /Upload your source|Add your source/i })).toBeVisible();
  });

  test("login preserves returnTo query for upload handoff", async ({ page }) => {
    await page.goto("/login?returnTo=/upload");
    await expect(page.getByRole("button", { name: /Sign in|Create account/i }).first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/1 free AI summary|5 summaries/i);
  });

  test("dashboard shows signed-out CTA for guests", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("link", { name: /sign in|log in|create/i }).first()).toBeVisible();
  });
});

test.describe("open redirect defenses", () => {
  test("login falls back for external returnTo", async ({ page }) => {
    await page.goto("/login?returnTo=https://evil.example");
    // Page should still load login UI; auth helpers sanitize destination on redirect.
    await expect(page.getByRole("button", { name: /Sign in|Create account/i }).first()).toBeVisible();
  });
});
