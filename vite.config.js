import { defineConfig } from "vite";

import { documentationPlugin } from "./scripts/Documentation.mjs";
import { testProjects } from "./scripts/TestProjects.mjs";

const isCompatibility = process.env.ORCHID_CHARTS_COMPATIBILITY === "1";

export default defineConfig({
  plugins: [
    { ...documentationPlugin(), apply: "serve" },
  ],
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
    maxWorkers: 2,
    projects: testProjects(isCompatibility),
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
