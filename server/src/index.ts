import { createApp } from "./app";
import { loadConfig, loadDotenv } from "./config";
import { connectDb } from "./db";
import { log } from "./logger";

async function main() {
  loadDotenv();
  const config = loadConfig();

  if (config.usingDevAdminDefaults) {
    log.warn('Using development admin credentials (password "admin"). Set ADMIN_PASSWORD and ADMIN_JWT_SECRET.');
  }

  const db = await connectDb(config);
  const app = createApp(config);

  const server = app.listen(config.port, () => {
    log.info(`API listening on http://localhost:${config.port} (${config.env})`);
  });

  const shutdown = async (signal: string) => {
    log.info(`${signal} received — shutting down`);
    server.close(async () => {
      await db.stop();
      process.exit(0);
    });
    // Don't hang forever if connections refuse to close.
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error) => {
  log.error("Failed to start:", error instanceof Error ? error.message : error);
  process.exit(1);
});
