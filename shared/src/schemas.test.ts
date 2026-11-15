import { describe, expect, it } from "vitest";
import { answersSchema, eventInputSchema, leadInputSchema } from "./schemas";
import { answers } from "./testing";

const validLead = {
  planCode: "abc123",
  name: "Aarav Sharma",
  email: "aarav@example.com",
  phone: "+91 98765 43210",
  wantsEmail: true,
  wantsAdvisor: false,
  consent: true,
};

describe("answersSchema", () => {
  it("accepts valid answers", () => {
    expect(answersSchema.safeParse(answers({ interests: ["ai", "nlp"] })).success).toBe(true);
  });

  it("rejects more than three interests", () => {
    const four = answers({ interests: ["ai", "nlp", "ml", "devops"] });
    expect(answersSchema.safeParse(four).success).toBe(false);
  });

  it("rejects duplicate interests and unknown values", () => {
    expect(answersSchema.safeParse(answers({ interests: ["ai", "ai"] })).success).toBe(false);
    expect(answersSchema.safeParse({ ...answers(), stage: "wizard" }).success).toBe(false);
  });
});

describe("leadInputSchema", () => {
  it("accepts a valid lead, with or without a phone number", () => {
    expect(leadInputSchema.safeParse(validLead).success).toBe(true);
    expect(leadInputSchema.safeParse({ ...validLead, phone: "" }).success).toBe(true);
    expect(leadInputSchema.safeParse({ ...validLead, phone: undefined }).success).toBe(true);
  });

  it("requires consent", () => {
    expect(leadInputSchema.safeParse({ ...validLead, consent: false }).success).toBe(false);
  });

  it("requires a valid email", () => {
    expect(leadInputSchema.safeParse({ ...validLead, email: "not-an-email" }).success).toBe(false);
  });

  it("requires at least one way to be contacted", () => {
    const none = { ...validLead, wantsEmail: false, wantsAdvisor: false };
    expect(leadInputSchema.safeParse(none).success).toBe(false);
  });

  it("rejects a filled honeypot field (bots)", () => {
    expect(leadInputSchema.safeParse({ ...validLead, website: "http://spam" }).success).toBe(false);
  });

  it("rejects malformed phone numbers", () => {
    expect(leadInputSchema.safeParse({ ...validLead, phone: "call me maybe" }).success).toBe(false);
  });
});

describe("eventInputSchema", () => {
  const base = { sessionId: "sess_abcdef12", name: "path_started" };

  it("accepts known client events with small props", () => {
    expect(eventInputSchema.safeParse({ ...base, props: { step: 2, lab: "fullstack" } }).success).toBe(
      true,
    );
  });

  it("does not let clients forge server-truth events", () => {
    expect(eventInputSchema.safeParse({ ...base, name: "plan_generated" }).success).toBe(false);
    expect(eventInputSchema.safeParse({ ...base, name: "lead_submitted" }).success).toBe(false);
  });

  it("rejects bad session ids and oversized props", () => {
    expect(eventInputSchema.safeParse({ ...base, sessionId: "short" }).success).toBe(false);
    expect(eventInputSchema.safeParse({ ...base, sessionId: "has spaces here!" }).success).toBe(false);
    const many = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`k${i}`, i]));
    expect(eventInputSchema.safeParse({ ...base, props: many }).success).toBe(false);
  });
});
