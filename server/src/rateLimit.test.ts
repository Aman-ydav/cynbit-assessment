import { encodeAnswers, type Answers } from "@bitelevate/shared";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { makeConfig, useTestDb } from "../test/helpers";
import { createApp } from "./app";
import { LeadModel } from "./models/Lead";

useTestDb();

const answers: Answers = {
  stage: "year2",
  experience: "none",
  goal: "credit",
  interests: [],
  hoursPerDay: "h1_5_2",
  examsSoon: false,
  skills: [],
};

describe("rate limiting", () => {
  it("throttles plan generation per client and says how to proceed", async () => {
    const app = createApp(makeConfig(), { limits: { plans: { windowMs: 60_000, limit: 3 } } });
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      statuses.push((await request(app).post("/api/plans").send({ answers })).status);
    }
    expect(statuses).toEqual([201, 201, 201, 429, 429]);

    const blocked = await request(app).post("/api/plans").send({ answers });
    expect(blocked.body.error).toBe("rate_limited");
    expect(blocked.headers["ratelimit"] ?? blocked.headers["ratelimit-remaining"]).toBeDefined();
  });

  it("applies a much tighter limit to lead submissions", async () => {
    const app = createApp(makeConfig(), { limits: { leads: { windowMs: 60_000, limit: 2 } } });
    const body = {
      planCode: encodeAnswers(answers),
      name: "Aarav Sharma",
      email: "a@example.com",
      wantsEmail: false,
      wantsAdvisor: true,
      consent: true,
    };
    const statuses: number[] = [];
    for (let i = 0; i < 4; i++) {
      statuses.push((await request(app).post("/api/leads").send(body)).status);
    }
    expect(statuses).toEqual([201, 201, 429, 429]);
    expect(await LeadModel.countDocuments()).toBe(1);
  });

  it("keeps limits independent per endpoint", async () => {
    const app = createApp(makeConfig(), { limits: { plans: { windowMs: 60_000, limit: 1 } } });
    await request(app).post("/api/plans").send({ answers });
    expect((await request(app).post("/api/plans").send({ answers })).status).toBe(429);
    expect((await request(app).get("/api/health")).status).toBe(200);
  });
});
