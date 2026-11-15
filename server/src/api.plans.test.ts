import { encodeAnswers, generatePlan, type Answers } from "@bitelevate/shared";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeConfig, relaxedLimits, useTestDb } from "../test/helpers";
import { createApp } from "./app";
import { EventModel } from "./models/Event";
import { PlanModel } from "./models/Plan";

useTestDb();
afterEach(() => vi.restoreAllMocks());

const app = createApp(makeConfig(), { limits: relaxedLimits });

const answers: Answers = {
  stage: "year3",
  experience: "basics",
  goal: "first_job",
  interests: ["backend_apis", "blockchain"],
  hoursPerDay: "h1_5_2",
  examsSoon: true,
  skills: ["git", "python"],
};

describe("POST /api/plans", () => {
  it("returns the engine's plan and a share code", async () => {
    const res = await request(app).post("/api/plans").send({ answers, sessionId: "sess_abc12345" });
    expect(res.status).toBe(201);
    expect(res.body.code).toBe(encodeAnswers(answers));
    expect(res.body.plan).toEqual(JSON.parse(JSON.stringify(generatePlan(answers))));
    expect(res.body.plan.primary.labId).toBe("python_backend");
  });

  it("records the plan (with the unmatched demand signal) and a server-truth event", async () => {
    await request(app).post("/api/plans").send({ answers, sessionId: "sess_abc12345" });

    const plans = await PlanModel.find().lean();
    expect(plans).toHaveLength(1);
    expect(plans[0]).toMatchObject({
      primaryLab: "python_backend",
      stage: "year3",
      unmatched: ["blockchain"],
      sessionId: "sess_abc12345",
    });

    const events = await EventModel.find().lean();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ name: "plan_generated", sessionId: "sess_abc12345" });
    expect(events[0]?.props).toMatchObject({ lab: "python_backend", unmatched: 1 });
  });

  it("works without a session id (e.g. another client integrating with the API)", async () => {
    const res = await request(app).post("/api/plans").send({ answers });
    expect(res.status).toBe(201);
    const [event] = await EventModel.find().lean();
    expect(event?.sessionId).toMatch(/^srv_/);
  });

  it("stores no personal data with the plan", async () => {
    await request(app).post("/api/plans").send({ answers, sessionId: "sess_abc12345" });
    const [plan] = await PlanModel.find().lean();
    expect(Object.keys(plan ?? {}).sort()).toEqual(
      [
        "_id",
        "code",
        "createdAt",
        "engineVersion",
        "examsSoon",
        "experience",
        "goal",
        "hoursPerDay",
        "interests",
        "matchPct",
        "primaryLab",
        "sessionId",
        "skills",
        "stage",
        "unmatched",
      ].sort(),
    );
  });

  it("still returns the plan if the database write fails", async () => {
    vi.spyOn(PlanModel, "create").mockRejectedValueOnce(new Error("db down") as never);
    const res = await request(app).post("/api/plans").send({ answers });
    expect(res.status).toBe(201);
    expect(res.body.plan.primary.labId).toBe("python_backend");
  });

  it.each([
    ["unknown stage", { ...answers, stage: "wizard" }],
    ["too many interests", { ...answers, interests: ["ai", "nlp", "ml", "devops"] }],
    ["duplicate interests", { ...answers, interests: ["ai", "ai"] }],
    ["non-boolean exams flag", { ...answers, examsSoon: "yes" }],
    ["missing field", { ...answers, goal: undefined }],
  ])("rejects %s with field-level errors", async (_label, body) => {
    const res = await request(app).post("/api/plans").send({ answers: body });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation_error");
    expect(res.body.issues.length).toBeGreaterThan(0);
    expect(await PlanModel.countDocuments()).toBe(0);
  });

  it("rejects an invalid session id", async () => {
    const res = await request(app).post("/api/plans").send({ answers, sessionId: "bad id!" });
    expect(res.status).toBe(400);
  });

  it("ignores unknown fields instead of storing them", async () => {
    const res = await request(app)
      .post("/api/plans")
      .send({ answers: { ...answers, isAdmin: true }, extra: "x" });
    expect(res.status).toBe(201);
    expect(res.body.plan.answers.isAdmin).toBeUndefined();
  });
});

describe("GET /api/plans/:code", () => {
  it("regenerates the same plan from the code, without touching the database", async () => {
    const code = encodeAnswers(answers);
    const res = await request(app).get(`/api/plans/${code}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(code);
    expect(res.body.plan.primary.labId).toBe("python_backend");
    expect(await PlanModel.countDocuments()).toBe(0);
  });

  it("returns 404 for an invalid or tampered code", async () => {
    for (const code of ["garbage", "A".repeat(300), encodeAnswers(answers).slice(0, -4)]) {
      const res = await request(app).get(`/api/plans/${code}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("invalid_plan_code");
    }
  });
});

describe("GET /api/config", () => {
  it("reports whether emailing a plan is available", async () => {
    expect((await request(app).get("/api/config")).body).toEqual({ emailEnabled: false });
    const withEmail = createApp(
      makeConfig({
        RESEND_API_KEY: "k",
        EMAIL_FROM: "Path <p@example.com>",
        PUBLIC_URL: "https://app.example.com",
      }),
      { limits: relaxedLimits },
    );
    expect((await request(withEmail).get("/api/config")).body).toEqual({ emailEnabled: true });
  });
});
