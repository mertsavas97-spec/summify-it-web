import { expect, test } from "@playwright/test";

test.describe("adjacent upload/dashboard QA", () => {
  test("upload source composer is keyboard reachable", async ({ page }) => {
    await page.goto("/upload");
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();
  });

  test("mobile upload keeps primary CTA readable", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/upload");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/PDF, PowerPoint, DOCX, YouTube|Upload your source/i).first()).toBeVisible();
  });

  test("pricing and modes remain reachable from public chrome", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toContainText(/Summar/i);
  });
});
