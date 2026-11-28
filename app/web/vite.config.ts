import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "localhost",
    port: 5173,
    // xfwd: a API enxerga o endereço de quem usa o navegador (X-Forwarded-For), não 127.0.0.1.
    proxy: { "/api": { target: "http://127.0.0.1:3000", xfwd: true } },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["test/setup.ts"],
    include: ["test/**/*.test.{ts,tsx}"],
  },
});
