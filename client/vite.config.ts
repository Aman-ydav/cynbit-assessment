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
  },
});
