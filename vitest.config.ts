import { defineConfig } from "vitest/config";
import { stylexTestPlugin } from "./stylex-vite-plugin.ts";

export default defineConfig({
  plugins: [stylexTestPlugin(import.meta.dirname)],
  test: { environment: "jsdom", setupFiles: ["tests/setup.ts"], include: ["**/*.test.{ts,tsx}"], exclude: ["**/node_modules/**"] },
});
