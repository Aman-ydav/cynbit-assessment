import { expect, type Page } from "@playwright/test";

export const ADMIN_PASSWORD = "e2e-admin-password";

/** A plan code for: 3rd year, basics, first job, Full-stack + Backend, 1.5–2 h/day, no exams. */
export const SAMPLE_CODE = "WzEsMiwxLDEsWzAsMiwxNF0sMSwwLFswLDEsM11d";

const choose = (page: Page, text: string | RegExp) =>
  page.locator("label").filter({ hasText: text }).first().click();

/** Completes the five wizard steps like a learner would. */
export async function completeWizard(page: Page) {
  await page.goto("/path");

  // 1 · about you
  await choose(page, "3rd year");
  await choose(page, "I know the basics");
  await page.getByRole("button", { name: /continue/i }).click();

  // 2 · goal
  await choose(page, "Land my first tech job");
  await page.getByRole("button", { name: /continue/i }).click();

  // 3 · interests
  await choose(page, "Full-stack web");
  await choose(page, "Backend & APIs");
  await page.getByRole("button", { name: /continue/i }).click();

  // 4 · time
  await choose(page, "1.5 – 2 hours");
  await choose(page, "No, I'm clear");
  await page.getByRole("button", { name: /continue/i }).click();

  // 5 · skills
  await choose(page, "Git & GitHub basics");
  await choose(page, "Python fundamentals");
  await page.getByRole("button", { name: /show my plan/i }).click();

  await expect(page).toHaveURL(/\/plan\/[A-Za-z0-9_-]+$/);
}
