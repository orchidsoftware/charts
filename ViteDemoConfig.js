import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";

import { documentationPlugin } from "./scripts/Documentation.mjs";

const demoFile = (name) => fileURLToPath(new URL(`demo/${name}`, import.meta.url));

export default defineConfig({
  root: "demo",
  base: "/",
  plugins: [
    documentationPlugin(),
  ],
  build: {
    outDir: "../pages-dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        demo: demoFile("index.html"),
        lab: demoFile("lab.html"),
      },
    },
  },
});
