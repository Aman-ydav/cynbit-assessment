import { createHash } from "node:crypto";
import { encodeAnswers, type Answers } from "@bitelevate/shared";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeConfig, relaxedLimits, useTestDb } from "../test/helpers";
import { createApp } from "./app";
import { EventModel } from "./models/Event";
import { LeadModel } from "./models/Lead";

useTestDb();
afterEach(() => vi.unstubAllGlobals());

const answers: Answers = {
  stage: "final_year",
  experience: "projects",
  goal: "portfolio",
  interests: ["nlp"],
  hoursPerDay: "gt2",
  examsSoon: false,
  skills: ["git", "python", "sql"],
};
const planCode = encodeAnswers(answers);

const lead = {
  planCode,
  name: "Aarav Sharma",
  email: "Aarav@Example.com",
  phone: "+91 98765 43210",
  wantsEmail: false,
  wantsAdvisor: true,
  consent: true,
  sessionId: "sess_abc12345",
};

const app = createApp(makeConfig(), { limits: relaxedLimits });
const emailConfig = makeConfig({
  RESEND_API_KEY: "re_test_key",
  EMAIL_FROM: "Path <plans@example.com>",
  PUBLIC_URL: "https://app.example.com",
});

describe("POST /api/leads", () => {
  it("saves a consented lead and returns a one-time delete token", async () => {
    const res = await request(app).post("/api/leads").send(lead);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ ok: true, emailSent: false });
    expect(res.body.deleteToken).toMatch(/^[A-Za-z0-9_-]{20,}$/);

    const saved = await LeadModel.findOne().lean();
    expect(saved).toMatchObject({
      name: "Aarav Sharma",
      email: "aarav@example.com", // normalised
      primaryLab: "ai_vector",
      wantsAdvisor: true,
      planCode,
    });
    expect(saved?.consentAt).toBeInstanceOf(Date);
  });

  it("stores only a hash of the delete token, never the token itself", async () => {
    const res = await request(app).post("/api/leads").send(lead);
    const saved = await LeadModel.findOne().lean();
    expect(saved?.deleteTokenHash).toBe(createHash("sha256").update(res.body.deleteToken).digest("hex"));
    expect(JSON.stringify(saved)).not.toContain(res.body.deleteToken);
  });

  it("records a server-truth lead_submitted event", async () => {
    await request(app).post("/api/leads").send(lead);
    const events = await EventModel.find({ name: "lead_submitted" }).lean();
    expect(events).toHaveLength(1);
    expect(events[0]?.props).toMatchObject({ lab: "ai_vector", advisor: true });
  });

  it("updates instead of duplicating when the same person resubmits", async () => {
    await request(app).post("/api/leads").send(lead);
    await request(app).post("/api/leads").send({ ...lead, name: "Aarav S.", email: "aarav@example.com" });
    expect(await LeadModel.countDocuments()).toBe(1);
    expect((await LeadModel.findOne().lean())?.name).toBe("Aarav S.");
  });

  it("accepts a lead without a phone number", async () => {
    const res = await request(app).post("/api/leads").send({ ...lead, phone: "" });
    expect(res.status).toBe(201);
    expect((await LeadModel.findOne().lean())?.phone).toBeUndefined();
  });

  it.each([
    ["no consent", { consent: false }],
    ["missing consent", { consent: undefined }],
    ["invalid email", { email: "nope" }],
    ["too-short name", { name: "A" }],
    ["no contact channel", { wantsEmail: false, wantsAdvisor: false }],
    ["bad phone", { phone: "call me" }],
  ])("rejects %s", async (_label, override) => {
    const res = await request(app).post("/api/leads").send({ ...lead, ...override });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation_error");
    expect(await LeadModel.countDocuments()).toBe(0);
  });

  it("rejects a plan code that is not valid", async () => {
    const res = await request(app).post("/api/leads").send({ ...lead, planCode: "forged" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_plan_code");
  });

  it("blocks NoSQL operator injection through any field", async () => {
    for (const body of [
      { ...lead, email: { $gt: "" } },
      { ...lead, planCode: { $ne: null } },
      { ...lead, name: { $regex: ".*" } },
      { ...lead, phone: { $exists: true } },
    ]) {
      const res = await request(app).post("/api/leads").send(body);
      expect(res.status).toBe(400);
    }
    expect(await LeadModel.countDocuments()).toBe(0);
  });

  it("quietly drops submissions that fill the honeypot field, without tipping off the bot", async () => {
    const res = await request(app).post("/api/leads").send({ ...lead, website: "http://spam.example" });
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(await LeadModel.countDocuments()).toBe(0);
  });
});

describe("emailing the plan", () => {
  it("sends through Resend and reports it only when the provider accepts", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await request(createApp(emailConfig, { limits: relaxedLimits }))
      .post("/api/leads")
      .send({ ...lead, wantsEmail: true });

    expect(res.body.emailSent).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test_key");
    const payload = JSON.parse(init.body as string);
    expect(payload.to).toEqual(["Aarav@Example.com"]);
    expect(payload.text).toContain(`https://app.example.com/plan/${planCode}`);
    expect((await LeadModel.findOne().lean())?.emailSentAt).toBeInstanceOf(Date);
  });

  it("does not claim success when the provider rejects the email, but keeps the lead", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 422 })));
    const res = await request(createApp(emailConfig, { limits: relaxedLimits })).post("/api/leads").send({ ...lead, wantsEmail: true });
    expect(res.status).toBe(201);
    expect(res.body.emailSent).toBe(false);
    expect(await LeadModel.countDocuments()).toBe(1);
  });

  it("survives the email provider being unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const res = await request(createApp(emailConfig, { limits: relaxedLimits })).post("/api/leads").send({ ...lead, wantsEmail: true });
    expect(res.status).toBe(201);
    expect(res.body.emailSent).toBe(false);
  });

  it("never calls the provider when email is not configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await request(app).post("/api/leads").send({ ...lead, wantsEmail: true });
    expect(res.body.emailSent).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("escapes HTML in the learner's name", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await request(createApp(emailConfig, { limits: relaxedLimits }))
      .post("/api/leads")
      .send({ ...lead, wantsEmail: true, name: "<script>alert(1)</script>" });
    const payload = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(payload.html).not.toContain("<script>");
    expect(payload.html).toContain("&lt;script&gt;");
  });
});

describe("DELETE /api/leads/:token (delete my data)", () => {
  it("erases the lead when given the token from sign-up", async () => {
    const { body } = await request(app).post("/api/leads").send(lead);
    const res = await request(app).delete(`/api/leads/${body.deleteToken}`);
    expect(res.status).toBe(204);
    expect(await LeadModel.countDocuments()).toBe(0);
  });

  it("does nothing for a wrong token and cannot be used to delete someone else's record", async () => {
    await request(app).post("/api/leads").send(lead);
    const wrong = await request(app).delete("/api/leads/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    expect(wrong.status).toBe(404);
    expect(await LeadModel.countDocuments()).toBe(1);
  });

  it("rejects malformed tokens", async () => {
    expect((await request(app).delete("/api/leads/short")).status).toBe(400);
  });
});
