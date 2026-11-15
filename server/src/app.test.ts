import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app";
import { makeConfig, useTestDb } from "../test/helpers";

useTestDb();

describe("server foundation", () => {
  const app = createApp(makeConfig());

  it("reports health, including the database connection", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok", db: "connected" });
  });

  it("returns JSON 404 for unknown API routes (never the app shell)", async () => {
    const get = await request(app).get("/api/nope");
    expect(get.status).toBe(404);
    expect(get.body).toEqual({ error: "not_found" });
    expect((await request(app).post("/api/nope").send({})).status).toBe(404);
  });

  it("rejects malformed JSON with a 400 instead of a stack trace", async () => {
    const res = await request(app)
      .post("/api/nope")
      .set("Content-Type", "application/json")
      .send("{not json");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "invalid_json" });
  });

  it("rejects oversized bodies with 413", async () => {
    const res = await request(app)
      .post("/api/nope")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ blob: "x".repeat(20_000) }));
    expect(res.status).toBe(413);
  });

  it("sets security headers and hides the framework", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["x-powered-by"]).toBeUndefined();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-robots-tag"]).toMatch(/noindex/);
    const csp = res.headers["content-security-policy"] ?? "";
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
  });
});

describe("serving the built client", () => {
  let dist: string;

  beforeAll(() => {
    dist = fs.mkdtempSync(path.join(os.tmpdir(), "client-dist-"));
    fs.mkdirSync(path.join(dist, "assets"));
    fs.writeFileSync(path.join(dist, "index.html"), "<!doctype html><title>shell</title>");
    fs.writeFileSync(path.join(dist, "assets", "app-abc123.js"), "console.log(1)");
  });

  afterAll(() => fs.rmSync(dist, { recursive: true, force: true }));

  const appWithClient = () => createApp(makeConfig({ CLIENT_DIST: dist }));

  it("falls back to index.html for client-side routes", async () => {
    const res = await request(appWithClient()).get("/plan/abc123");
    expect(res.status).toBe(200);
    expect(res.text).toContain("<title>shell</title>");
    expect(res.headers["cache-control"]).toBe("no-cache");
  });

  it("keeps the admin shell out of search indexes", async () => {
    const res = await request(appWithClient()).get("/admin");
    expect(res.headers["x-robots-tag"]).toMatch(/noindex/);
  });

  it("caches hashed assets for a year", async () => {
    const res = await request(appWithClient()).get("/assets/app-abc123.js");
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toContain("immutable");
  });

  it("returns a real 404 for a missing file rather than the app shell", async () => {
    const res = await request(appWithClient()).get("/assets/missing.js");
    expect(res.status).toBe(404);
  });

  it("does not let the SPA fallback swallow unknown API routes", async () => {
    const res = await request(appWithClient()).get("/api/unknown");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "not_found" });
  });

  it("serves the API alone when no client build exists", async () => {
    const res = await request(createApp(makeConfig())).get("/anything");
    expect(res.status).toBe(404);
  });
});
