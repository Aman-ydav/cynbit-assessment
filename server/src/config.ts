import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const DEV_ADMIN_PASSWORD = "admin";
const DEV_JWT_SECRET = "dev-only-secret-change-me-dev-only-secret";

export interface Config {
  env: "development" | "test" | "production";
  isProd: boolean;
  port: number;
  /** Undefined in dev/test → an in-memory MongoDB is started instead. */
  mongoUri?: string;
  adminPassword: string;
  adminJwtSecret: string;
  /** Set only when the client is hosted on a different origin than the API. */
  clientOrigin?: string;
  /** Public base URL of the deployed app, used for absolute links in emails and meta tags. */
  publicUrl?: string;
  /** Number of reverse-proxy hops to trust when reading the client IP. */
  trustProxy: number;
  clientDist: string;
  email?: { apiKey: string; from: string };
  /** True when the dev defaults for admin credentials are in use. */
  usingDevAdminDefaults: boolean;
}

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(65535).default(4000)),
  MONGODB_URI: z.preprocess(emptyToUndefined, z.string().optional()),
  ADMIN_PASSWORD: z.preprocess(emptyToUndefined, z.string().optional()),
  ADMIN_JWT_SECRET: z.preprocess(emptyToUndefined, z.string().optional()),
  CLIENT_ORIGIN: z.preprocess(emptyToUndefined, z.string().url().optional()),
  PUBLIC_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  TRUST_PROXY: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).max(5).default(1)),
  CLIENT_DIST: z.preprocess(emptyToUndefined, z.string().optional()),
  RESEND_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  EMAIL_FROM: z.preprocess(emptyToUndefined, z.string().optional()),
});

/** Load `.env` from the working directory or the repo root, if present (Node's built-in loader). */
export function loadDotenv(cwd = process.cwd()) {
  for (const candidate of [".env", "../.env"]) {
    const file = path.resolve(cwd, candidate);
    if (fs.existsSync(file)) {
      try {
        process.loadEnvFile(file);
      } catch {
        /* an unreadable .env should not stop the server from starting */
      }
      return file;
    }
  }
  return null;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment configuration — ${problems}`);
  }
  const e = parsed.data;
  const isProd = e.NODE_ENV === "production";

  if (isProd) {
    const missing: string[] = [];
    if (!e.MONGODB_URI) missing.push("MONGODB_URI");
    if (!e.ADMIN_PASSWORD) missing.push("ADMIN_PASSWORD");
    if (!e.ADMIN_JWT_SECRET) missing.push("ADMIN_JWT_SECRET");
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables in production: ${missing.join(", ")}`);
    }
    if ((e.ADMIN_PASSWORD ?? "").length < 8) throw new Error("ADMIN_PASSWORD must be at least 8 characters");
    if ((e.ADMIN_JWT_SECRET ?? "").length < 32)
      throw new Error("ADMIN_JWT_SECRET must be at least 32 characters");
  }

  const here = path.dirname(fileURLToPath(import.meta.url));
  return {
    env: e.NODE_ENV,
    isProd,
    port: e.PORT,
    mongoUri: e.MONGODB_URI,
    adminPassword: e.ADMIN_PASSWORD ?? DEV_ADMIN_PASSWORD,
    adminJwtSecret: e.ADMIN_JWT_SECRET ?? DEV_JWT_SECRET,
    clientOrigin: e.CLIENT_ORIGIN,
    publicUrl: e.PUBLIC_URL?.replace(/\/$/, ""),
    trustProxy: e.TRUST_PROXY,
    // Both server/src (dev) and server/dist (built) sit two levels below the repo root.
    clientDist: e.CLIENT_DIST ? path.resolve(e.CLIENT_DIST) : path.resolve(here, "../../client/dist"),
    // Email needs a trusted public URL: links in emails must never be built from the Host header.
    email:
      e.RESEND_API_KEY && e.EMAIL_FROM && e.PUBLIC_URL
        ? { apiKey: e.RESEND_API_KEY, from: e.EMAIL_FROM }
        : undefined,
    usingDevAdminDefaults: !e.ADMIN_PASSWORD || !e.ADMIN_JWT_SECRET,
  };
}
