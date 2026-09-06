import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import test from "node:test";

import { documentationAssets } from "../scripts/Documentation.mjs";

function verifyLinks(assets, filename, html) {
  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    const target = new URL(href, `https://docs.test/${filename}`);
    if (target.hostname !== "docs.test" || !target.pathname.startsWith("/docs/")) {
      continue;
    }
    const path = target.pathname === "/docs/" ? "docs/index.html" : target.pathname.slice(1);
    assert.ok(assets.has(path), `${filename}: missing ${href}`);
    if (target.hash) {
      assert.ok(assets.get(path).includes(`id="${target.hash.slice(1)}"`), `${filename}: missing ${href}`);
    }
  }
}

test("publishes guides with working local links and shared navigation", async () => {
  const assets = await documentationAssets();
  // This URL is fixed relative to this test file.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const filenames = await readdir(new URL("../docs/", import.meta.url));
  const documents = filenames.filter((filename) => filename.endsWith(".md"));
  const pages = [...assets].filter(
    ([filename]) => filename.endsWith(".html") && filename !== "docs/chart-types.html",
  );
  assert.equal(pages.length, documents.length - 1);
  assert.equal(assets.get("docs/index.html"), assets.get("docs/getting-started.html"));
  assert.match(assets.get("docs/chart-types.html"), /content="0;url=\.\.\/#supported-charts"/);
  for (const [filename, html] of pages) {
    assert.match(html, /class="site-header"/);
    assert.match(html, /class="site-footer"/);
    assert.match(html, /class="brand-mark"/);
    assert.match(html, /aria-current="page"/);
    assert.doesNotMatch(html, /<script\b/);
    assert.equal([...html.matchAll(/<footer\b/g)].length, 1);
    assert.match(html, /href="#top">Back to Top ↑<\/a>/);
    verifyLinks(assets, filename, html);
  }
});

test("renders highlighted code, escaped HTML examples, and accessible reference tables", async () => {
  const assets = await documentationAssets();
  const start = assets.get("docs/getting-started.html");
  assert.match(start, /class="hljs-keyword"/);
  assert.match(start, /class="language-html"/);
  assert.doesNotMatch(start, /<div id="revenue"><\/div>/);
  assert.match(start, /href="line.html"/);
  assert.match(start, /href="bar.html"/);
  assert.doesNotMatch(start, />Overview<|href="\.\/chart-types.html"/);
  assert.match(assets.get("docs/api-reference.html"), /class="docs-table" role="region"/);
  assert.match(assets.get("docs/frameworks.html"), /class="language-vue"/);
  const development = await documentationAssets("/demo/");
  assert.match(development.get("docs/index.html"), /href="\/demo\/lab.html"/);
});
