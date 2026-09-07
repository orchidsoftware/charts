import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";

import { chromium, webkit } from "playwright";
import { preview } from "vite";

async function verifyDemoLoading(engine, url) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const errors = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });
    // Keep the production CSS slower than the module, as on a cold mobile visit.
    await page.route("**/*.css", async (route) => {
      await delay(1500);
      await route.continue();
    });
    await page.goto(url);
    assert.deepEqual(errors, [], `${engine.name()}: cold-load errors`);
    assert.equal(await page.locator("svg.orchid-charts-chart").count(), 23);
    assert.equal(await page.locator("#hero-revenue .orchid-charts-line").count(), 2);

    const line = page.locator("#your-chart .orchid-charts-line");
    const before = await line.getAttribute("d");
    await page.locator("#try-values").fill("10, 20, 15");
    await page.locator("#try-form button[type=submit]").click();
    assert.notEqual(await line.getAttribute("d"), before);
    assert.equal(await page.locator("svg.orchid-charts-chart").count(), 23);

    await page.unrouteAll();
    await page.reload();
    assert.deepEqual(errors, [], `${engine.name()}: reload errors`);
    assert.equal(await page.locator("svg.orchid-charts-chart").count(), 23);
    console.log(`${engine.name()}: delayed CSS, all 23 charts, data update, and reload passed`);
  } finally {
    await browser.close();
  }
}

const server = await preview({
  configFile: "ViteDemoConfig.js",
  preview: { host: "127.0.0.1", port: 0, open: false },
});
try {
  const results = await Promise.allSettled(
    [
      chromium,
      webkit,
    ].map((engine) => verifyDemoLoading(engine, server.resolvedUrls.local[0])),
  );
  const failures = results.filter((result) => result.status === "rejected");
  assert.deepEqual(
    failures.map((result) => result.reason.message),
    [],
  );
} finally {
  await new Promise((resolve, reject) => {
    server.httpServer.close((error) => (error ? reject(error) : resolve()));
  });
}
