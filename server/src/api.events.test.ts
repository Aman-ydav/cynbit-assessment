import request from "supertest";
import { describe, expect, it } from "vitest";
import { makeConfig, relaxedLimits, useTestDb } from "../test/helpers";
import { createApp } from "./app";
import { EventModel } from "./models/Event";

useTestDb();

const app = createApp(makeConfig(), { limits: relaxedLimits });
const base = { sessionId: "sess_abc12345", name: "step_completed", props: { step: 2 } };

describe("POST /api/events", () => {
  it("stores a valid anonymous event", async () => {
    const res = await request(app).post("/api/events").send(base);
    expect(res.status).toBe(204);
    const [event] = await EventModel.find().lean();
    expect(event).toMatchObject({ name: "step_completed", sessionId: "sess_abc12345" });
    expect(event?.props).toEqual({ step: 2 });
  });

  it("does not let the browser forge server-truth events", async () => {
    for (const name of ["plan_generated", "lead_submitted"]) {
      expect((await request(app).post("/api/events").send({ ...base, name })).status).toBe(400);
    }
    expect(await EventModel.countDocuments()).toBe(0);
  });

  it.each([
    ["unknown event", { name: "drop_tables" }],
    ["short session id", { sessionId: "abc" }],
    ["session id with unsafe characters", { sessionId: "../../etc/passwd" }],
    ["object-valued prop", { props: { step: { $gt: 0 } } }],
    ["too many props", { props: Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`k${i}`, i])) }],
    ["very long prop value", { props: { note: "x".repeat(200) } }],
  ])("rejects %s", async (_label, override) => {
    const res = await request(app).post("/api/events").send({ ...base, ...override });
    expect(res.status).toBe(400);
    expect(await EventModel.countDocuments()).toBe(0);
  });
});
