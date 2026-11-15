import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  // The shared package is TypeScript source; bundle it into the server build.
  noExternal: ["@bitelevate/shared"],
  // Dev-only: loaded dynamically when no MONGODB_URI is set; never bundled or shipped.
  external: ["mongodb-memory-server"],
});
