import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

import { chromium, firefox, webkit } from "playwright";

const root = process.cwd();
const distributionRoot = path.resolve(root, "dist");
const browsers = Object.freeze({ chromium, firefox, webkit });

/**
 * Serves only the built modules and public stylesheet needed by a no-build page.
 *
 * @param {import("node:http").IncomingMessage} request - Browser request.
 * @param {import("node:http").ServerResponse} response - Browser response.
 * @returns {Promise<void>} Requested asset has been served.
 */
async function serveAsset(request, response) {
  const pathname = new URL(request.url, "http://localhost").pathname;

  if (pathname === "/") {
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": "text/html; charset=utf-8",
    });
    response.end(pageMarkup(`http://${request.headers.host}`));

    return;
  }

  const filename =
    pathname === "/style.css" ? path.resolve(root, "src/styles.css") : path.resolve(root, `.${pathname}`);
  const isBuiltModule = filename.startsWith(`${distributionRoot}${path.sep}`) && filename.endsWith(".js");

  if (pathname !== "/style.css" && !isBuiltModule) {
    response.writeHead(404).end();

    return;
  }

  try {
    const content = await readFile(filename);
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": pathname.endsWith(".css")
        ? "text/css; charset=utf-8"
        : "text/javascript; charset=utf-8",
    });
    response.end(content);
  } catch {
    response.writeHead(404).end();
  }
}

/**
 * Opens an ephemeral static origin without applying bundler transforms.
 *
 * @returns {Promise<{close(): Promise<void>, origin: string}>} Static test server.
 */
async function startServer() {
  const server = createServer((request, response) => {
    void serveAsset(request, response);
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();

  if (typeof address !== "object" || address === null) {
    throw new TypeError("No-build test server did not expose a TCP address");
  }

  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: async () => {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

/**
 * Builds a complete browser page that uses only a stylesheet link and import map.
 *
 * @param {string} origin - Static asset origin.
 * @returns {string} Standalone HTML document.
 */
function pageMarkup(origin) {
  const importMap = JSON.stringify({ imports: { "@charts2/core": `${origin}/dist/index.js` } });

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <link rel="stylesheet" href="${origin}/style.css">
    <script type="importmap">${importMap}</script>
  </head>
  <body>
    <div id="chart" style="width:640px"></div>
    <script type="module">
      try {
        const charts = await import("@charts2/core");
        const chart = charts.LineChart.make("#chart")
          .labels(["A", "B"])
          .dataset("Series", [1, 2])
          .render();
        chart.update({ labels: ["A", "B"], datasets: [{ name: "Series", values: [2, 3] }] });
        const svg = chart.element;
        const result = {
          definitionKeys: Object.keys(charts.LineChart),
          display: getComputedStyle(svg).display,
          exportCount: Object.keys(charts).length,
          marks: svg.querySelectorAll(".charts2-mark").length,
          rendered: svg.matches("svg.charts2-chart"),
        };
        chart.destroy();
        globalThis.__charts2NoBuild = { ...result, destroyed: !svg.isConnected };
      } catch (error) {
        globalThis.__charts2NoBuild = { error: error instanceof Error ? error.stack : String(error) };
      }
    </script>
  </body>
</html>`;
}

/**
 * Verifies native package loading and the public lifecycle in one browser.
 *
 * @param {string} name - Browser name used in diagnostics.
 * @param {import("playwright").BrowserType} browserType - Playwright browser launcher.
 * @param {string} origin - Static asset origin.
 * @returns {Promise<void>} Browser completed the no-build contract.
 */
async function testBrowser(name, browserType, origin) {
  const browser = await browserType.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto(origin, { waitUntil: "load" });
    await page.waitForFunction(() => globalThis.__charts2NoBuild !== undefined);
    const result = await page.evaluate(() => globalThis.__charts2NoBuild);

    if (result.error) {
      throw new Error(`${name} failed to import Charts2 through an import map:\n${result.error}`);
    }

    const expected = {
      definitionKeys: [
        "make",
      ],
      destroyed: true,
      display: "block",
      exportCount: 12,
      marks: 2,
      rendered: true,
    };
    const matches =
      Object.keys(result).length === Object.keys(expected).length &&
      Object.entries(expected).every(
        ([
          key,
          value,
        ]) => JSON.stringify(result[key]) === JSON.stringify(value),
      );

    if (!matches) {
      throw new Error(`${name} returned an unexpected no-build result: ${JSON.stringify(result)}`);
    }

    console.log(`${name}: native import map passed`);
  } finally {
    await browser.close();
  }
}

const server = await startServer();

try {
  await Promise.all(
    Object.entries(browsers).map(
      ([
        name,
        browserType,
      ]) => testBrowser(name, browserType, server.origin),
    ),
  );
} finally {
  await server.close();
}
