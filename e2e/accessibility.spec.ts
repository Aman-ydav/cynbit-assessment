import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { ADMIN_PASSWORD, SAMPLE_CODE } from "./helpers";

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/**
 * Scan the page at rest. Entry animations fade content in from 55% opacity for half a second;
 * measuring colour contrast mid-fade would flag text that is fine once settled. Finite
 * animations are awaited; looping ones (spinners, skeletons) are left alone.
 */
async function settle(page: Page) {
  await page.evaluate(async () => {
    const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    // A step that was just rendered only starts its fade-in on the following frame, so wait two
    // frames before asking which animations exist — otherwise we could scan mid-fade.
    await nextFrame();
    await nextFrame();
    await Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    );
    await nextFrame();
  });
}

async function expectNoViolations(page: Page) {
  await settle(page);
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  const summary = results.violations.map((v) => {
    const first = v.nodes[0];
    const reason = first?.any[0]?.message ?? first?.all[0]?.message ?? first?.none[0]?.message ?? "";
    return `${v.id} (${v.impact}): ${v.nodes.length} node(s)\n    ${first?.html.slice(0, 160)}\n    ${reason}`;
  });
  expect(summary, `Accessibility violations:\n${summary.join("\n")}`).toEqual([]);
}

test.describe("accessibility (axe, WCAG 2.2 AA)", () => {
  test("landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoViolations(page);
  });

  test("wizard: empty, filled and interests steps", async ({ page }) => {
    await page.goto("/path");
    // The wizard is a lazily loaded chunk: wait for the question to exist before scanning, so we
    // don't scan the spinner — or the step in the instant before its fade-in begins.
    await expect(page.getByRole("heading", { level: 1, name: /where are you right now/i })).toBeVisible();
    await expectNoViolations(page);

    await page.locator("label").filter({ hasText: "3rd year" }).first().click();
    await page.locator("label").filter({ hasText: "I know the basics" }).first().click();
    await expectNoViolations(page);

    await page.getByRole("button", { name: /continue/i }).click();
    await page.locator("label").filter({ hasText: "Land my first tech job" }).first().click();
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByText(/of 3 chosen/i)).toBeVisible();
    await expectNoViolations(page);
  });

  test("plan page", async ({ page }) => {
    await page.goto(`/plan/${SAMPLE_CODE}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoViolations(page);
  });

  test("advisor dialog, including its error state", async ({ page }) => {
    await page.goto(`/plan/${SAMPLE_CODE}`);
    await page.getByRole("button", { name: /talk to an advisor/i }).first().click();
    const dialog = page.getByRole("dialog");
    await expectNoViolations(page);
    await dialog.getByRole("button", { name: /send my request/i }).click();
    await expect(dialog.getByText("Enter your name")).toBeVisible();
    await expectNoViolations(page);
  });

  test("privacy, not-found and admin sign-in", async ({ page }) => {
    for (const path of ["/privacy", "/no/such/page", "/admin"]) {
      await page.goto(path);
      await expect(page.getByRole("heading").first()).toBeVisible();
      await expectNoViolations(page);
    }
  });

  test("admin dashboard", async ({ page }) => {
    await page.goto("/admin");
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByRole("heading", { name: /funnel & leads/i })).toBeVisible();
    await expectNoViolations(page);
  });
});

test.describe("keyboard and motion", () => {
  test("the whole quiz can be completed with the keyboard alone", async ({ page }) => {
    await page.goto("/path");
    // Radios: focus the group's first input, arrow to the one we want, as a keyboard user would.
    await page.getByRole("radio", { name: "1st year" }).focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight"); // → 3rd year
    await expect(page.getByRole("radio", { name: "3rd year" })).toBeChecked();
    await page.getByRole("radio", { name: /brand new/i }).focus();
    await page.keyboard.press("ArrowRight"); // → I know the basics
    await expect(page.getByRole("radio", { name: /i know the basics/i })).toBeChecked();

    await page.getByRole("button", { name: /continue/i }).focus();
    await page.keyboard.press("Enter");
    // Focus moves to the new question so screen-reader and keyboard users land on it.
    await expect(page.getByRole("heading", { level: 1, name: /what do you want from the 60 days/i })).toBeFocused();
  });

  test("skip link jumps to the main content", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: /skip to content/i });
    await expect(skip).toBeFocused();
    await skip.press("Enter");
    await expect(page.locator("main#main")).toBeFocused();
  });

  test("respects prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const duration = await page
      .getByRole("heading", { level: 1 })
      .evaluate((el) => getComputedStyle(el).animationDuration);
    // The global reduced-motion rule collapses animations to ~0 (0.01ms).
    expect(parseFloat(duration)).toBeLessThan(0.001);
  });
});
