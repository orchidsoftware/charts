import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";
import { createServer } from "vite";

/**
 * Extracts the actual published Stimulus example, changing only module loading.
 *
 * @returns {Promise<string>} Browser-loadable controller from the guide.
 */
async function recipeSource() {
  const guide = await readFile("docs/frameworks.md", "utf8");
  const source = guide
    .split("// app/javascript/controllers/revenue_chart_controller.js\n", 2)[1]
    .split("```", 1)[0];

  return source
    .replace('import { Controller } from "@hotwired/stimulus";', "const { Controller } = window.Stimulus;")
    .replace('"@orchidsoftware/charts"', '"/src/index.js"')
    .replace(
      "export default class extends Controller",
      "window.RevenueController = class extends Controller",
    );
}

/**
 * Renders the documented server-owned host with one revenue observation.
 *
 * @param {number} value - Revenue returned by the server.
 * @returns {string} Server HTML that intentionally contains no generated SVG.
 */
function hostMarkup(value) {
  return `<div id="revenue" data-controller="revenue-chart" data-action="turbo:before-cache@document->revenue-chart#destroy" data-revenue-chart-labels-value='["Jan"]' data-revenue-chart-values-value="[${value}]"></div>`;
}

/**
 * Verifies visible content after a real Turbo morph with a preserved controller.
 *
 * @param {import("playwright").Page} page - Page containing the registered controller.
 * @param {number} value - Replacement server value.
 * @returns {Promise<void>} One connected chart shows the new value.
 */
async function verifyMorph(page, value) {
  const html = `<turbo-stream action="replace" method="morph" target="revenue"><template>${hostMarkup(value)}</template></turbo-stream>`;
  await page.evaluate((markup) => globalThis.Turbo.renderStreamMessage(markup), html);
  await page.waitForFunction((expected) => {
    const controller = globalThis.application.getControllerForElementAndIdentifier(
      document.querySelector("#revenue"),
      "revenue-chart",
    );

    return (
      controller === globalThis.originalController &&
      controller.chart?.element.isConnected &&
      controller.chart.point(0).values[0] === expected
    );
  }, value);
  assert.equal(await page.locator("#revenue svg").count(), 1);
}

const server = await createServer({
  configFile: false,
  cacheDir: "node_modules/.vite/framework-smoke",
  logLevel: "silent",
  server: { host: "127.0.0.1", port: 0 },
});
await server.listen();
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => {
    errors.push(error.message);
  });
  await page.route("**/framework-smoke", (route) =>
    route.fulfill({ contentType: "text/html", body: `<!doctype html>${hostMarkup(42)}` }),
  );
  await page.goto(`${server.resolvedUrls.local[0]}framework-smoke`);
  await page.addScriptTag({ path: path.resolve("node_modules/@hotwired/turbo/dist/turbo.es2017-umd.js") });
  await page.addScriptTag({ path: path.resolve("node_modules/@hotwired/stimulus/dist/stimulus.umd.js") });
  await page.addScriptTag({ type: "module", content: await recipeSource() });
  await page.waitForFunction(() => typeof globalThis.RevenueController === "function");
  await page.evaluate(() => {
    Object.assign(globalThis, { application: globalThis.Stimulus.Application.start() });
    globalThis.application.register("revenue-chart", globalThis.RevenueController);
  });
  await page.waitForSelector("#revenue svg");
  await page.evaluate(() => {
    Object.assign(globalThis, {
      originalController: globalThis.application.getControllerForElementAndIdentifier(
        document.querySelector("#revenue"),
        "revenue-chart",
      ),
    });
  });
  await verifyMorph(page, 99);
  await verifyMorph(page, 99);
  await page.evaluate(() => document.dispatchEvent(new Event("turbo:before-cache")));
  assert.equal(await page.locator("#revenue svg").count(), 0);
  assert.deepEqual(errors, []);
  console.log("Documented Turbo recipe: changed-data morph, unchanged-data morph, and cache cleanup passed");
} finally {
  await browser.close();
  await server.close();
}
