import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, inject } from "vitest";
import { loadConfig, type Config } from "../src/config";

/** A test configuration with safe defaults; override only what a test cares about. */
export function makeConfig(overrides: Record<string, string> = {}): Config {
  return loadConfig({
    NODE_ENV: "test",
    ADMIN_PASSWORD: "test-admin-password",
    ADMIN_JWT_SECRET: "test-secret-test-secret-test-secret-123",
    CLIENT_DIST: "/definitely/not/a/real/dir",
    ...overrides,
  });
}

/**
 * Effectively unlimited rate limits, so suites that make many requests from one IP don't trip
 * the limiter. Rate limiting itself is covered by its own dedicated test file.
 */
const BIG = { windowMs: 60_000, limit: 100_000 };
export const relaxedLimits = { plans: BIG, leads: BIG, events: BIG, adminLogin: BIG, admin: BIG };

/** Connects to the shared in-memory MongoDB and empties every collection before each test. */
export function useTestDb() {
  beforeAll(async () => {
    mongoose.set("sanitizeFilter", true);
    await mongoose.connect(inject("mongoUri"));
    // Make sure unique/TTL indexes exist before tests rely on them.
    await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
  });

  beforeEach(async () => {
    await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });
}
