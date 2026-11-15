import { expect, test } from "@playwright/test";
import { SAMPLE_CODE, completeWizard } from "./helpers";

test.describe("learner journey", () => {
  test("landing → wizard → personalised plan", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Find the lab that fits you");

    await page.getByRole("link", { name: /build my plan/i }).first().click();
    await expect(page).toHaveURL(/\/path$/);

    await completeWizard(page);

    // Full-stack web + Backend & APIs interests → the Full Stack lab, with reasons that say why
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Full Stack SaaS Lab");
    const why = page.getByRole("region", { name: /why this lab fits you/i });
    await expect(why).toBeVisible();
    await expect(why.getByText(/you're interested in full-stack web/i)).toBeVisible();
    await expect(why.getByText(/you're interested in backend & apis/i)).toBeVisible();

    // Readiness and a real 60-day timeline: five phases covering days 1–60
    await expect(page.getByRole("heading", { name: /are you ready to start/i })).toBeVisible();
    const timeline = page.getByRole("region", { name: /your 60-day timeline/i });
    for (const phase of ["Environment & Setup", "Bug Hunting & Tests", "Core Architecture", "Speed & Concurrency", "Docker & Capstone"]) {
      await expect(timeline.getByRole("heading", { name: new RegExp(phase) })).toBeVisible();
    }
    await expect(timeline).toContainText("Days 43–60");
  });

  test("enrol link is tagged so Cynbit can attribute enrolments", async ({ page }) => {
    await page.goto(`/plan/${SAMPLE_CODE}`);
    const enrol = page.getByRole("link", { name: /enrol on cynbit\.in/i });
    const href = await enrol.getAttribute("href");
    expect(href).toContain("cynbit.in/bitelevate");
    expect(href).toContain("utm_source=path_generator");
    expect(href).toContain("lab=");
    await expect(enrol).toHaveAttribute("target", "_blank");
    await expect(enrol).toHaveAttribute("rel", /noopener/);
  });

  test("a plan survives a reload and can be reopened from its link alone", async ({ page, context }) => {
    await completeWizard(page);
    const url = page.url();
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Full Stack SaaS Lab");

    const fresh = await context.newPage(); // no router state, no session — just the link
    await fresh.goto(url);
    await expect(fresh.getByRole("heading", { level: 1 })).toContainText("Full Stack SaaS Lab");
  });

  test("progress is kept if the page is refreshed mid-quiz", async ({ page }) => {
    await page.goto("/path");
    await page.locator("label").filter({ hasText: "2nd year" }).first().click();
    await page.locator("label").filter({ hasText: "Brand new" }).first().click();
    await page.getByRole("button", { name: /continue/i }).click();
    // (A visually hidden live region repeats the step for screen readers, so match the visible label.)
    await expect(page.getByText(/^Step 2 of 5 ·/)).toBeVisible();

    await page.reload();
    await expect(page.getByText(/^Step 2 of 5 ·/)).toBeVisible();
    await page.getByRole("button", { name: /back/i }).click();
    await expect(page.getByRole("radio", { name: /2nd year/i })).toBeChecked();
    await expect(page.getByRole("radio", { name: /brand new/i })).toBeChecked();
  });

  test("interests are capped at three and the cap is explained", async ({ page }) => {
    await page.goto("/path");
    await page.locator("label").filter({ hasText: "3rd year" }).first().click();
    await page.locator("label").filter({ hasText: "I know the basics" }).first().click();
    await page.getByRole("button", { name: /continue/i }).click();
    await page.locator("label").filter({ hasText: "Land my first tech job" }).first().click();
    await page.getByRole("button", { name: /continue/i }).click();

    for (const name of ["Full-stack web", "Backend & APIs", "UI/UX design"]) {
      await page.locator("label").filter({ hasText: name }).first().click();
    }
    await expect(page.getByText(/deselect one to pick another/i)).toBeVisible();
    await expect(page.getByRole("checkbox", { name: /machine learning/i })).toBeDisabled();
  });

  test("Continue stays disabled until the required questions are answered", async ({ page }) => {
    await page.goto("/path");
    await expect(page.getByRole("button", { name: /continue/i })).toBeDisabled();
    await page.locator("label").filter({ hasText: "1st year" }).first().click();
    await expect(page.getByRole("button", { name: /continue/i })).toBeDisabled();
    await page.locator("label").filter({ hasText: "Brand new" }).first().click();
    await expect(page.getByRole("button", { name: /continue/i })).toBeEnabled();
  });

  test("an interest no lab covers is called out honestly", async ({ page }) => {
    await page.goto("/path");
    await page.locator("label").filter({ hasText: "3rd year" }).first().click();
    await page.locator("label").filter({ hasText: "I know the basics" }).first().click();
    await page.getByRole("button", { name: /continue/i }).click();
    await page.locator("label").filter({ hasText: "Level up what I know" }).first().click();
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByText("No dedicated lab yet").first()).toBeVisible();
    await page.locator("label").filter({ hasText: "Blockchain" }).first().click();
    await page.getByRole("button", { name: /continue/i }).click();
    await page.locator("label").filter({ hasText: "1.5 – 2 hours" }).first().click();
    await page.locator("label").filter({ hasText: "No, I'm clear" }).first().click();
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByRole("button", { name: /show my plan/i }).click();

    await expect(page.getByRole("region", { name: /good to know/i })).toContainText(/no bitelevate lab covers blockchain/i);
  });
});

test.describe("advisor request", () => {
  test("validates, saves with consent and lets the learner delete their data", async ({ page }) => {
    await page.goto(`/plan/${SAMPLE_CODE}`);
    await page.getByRole("button", { name: /talk to an advisor/i }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Empty submit shows field-level errors, in text (not colour alone)
    await dialog.getByRole("button", { name: /send my request/i }).click();
    await expect(dialog.getByText("Enter your name")).toBeVisible();
    await expect(dialog.getByText("Enter a valid email address")).toBeVisible();
    await expect(dialog.getByText("Please agree so we can contact you")).toBeVisible();

    await dialog.getByLabel("Your name").fill("Aarav Sharma");
    await dialog.getByLabel("Email").fill("aarav.e2e@example.com");
    await dialog.getByLabel(/phone/i).fill("+91 98765 43210");
    await dialog.getByLabel(/i agree to be contacted/i).check();
    await dialog.getByRole("button", { name: /send my request/i }).click();

    await expect(dialog.getByRole("heading", { name: "Request saved" })).toBeVisible();
    // Email is not configured in this environment, so the UI must not claim an email was sent.
    await expect(dialog).not.toContainText(/we've emailed/i);

    const deletion = page.waitForResponse((r) => r.url().includes("/api/leads/") && r.request().method() === "DELETE");
    await dialog.getByRole("button", { name: /delete my details/i }).click();
    expect((await deletion).status()).toBe(204);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("hides the email option when the server cannot send email", async ({ page }) => {
    await page.goto(`/plan/${SAMPLE_CODE}`);
    await page.getByRole("button", { name: /talk to an advisor/i }).first().click();
    await expect(page.getByRole("dialog").getByLabel(/email me this plan/i)).toHaveCount(0);
  });
});
