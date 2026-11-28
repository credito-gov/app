import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["test/setup.ts"],
    globalSetup: ["test/banco/preparar.ts"],
    include: ["test/**/*.test.ts"],
    // O banco de teste é um só: os arquivos rodam em sequência.
    fileParallelism: false,
  },
});
