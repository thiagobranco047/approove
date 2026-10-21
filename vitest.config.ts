import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
    // Testes nunca falam com Turso nem com chaves reais do .env.
    env: {
      TURSO_DATABASE_URL: "",
      TURSO_AUTH_TOKEN: "",
      DATABASE_URL: "file:./qa-unit.db",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
