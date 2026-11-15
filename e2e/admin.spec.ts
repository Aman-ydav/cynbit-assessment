import { expect, test } from "@playwright/test";
import { ADMIN_PASSWORD, SAMPLE_CODE } from "./helpers";

test.describe("admin dashboard", () => {
  test.beforeAll(async ({ request }) => {
    // Generate some real traffic through the public API so the dashboard has something to show.
    const answers = {
      stage: "year3", experience: "basics", goal: "first_job", interests: ["backend_apis", "iot"],
      hoursPerDay: "h1_5_2", examsSoon: false, skills: ["git", "python"],
    };
    const sessionId = "e2e_admin_session_1";
    await request.post("/api/events", { data: { sessionId, name: "path_started" } });
    await request.post("/api/plans", { data: { answers, sessionId } });
    await request.post("/api/events", { data: { sessionId, name: "plan_viewed" } });
    await request.post("/api/leads", {
      data: {
        planCode: SAMPLE_CODE, name: "=E2E Learner", email: "e2e.learner@example.com",
        wantsEmail: false, wantsAdvisor: true, consent: true, sessionId,
      },
    });
  });

  test("requires sign-in, rejects a wrong password and never exposes the session cookie to scripts", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /admin sign-in/i })).toBeVisible();

    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByRole("alert")).toContainText(/not correct/i);

    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByRole("heading", { name: /funnel & leads/i })).toBeVisible();

    expect(await page.evaluate(() => document.cookie)).not.toContain("admin_session");
  });

  test("shows funnel, demand signal and leads, and exports a spreadsheet-safe CSV", async ({ page }) => {
    await page.goto("/admin");
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByRole("heading", { name: "Conversion funnel" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /interests with no lab yet/i })).toBeVisible();
    await expect(page.getByText("Internet of Things").first()).toBeVisible(); // the unmatched interest we seeded
    await expect(page.getByRole("cell", { name: "=E2E Learner" })).toBeVisible();

    const csv = await page.request.get("/api/admin/leads.csv");
    expect(csv.status()).toBe(200);
    expect(csv.headers()["content-type"]).toContain("text/csv");
    const body = await csv.text();
    expect(body).toContain("created_at,name,email");
    expect(body).toContain("'=E2E Learner"); // a leading "=" is neutralised so spreadsheets don't run it
  });

  test("keeps the session across a reload and ends it on sign out", async ({ page }) => {
    await page.goto("/admin");
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByRole("heading", { name: /funnel & leads/i })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: /funnel & leads/i })).toBeVisible();

    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page.getByRole("heading", { name: /admin sign-in/i })).toBeVisible();
    expect((await page.request.get("/api/admin/stats")).status()).toBe(401);
  });

  test("the admin API is closed to anonymous requests and the page is noindex", async ({ request }) => {
    for (const path of ["/api/admin/stats", "/api/admin/leads", "/api/admin/leads.csv"]) {
      expect((await request.get(path)).status()).toBe(401);
    }
    const page = await request.get("/admin");
    expect(page.headers()["x-robots-tag"]).toMatch(/noindex/);
  });
});
