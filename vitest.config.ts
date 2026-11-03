import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/lib/game/**/*.test.ts"],
    environment: "node",
  },
});
