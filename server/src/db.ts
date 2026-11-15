import mongoose from "mongoose";
import type { Config } from "./config";
import { log } from "./logger";

export interface DbHandle {
  uri: string;
  /** True when a throwaway in-memory MongoDB was started (development only). */
  inMemory: boolean;
  stop: () => Promise<void>;
}

/**
 * Connect to MongoDB. In production a real `MONGODB_URI` (e.g. MongoDB Atlas) is required.
 * In development, if none is set, a throwaway in-memory MongoDB is started so the project
 * runs with zero setup. (The first run downloads a mongod binary, which is then cached.)
 */
export async function connectDb(config: Pick<Config, "mongoUri" | "isProd">): Promise<DbHandle> {
  mongoose.set("strictQuery", true);
  // Refuses query operators smuggled in through user input ({ "$gt": "" } style injection).
  mongoose.set("sanitizeFilter", true);

  let uri = config.mongoUri;
  let memory: { getUri: (db?: string) => string; stop: () => Promise<boolean> } | undefined;

  if (!uri) {
    if (config.isProd) throw new Error("MONGODB_URI is required in production");
    log.warn("MONGODB_URI is not set — starting a throwaway in-memory MongoDB (development only).");
    log.warn("First run downloads a mongod binary (~600 MB) and caches it; later runs are fast.");
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const server = await MongoMemoryServer.create();
    memory = server;
    uri = server.getUri("bitelevate");
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  log.info(`MongoDB connected${memory ? " (in-memory)" : ""}`);

  return {
    uri,
    inMemory: Boolean(memory),
    stop: async () => {
      await mongoose.disconnect();
      await memory?.stop();
    },
  };
}
