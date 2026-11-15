import jwt from "jsonwebtoken";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { makeConfig, relaxedLimits, useTestDb } from "../test/helpers";
import { createApp } from "./app";
import { ADMIN_COOKIE } from "./middleware/adminAuth";
import { EventModel } from "./models/Event";
import { LeadModel } from "./models/Lead";
import { PlanModel } from "./models/Plan";
import { csvCell } from "./services/stats";

useTestDb();

const config = makeConfig();
const app = createApp(config, { limits: relaxedLimits });
const PASSWORD = "test-admin-password";

async function loggedInAgent() {
  const agent = request.agent(app);
  await agent.post("/api/admin/login").send({ password: PASSWORD }).expect(200);
  return agent;
}

const b64url = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");

describe("admin login", () => {
  it("sets an HttpOnly, SameSite=Lax session cookie scoped to the admin API", async () => {
    const res = await request(app).post("/api/admin/login").send({ password: PASSWORD });
    expect(res.status).toBe(200);
    const cookie = String(res.headers["set-cookie"]?.[0] ?? "");
    expect(cookie).toContain(`${ADMIN_COOKIE}=`);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toContain("Path=/api/admin");
  });

  it("rejects a wrong password without setting a cookie", async () => {
    const res = await request(app).post("/api/admin/login").send({ password: "nope" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("invalid_credentials");
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("rejects missing or malformed bodies", async () => {
    expect((await request(app).post("/api/admin/login").send({})).status).toBe(400);
    expect((await request(app).post("/api/admin/login").send({ password: { $ne: "" } })).status).toBe(400);
  });

  it("throttles repeated login attempts (brute-force defence)", async () => {
    const strict = createApp(config, {
      limits: { ...relaxedLimits, adminLogin: { windowMs: 60_000, limit: 3 } },
    });
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      statuses.push((await request(strict).post("/api/admin/login").send({ password: "guess" })).status);
    }
    expect(statuses).toEqual([401, 401, 401, 429, 429]);
  });
});

describe("admin session protection", () => {
  const protectedPaths = ["/api/admin/stats", "/api/admin/leads", "/api/admin/leads.csv"];

  it.each(protectedPaths)("blocks %s without a session", async (path) => {
    expect((await request(app).get(path)).status).toBe(401);
  });

  it("allows access with a valid session and ends it on logout", async () => {
    const agent = await loggedInAgent();
    expect((await agent.get("/api/admin/stats")).status).toBe(200);
    await agent.post("/api/admin/logout").expect(204);
    expect((await agent.get("/api/admin/stats")).status).toBe(401);
  });

  it("reports sign-in state through /me without erroring for anonymous visitors", async () => {
    const anonymous = await request(app).get("/api/admin/me");
    expect(anonymous.status).toBe(200);
    // Nothing about the configuration is revealed to someone who is not signed in.
    expect(anonymous.body).toEqual({ authenticated: false });

    const agent = await loggedInAgent();
    expect((await agent.get("/api/admin/me")).body).toMatchObject({ authenticated: true });
    await agent.post("/api/admin/logout").expect(204);
    expect((await agent.get("/api/admin/me")).body).toEqual({ authenticated: false });
  });

  it("does not treat a forged cookie as signed in via /me", async () => {
    const res = await request(app).get("/api/admin/me").set("Cookie", `${ADMIN_COOKIE}=forged`);
    expect(res.body).toEqual({ authenticated: false });
  });

  it.each([
    ["garbage", "not-a-token"],
    ["wrong secret", jwt.sign({ role: "admin" }, "some-other-secret-some-other-secret-1")],
    ["expired", jwt.sign({ role: "admin" }, config.adminJwtSecret, { expiresIn: -60 })],
    ["wrong role", jwt.sign({ role: "user" }, config.adminJwtSecret)],
    ["alg:none forgery", `${b64url({ alg: "none", typ: "JWT" })}.${b64url({ role: "admin" })}.`],
  ])("rejects a %s token", async (_label, token) => {
    const res = await request(app).get("/api/admin/stats").set("Cookie", `${ADMIN_COOKIE}=${token}`);
    expect(res.status).toBe(401);
  });

  it("does not accept the session token from other cookies or the query string", async () => {
    const token = jwt.sign({ role: "admin" }, config.adminJwtSecret); // a genuinely valid token
    expect((await request(app).get(`/api/admin/stats?token=${token}`)).status).toBe(401);
    expect((await request(app).get("/api/admin/stats").set("Cookie", `other=${token}`)).status).toBe(401);
  });
});

describe("GET /api/admin/stats", () => {
  async function seed() {
    const ev = (sessionId: string, name: string, props?: Record<string, number>) => ({ sessionId, name, props });
    await EventModel.insertMany([
      // Session A completes the whole journey
      ev("sess_A", "path_started"),
      ...[1, 2, 3, 4, 5].map((step) => ev("sess_A", "step_completed", { step })),
      ev("sess_A", "plan_generated"),
      ev("sess_A", "plan_viewed"),
      ev("sess_A", "enrol_clicked"),
      ev("sess_A", "lead_submitted"),
      // Session B drops out after step 2
      ev("sess_B", "path_started"),
      ev("sess_B", "step_completed", { step: 1 }),
      ev("sess_B", "step_completed", { step: 2 }),
      // Session C gets a plan and views it
      ev("sess_C", "path_started"),
      ev("sess_C", "plan_generated"),
      ev("sess_C", "plan_viewed"),
      // Session D only opened a shared/sample plan — never started the quiz
      ev("sess_D", "plan_viewed"),
      // Duplicate events in one session must not double-count
      ev("sess_A", "path_started"),
    ]);

    const plan = (over: object) => ({
      code: "c", engineVersion: 1, primaryLab: "fullstack", matchPct: 80, stage: "year3",
      experience: "basics", goal: "first_job", hoursPerDay: "h1_5_2", examsSoon: false, ...over,
    });
    await PlanModel.insertMany([
      plan({ primaryLab: "fullstack", matchPct: 90, unmatched: ["blockchain"] }),
      plan({ primaryLab: "fullstack", matchPct: 70, unmatched: ["blockchain", "iot"] }),
      plan({ primaryLab: "ai_vector", matchPct: 60 }),
      plan({ primaryLab: "uiux_design", matchPct: 50, createdAt: new Date(Date.now() - 40 * 86_400_000) }),
    ]);
  }

  it("computes a cohort funnel in which every percentage is at most 100%", async () => {
    await seed();
    const { body } = await (await loggedInAgent()).get("/api/admin/stats").expect(200);

    const byName = Object.fromEntries(body.funnel.map((row: { name: string }) => [row.name, row]));
    expect(byName.path_started).toMatchObject({ sessions: 3, pctOfStarted: 100 });
    expect(byName.plan_generated).toMatchObject({ sessions: 2, pctOfStarted: 67 });
    // sess_D viewed a plan but never started the quiz, so it is excluded from the cohort.
    expect(byName.plan_viewed).toMatchObject({ sessions: 2, pctOfStarted: 67 });
    expect(byName.enrol_clicked).toMatchObject({ sessions: 1, pctOfStarted: 33 });
    expect(byName.lead_submitted).toMatchObject({ sessions: 1, pctOfStarted: 33 });
    expect(body.totals.sessions).toBe(4);
  });

  it("shows where learners drop out of the quiz", async () => {
    await seed();
    const { body } = await (await loggedInAgent()).get("/api/admin/stats");
    expect(body.steps).toEqual([
      { step: 1, sessions: 2 },
      { step: 2, sessions: 2 },
      { step: 3, sessions: 1 },
      { step: 4, sessions: 1 },
      { step: 5, sessions: 1 },
    ]);
  });

  it("ranks labs and the interests no lab covers (the demand signal)", async () => {
    await seed();
    const { body } = await (await loggedInAgent()).get("/api/admin/stats");
    expect(body.labs[0]).toEqual({ lab: "fullstack", plans: 2, avgMatch: 80 });
    expect(body.totals.plans).toBe(4);
    expect(body.unmatched).toEqual([
      { interest: "blockchain", plans: 2 },
      { interest: "iot", plans: 1 },
    ]);
  });

  it("returns a zero-filled 14-day series that excludes older plans", async () => {
    await seed();
    const { body } = await (await loggedInAgent()).get("/api/admin/stats");
    expect(body.daily).toHaveLength(14);
    const total = body.daily.reduce((sum: number, day: { plans: number }) => sum + day.plans, 0);
    expect(total).toBe(3); // the 40-day-old plan is outside the window
    expect(body.daily.at(-1).plans).toBe(3);
  });

  it("returns empty but well-formed stats for a fresh database", async () => {
    const { body } = await (await loggedInAgent()).get("/api/admin/stats").expect(200);
    expect(body.totals).toEqual({ plans: 0, leads: 0, sessions: 0 });
    expect(body.funnel.every((row: { pctOfStarted: number }) => row.pctOfStarted === 0)).toBe(true);
    expect(body.labs).toEqual([]);
  });
});

describe("leads export", () => {
  const lead = (over: object) => ({
    planCode: "abc", primaryLab: "fullstack", name: "Aarav", email: "a@example.com",
    wantsEmail: true, wantsAdvisor: true, consentAt: new Date(), deleteTokenHash: "secrethash", ...over,
  });

  it("lists leads newest first without ever exposing the delete-token hash", async () => {
    await LeadModel.create(lead({ email: "old@example.com", createdAt: new Date(Date.now() - 1000) }));
    await LeadModel.create(lead({ email: "new@example.com" }));
    const { body } = await (await loggedInAgent()).get("/api/admin/leads").expect(200);
    expect(body.leads.map((l: { email: string }) => l.email)).toEqual(["new@example.com", "old@example.com"]);
    expect(JSON.stringify(body)).not.toContain("secrethash");
    expect(body.leads[0]).toHaveProperty("lab", "fullstack");
  });

  it("clamps the limit to a sane range", async () => {
    await LeadModel.create(lead({}));
    const agent = await loggedInAgent();
    expect((await agent.get("/api/admin/leads?limit=0")).body.leads).toHaveLength(1);
    expect((await agent.get("/api/admin/leads?limit=abc")).status).toBe(200);
  });

  it("exports CSV that is safe to open in a spreadsheet", async () => {
    await LeadModel.create(lead({ name: '=HYPERLINK("http://evil.example","click")', email: "csv@example.com" }));
    await LeadModel.create(lead({ name: "Smith, Jane\nline two", email: "csv2@example.com" }));
    const res = await (await loggedInAgent()).get("/api/admin/leads.csv").expect(200);

    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.headers["content-disposition"]).toContain("attachment");
    expect(res.text.split("\r\n")[0]).toBe(
      "created_at,name,email,phone,recommended_lab,wants_advisor,wants_email,email_sent",
    );
    // A leading "=" is neutralised with an apostrophe, and quotes are doubled.
    expect(res.text).toContain(`"'=HYPERLINK(""http://evil.example"",""click"")"`);
    expect(res.text).toContain('"Smith, Jane\nline two"');
    expect(res.text).not.toContain("secrethash");
  });
});

describe("csvCell", () => {
  it.each([
    ["plain", "plain"],
    ["a,b", '"a,b"'],
    ['say "hi"', '"say ""hi"""'],
    ["=SUM(A1)", "'=SUM(A1)"],
    ["+1", "'+1"],
    ["-1", "'-1"],
    ["@cmd", "'@cmd"],
    [null, ""],
    [undefined, ""],
    [true, "true"],
    [42, "42"],
  ])("escapes %j", (input, expected) => {
    expect(csvCell(input)).toBe(expected);
  });
});
