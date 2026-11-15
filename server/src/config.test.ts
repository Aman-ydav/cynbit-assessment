import { describe, expect, it } from "vitest";
import { loadConfig } from "./config";

const prodEnv = {
  NODE_ENV: "production",
  MONGODB_URI: "mongodb://localhost:27017/x",
  ADMIN_PASSWORD: "a-strong-password",
  ADMIN_JWT_SECRET: "x".repeat(32),
};

describe("loadConfig", () => {
  it("uses safe development defaults and flags them", () => {
    const config = loadConfig({ NODE_ENV: "development" });
    expect(config.port).toBe(4000);
    expect(config.isProd).toBe(false);
    expect(config.mongoUri).toBeUndefined();
    expect(config.usingDevAdminDefaults).toBe(true);
  });

  it("treats empty strings (as copied from .env.example) as unset", () => {
    const config = loadConfig({ NODE_ENV: "development", MONGODB_URI: "", PORT: "", ADMIN_PASSWORD: "" });
    expect(config.mongoUri).toBeUndefined();
    expect(config.port).toBe(4000);
    expect(config.usingDevAdminDefaults).toBe(true);
  });

  it("accepts a complete production configuration", () => {
    const config = loadConfig(prodEnv);
    expect(config.isProd).toBe(true);
    expect(config.usingDevAdminDefaults).toBe(false);
    expect(config.mongoUri).toBe(prodEnv.MONGODB_URI);
  });

  it.each(["MONGODB_URI", "ADMIN_PASSWORD", "ADMIN_JWT_SECRET"])(
    "refuses to start in production without %s",
    (key) => {
      const env: Record<string, string> = { ...prodEnv };
      delete env[key];
      expect(() => loadConfig(env)).toThrow(new RegExp(key));
    },
  );

  it("rejects weak admin credentials in production", () => {
    expect(() => loadConfig({ ...prodEnv, ADMIN_PASSWORD: "short" })).toThrow(/at least 8/);
    expect(() => loadConfig({ ...prodEnv, ADMIN_JWT_SECRET: "too-short" })).toThrow(/at least 32/);
  });

  it("rejects invalid values", () => {
    expect(() => loadConfig({ NODE_ENV: "development", PORT: "99999" })).toThrow(/Invalid environment/);
    expect(() => loadConfig({ NODE_ENV: "staging" })).toThrow(/Invalid environment/);
    expect(() => loadConfig({ NODE_ENV: "development", PUBLIC_URL: "not a url" })).toThrow();
  });

  it("only enables email when both the key and sender are set", () => {
    expect(loadConfig({ NODE_ENV: "development", RESEND_API_KEY: "k" }).email).toBeUndefined();
    const config = loadConfig({
      NODE_ENV: "development",
      RESEND_API_KEY: "k",
      EMAIL_FROM: "Path <plans@example.com>",
    });
    expect(config.email).toEqual({ apiKey: "k", from: "Path <plans@example.com>" });
  });

  it("strips a trailing slash from the public URL", () => {
    expect(loadConfig({ NODE_ENV: "development", PUBLIC_URL: "https://app.example.com/" }).publicUrl).toBe(
      "https://app.example.com",
    );
  });
});
