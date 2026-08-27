import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.js",
      name: "Charts2",
      formats: ["es", "cjs"],
      cssFileName: "charts2",
      fileName: (format) => (format === "es" ? "charts2.js" : "charts2.cjs"),
    },
    rollupOptions: { output: { exports: "named" } },
    sourcemap: true,
  },
  test: {
    include: ["test/**/*.test.js"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
      expect: {
        toMatchScreenshot: {
          comparatorName: "pixelmatch",
          comparatorOptions: {
            allowedMismatchedPixelRatio: 0.0005,
            threshold: 0.1,
          },
        },
      },
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.js"],
      reporter: ["text", "html", "lcov"],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
});
