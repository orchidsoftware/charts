import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vite";

const isCompatibility = process.env.CHARTS2_COMPATIBILITY === "1";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.js",
      formats: [
        "es",
      ],
      fileName: "index",
    },
    minify: "terser",
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
        exports: "named",
        preserveModules: true,
        preserveModulesRoot: "src",
      },
    },
    sourcemap: "hidden",
    terserOptions: {
      compress: { module: true, passes: 5, toplevel: true },
      ecma: 2022,
      format: { comments: false },
      module: true,
      toplevel: true,
    },
  },
  test: {
    include: isCompatibility
      ? [
          "test/Compatibility.test.js",
          "test/BubbleBounds.test.js",
        ]
      : [
          "test/**/*.test.js",
        ],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: isCompatibility
        ? [
            { browser: "chromium" },
            { browser: "firefox" },
            { browser: "webkit" },
          ]
        : [
            { browser: "chromium" },
          ],
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
      include: [
        "src/**/*.js",
      ],
      reporter: [
        "text",
        "html",
        "lcov",
      ],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
});
