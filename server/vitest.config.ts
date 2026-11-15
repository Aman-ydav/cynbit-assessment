import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    globalSetup: ["./test/global-setup.ts"],
    env: { NODE_ENV: "test" },
    testTimeout: 30_000,
    // First run may download the mongod binary used by the in-memory test database.
    hookTimeout: 600_000,
    // Test files share one in-memory MongoDB, so run them one at a time.
    fileParallelism: false,
  },
});
