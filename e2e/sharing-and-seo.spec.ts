import { expect, test } from "@playwright/test";
import { SAMPLE_CODE } from "./helpers";

test.describe("shared links and link previews", () => {
  test("a crawler (no JavaScript) sees the lab in the preview tags", async ({ request }) => {
    const res = await request.get(`/plan/${SAMPLE_CODE}`, { headers: { "User-Agent": "WhatsApp/2.23" } });
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toMatch(/<meta property="og:title" content="My BitElevate plan: Full Stack SaaS Lab/);
    expect(html).toMatch(/<meta property="og:image" content="http:\/\/localhost:\d+\/og\.png"/);
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image"');
    expect(html).toContain('<meta name="robots" content="noindex, nofollow"');
  });

  test("the share image is a real PNG", async ({ request }) => {
    const res = await request.get("/og.png");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
    expect((await res.body()).subarray(0, 4).toString("hex")).toBe("89504e47");
  });

  test("an invalid plan link is a real 404 with a friendly page", async ({ page }) => {
    const response = await page.goto("/plan/not-a-real-code");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /this plan link isn.t valid/i })).toBeVisible();
    // (The header and footer also have a "Build my plan" link; this is the one in the page body.)
    await page.getByRole("main").getByRole("link", { name: /build my plan/i }).click();
    await expect(page).toHaveURL(/\/path$/);
  });

  test("unknown routes return 404 and show the not-found page", async ({ page }) => {
    const response = await page.goto("/no/such/page");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /wrong turn/i })).toBeVisible();
  });

  test("robots.txt blocks the admin area and sitemap lists only public pages", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /admin");
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/path");
    expect(sitemap).not.toContain("/plan/");
    expect(sitemap).not.toContain("/admin");
  });

  test("the app sets strict security headers and no CSP violations occur on load", async ({ page }) => {
    const violations: string[] = [];
    await page.addInitScript(() => {
      (window as unknown as { __v: string[] }).__v = [];
      document.addEventListener("securitypolicyviolation", (e) =>
        (window as unknown as { __v: string[] }).__v.push(`${e.violatedDirective}: ${e.blockedURI}`),
      );
    });
    const response = await page.goto("/");
    const headers = response?.headers() ?? {};
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["content-security-policy"]).not.toContain("unsafe-eval");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-powered-by"]).toBeUndefined();

    await page.goto(`/plan/${SAMPLE_CODE}`);
    await page.getByRole("button", { name: /talk to an advisor/i }).first().click(); // loads zod lazily
    await expect(page.getByRole("dialog")).toBeVisible();
    violations.push(...(await page.evaluate(() => (window as unknown as { __v: string[] }).__v)));
    expect(violations).toEqual([]);
  });
});
