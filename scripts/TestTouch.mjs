import assert from "node:assert/strict";

import { chromium } from "playwright";
import { createServer } from "vite";

/**
 * Starts a minimal page with real browser touch input enabled.
 *
 * @returns {Promise<object>} Vite server, browser, context, and page.
 */
async function startTouchPage() {
  const server = await createServer({
    configFile: false,
    cacheDir: "node_modules/.vite/touch-smoke",
    logLevel: "silent",
    server: { host: "127.0.0.1", port: 0 },
  });
  await server.listen();
  const browser = await chromium.launch();
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.route("**/touch-smoke", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/src/styles.css"><style>body{margin:0;min-height:2400px}#chart{width:390px;margin-top:100px}</style><button id="outside">Outside</button><div id="chart"></div>',
    }),
  );
  await page.goto(`${server.resolvedUrls.local[0]}touch-smoke`);
  await page.evaluate(async () => {
    const chartModule = "/src/index.js";
    const { RadarChart } = await import(chartModule);
    RadarChart.make("#chart")
      .labels([
        "Performance",
        "Battery",
        "Camera",
        "Display",
        "Portability",
        "Value",
      ])
      .dataset(
        "Phone",
        [
          92,
          84,
          89,
          91,
          76,
          72,
        ],
      )
      .height(320)
      .render();
  });

  return {
    server,
    browser,
    context,
    page,
  };
}

/**
 * Resolves a point inside the browser-rendered radar hit area.
 *
 * @param {import("playwright").Page} page - Touch-enabled browser page.
 * @param {number} index - Measure position.
 * @returns {Promise<{x: number, y: number}>} Viewport position to tap.
 */
function measurePosition(page, index) {
  return page
    .locator(".orchid-charts-radar-axis")
    .nth(index)
    .evaluate((mark) => {
      const line = mark.querySelector("line");
      const x = (Number(line.getAttribute("x1")) + Number(line.getAttribute("x2"))) / 2;
      const y = (Number(line.getAttribute("y1")) + Number(line.getAttribute("y2"))) / 2;
      const point = new DOMPoint(x, y).matrixTransform(mark.ownerSVGElement.getScreenCTM());

      return {
        x: point.x,
        y: point.y,
      };
    });
}

/**
 * Lets Chromium recognize a native scrolling gesture begun over the chart.
 *
 * @param {import("playwright").CDPSession} session - Chromium input connection.
 * @param {{x: number, y: number}} position - Initial touch position.
 * @returns {Promise<void>} Touch contact is released after moving upward.
 */
async function swipe(session, position) {
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { ...position, id: 0 },
    ],
  });
  for (let offset = 20; offset <= 160; offset += 20) {
    // eslint-disable-next-line no-await-in-loop -- Browser gesture samples must arrive in order.
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: position.x, y: position.y - offset, id: 0 },
      ],
    });
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

/**
 * Checks the browser accessibility tree rather than only SVG source text.
 *
 * @param {import("playwright").Page} page - Browser page.
 * @param {import("playwright").CDPSession} session - Accessibility connection.
 * @returns {Promise<void>} Exact static-chart values reach assistive technology.
 */
async function verifyAccessibleData(page, session) {
  await page.reload();
  await page.evaluate(async () => {
    const modulePath = "/src/index.js";
    const { LineChart } = await import(modulePath);
    LineChart.make("#chart")
      .labels([
        "Jan",
        "Feb",
        "Mar",
      ])
      .dataset(
        "Revenue",
        [
          12,
          18,
          24,
        ],
      )
      .tooltip(false)
      .render();
  });
  const tree = await session.send("Accessibility.getFullAXTree");
  assert.ok(tree.nodes.some((node) => node.description?.value.includes("Feb — Revenue: 18.")));
}

const { server, browser, context, page } = await startTouchPage();
try {
  const battery = await measurePosition(page, 1);
  await page.touchscreen.tap(battery.x, battery.y);
  assert.match(await page.locator(".orchid-charts-tooltip:not([hidden])").textContent(), /Battery/);
  const camera = await measurePosition(page, 2);
  await page.touchscreen.tap(camera.x, camera.y);
  assert.match(await page.locator(".orchid-charts-tooltip:not([hidden])").textContent(), /Camera/);
  await page.locator("#outside").tap();
  await page.waitForFunction(() => document.querySelector(".orchid-charts-tooltip").hidden);
  const session = await context.newCDPSession(page);
  await swipe(session, await measurePosition(page, 3));
  await page.waitForFunction(
    () => window.scrollY > 0 && document.querySelector(".orchid-charts-tooltip").hidden,
  );
  await verifyAccessibleData(page, session);
  console.log("Real touch: tap, change measure, dismiss, and chart-originated scroll passed");
} finally {
  await browser.close();
  await server.close();
}
