import { defineConfig } from "vitest/config";

/**
 * Unit tests for the pure business logic in `lib/`.
 *
 * `test.exclude` replaces Vitest's default list rather than extending it, so
 * `node_modules` has to be repeated here. `.next` is added on top of it: it is
 * not excluded by default and would otherwise be scanned for test files.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
