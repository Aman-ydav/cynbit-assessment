import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// In development the Vite dev server proxies /api to the Express server,
// so the browser sees a single origin (no CORS needed).
const apiTarget = process.env.VITE_API_PROXY ?? "http://localhost:4000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": apiTarget,
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    // The server reads this to preload each route's chunks (see server/src/preload.ts).
    manifest: true,
    rollupOptions: {
      output: {
        // Long-lived framework code gets its own chunks: they stay cached across deploys
        // (only the small app chunk changes), and loading them in parallel is faster.
        manualChunks(id) {
          const path = id.replace(/\\/g, "/");
          if (!path.includes("/node_modules/")) return undefined;
          if (/\/node_modules\/(react-dom|scheduler)\//.test(path)) return "react-dom";
          if (/\/node_modules\/react\//.test(path)) return "react";
          if (/\/node_modules\/(react-router|@remix-run)\b/.test(path)) return "router";
          if (/\/node_modules\/(@radix-ui|radix-ui|aria-hidden|react-remove-scroll)/.test(path)) return "radix";
          if (/\/node_modules\/lucide-react\//.test(path)) return "icons";
          if (/\/node_modules\/zod\//.test(path)) return "zod";
          return undefined;
        },
      },
    },
  },
});
