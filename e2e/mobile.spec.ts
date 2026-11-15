import { expect, test } from "@playwright/test";
import { SAMPLE_CODE } from "./helpers";

/** Runs in the "mobile" project (Pixel 7 emulation, touch, small viewport). */
test.describe("on a phone", () => {
  for (const [name, path] of [
    ["landing", "/"],
    ["wizard", "/path"],
    ["plan", `/plan/${SAMPLE_CODE}`],
    ["privacy", "/privacy"],
  ] as const) {
    test(`${name} has no horizontal scrolling`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("the primary action stays one tap away: sticky CTA appears after the hero", async ({ page }) => {
    await page.goto("/");
    // (Matched by text, not role: while hidden the bar is aria-hidden, so it has no accessible links.)
    const sticky = page.locator("div.fixed.bottom-0").filter({ hasText: "Build my plan" });
    await expect(sticky).toHaveClass(/translate-y-full/); // hidden while the hero buttons are visible
    await page.evaluate(() => window.scrollTo(0, 1600));
    await expect(sticky).toHaveClass(/translate-y-0/);
    await sticky.getByRole("link", { name: /build my plan/i }).tap();
    await expect(page).toHaveURL(/\/path$/);
  });

  test("the price and Enrol action are visible on the first screen of a plan", async ({ page }) => {
    await page.goto(`/plan/${SAMPLE_CODE}`);
    // On cynbit.in the price is about eleven screens down; here it rides along at the bottom.
    const bar = page.locator("div.fixed").filter({ hasText: "₹1,499" });
    await expect(bar).toBeInViewport();
    await expect(bar.getByRole("link", { name: /enrol/i })).toBeVisible();
  });

  test("interactive targets are at least 44px tall in the wizard", async ({ page }) => {
    await page.goto("/path");
    await expect(page.locator("label:has(input[type=radio])").first()).toBeVisible();
    const heights = await page.locator("label:has(input[type=radio])").evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect().height),
    );
    expect(heights.length).toBeGreaterThan(5);
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
    const buttons = await page.getByRole("button", { name: /continue|cancel|back/i }).evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect().height),
    );
    for (const height of buttons) expect(height).toBeGreaterThanOrEqual(44);
  });

  test("the mobile menu opens and navigates", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /open menu/i }).tap();
    await page.getByRole("dialog").getByRole("link", { name: /the six labs/i }).tap();
    await expect(page.getByRole("heading", { name: /six real projects/i })).toBeInViewport();
  });
});
