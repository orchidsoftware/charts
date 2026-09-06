import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import highlight from "highlight.js";
import MarkdownIt from "markdown-it";

const documentationDirectory = new URL("../docs/", import.meta.url);
const stylesheet = new URL("../demo/docs.css", import.meta.url);
const guideNames = [
  "getting-started",
  "customization",
  "frameworks",
  "updates-and-interaction",
  "exporting",
  "api-reference",
];

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function pagePath(name) {
  return name === "readme" ? "index.html" : `${name}.html`;
}

function documentLink(href) {
  const relative = href.startsWith("./") ? href.slice(2) : href;
  const match = /^([\w-]+)\.md\b/.exec(relative);
  if (!match) {
    return href;
  }
  const suffix = relative.slice(match[0].length);
  const isDocument = suffix === "" || suffix.startsWith("#") || suffix.startsWith("?");
  return isDocument ? `${pagePath(match[1])}${suffix}` : href;
}

function renderMarkdown(source) {
  const headings = new Map();
  const markdown = new MarkdownIt({
    highlight(code, language) {
      const syntax = language === "vue" ? "xml" : language;
      return highlight.getLanguage(syntax) ? highlight.highlight(code, { language: syntax }).value : "";
    },
  });
  const fence = markdown.renderer.rules.fence;
  markdown.renderer.rules.fence = (tokens, index, options, environment, renderer) => {
    const language = tokens[index].info.trim().split(/\s+/, 1)[0];
    const labels = new Map([
      [
        "js",
        "JavaScript",
      ],
      [
        "jsx",
        "JSX",
      ],
      [
        "html",
        "HTML",
      ],
      [
        "css",
        "CSS",
      ],
      [
        "bash",
        "Terminal",
      ],
      [
        "vue",
        "Vue",
      ],
      [
        "text",
        "Text",
      ],
    ]);
    const label = labels.get(language) ?? (language || "Code");
    const code = fence(tokens, index, options, environment, renderer).replace(
      "<pre>",
      '<pre tabindex="0" aria-label="Code example">',
    );
    return `<figure class="docs-code"><figcaption>${escapeHtml(label)}</figcaption>${code}</figure>\n`;
  };
  markdown.renderer.rules.heading_open = (tokens, index, options, environment, renderer) => {
    const text = tokens[index + 1].content;
    const slug = text
      .toLowerCase()
      .replaceAll(/[^\p{L}\p{N}\s-]/gu, "")
      .trim()
      .replaceAll(/\s+/g, "-");
    const count = headings.get(slug) ?? 0;
    headings.set(slug, count + 1);
    tokens[index].attrSet("id", count === 0 ? slug : `${slug}-${count}`);
    return renderer.renderToken(tokens, index, options);
  };
  markdown.renderer.rules.link_open = (tokens, index, options, environment, renderer) => {
    tokens[index].attrSet("href", documentLink(tokens[index].attrGet("href")));
    return renderer.renderToken(tokens, index, options);
  };
  markdown.renderer.rules.table_open = () =>
    '<div class="docs-table" role="region" aria-label="Reference table" tabindex="0"><table>\n';
  markdown.renderer.rules.table_close = () => "</table></div>\n";
  return markdown.render(source);
}

function navigation(pages, current, icons) {
  const groups = [
    [
      "Start Here",
      pages.filter((page) => page.name === "getting-started"),
    ],
    [
      "Chart Types",
      pages.filter((page) => !guideNames.includes(page.name)),
    ],
    [
      "In Your Product",
      pages.filter(
        (page) =>
          guideNames.includes(page.name) && page.name !== "getting-started" && page.name !== "api-reference",
      ),
    ],
    [
      "Reference",
      pages.filter((page) => page.name === "api-reference"),
    ],
  ];
  return groups
    .map(
      ([
        title,
        entries,
      ]) =>
        `<div class="docs-nav-group"><h2>${title}</h2>${entries
          .map((page) => {
            const active = page.name === current ? ' aria-current="page"' : "";
            const label = page.title.replace(/ Charts?$/, "");
            const iconName =
              new Map([
                [
                  "bar",
                  "bar-vertical",
                ],
                [
                  "polar-area",
                  "polar",
                ],
              ]).get(page.name) ?? page.name;
            const icon = icons.get(iconName) ?? "";
            return `<a href="./${pagePath(page.name)}"${active}>${icon}<span>${escapeHtml(label)}</span></a>`;
          })
          .join("")}</div>`,
    )
    .join("");
}

function renderPage(page, pages, shell) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="${escapeHtml(page.title)} — Orchid Charts documentation." />
  <title>${escapeHtml(page.title)} · Orchid Charts</title>
  <link rel="canonical" href="https://charts.orchid.software/docs/${pagePath(page.name)}" />
  <link rel="stylesheet" href="./site.css" />
  <link rel="stylesheet" href="./style.css" />
</head>
<body id="top" class="docs-page">
  <a class="skip-link" href="#content">Skip to content</a>
  ${shell.header}
  <div class="docs-layout">
    <aside class="docs-sidebar">
      <nav class="docs-desktop-nav" aria-label="Documentation">${navigation(pages, page.name, shell.icons)}</nav>
      <details class="docs-mobile-nav"><summary>Documentation Menu</summary><nav aria-label="Documentation">${navigation(pages, page.name, shell.icons)}</nav></details>
    </aside>
    <main id="content" class="docs-content" tabindex="-1">
      <article>${renderMarkdown(page.source)}</article>
      <p class="docs-source"><a href="https://github.com/orchidsoftware/charts/blob/master/docs/${page.name}.md">View this page on GitHub ↗</a></p>
    </main>
  </div>
  ${shell.footer}
</body>
</html>`;
}

async function siteShell(demoHref) {
  const source = await readFile(new URL("../demo/index.html", import.meta.url), "utf8");
  const header = source.slice(
    source.indexOf('<header class="site-header">'),
    source.indexOf("</header>") + 9,
  );
  const footer = source.slice(
    source.indexOf('<footer class="site-footer">'),
    source.indexOf("</footer>") + 9,
  );
  const links = (markup) =>
    markup
      .replaceAll('href="#supported-charts"', () => `href="${demoHref}#supported-charts"`)
      .replaceAll('href="#install"', 'href="./getting-started.html"')
      .replaceAll('href="./lab.html"', () => `href="${demoHref}lab.html"`)
      .replaceAll('href="/docs/"', 'href="./" aria-current="page"');
  return {
    header: links(header).replaceAll('href="#top"', () => `href="${demoHref}"`),
    footer: links(footer),
    icons: new Map(
      [
        ...source.matchAll(/<a href="#([^"<>]+)"\s*>\s*(<svg\b[\s\S]*?<\/svg\s*>)/g),
      ].map((match) => [
        match[1],
        match[2].replace("<svg ", '<svg focusable="false" '),
      ]),
    ),
  };
}

export async function documentationAssets(demoHref = "../") {
  const shell = await siteShell(demoHref);
  const directoryEntries = await readdir(documentationDirectory);
  const filenames = directoryEntries.filter(
    (name) => name.endsWith(".md") && name !== "readme.md" && name !== "chart-types.md",
  );
  const pages = await Promise.all(
    filenames.map(async (filename) => {
      const source = await readFile(new URL(filename, documentationDirectory), "utf8");
      const name = filename.slice(0, -3);
      const title = /^# (.+)$/m.exec(source)?.[1] ?? name;
      return {
        name,
        title,
        source,
      };
    }),
  );
  pages.sort((left, right) => {
    const leftOrder = guideNames.indexOf(left.name);
    const rightOrder = guideNames.indexOf(right.name);
    return (
      (leftOrder === -1 ? guideNames.length : leftOrder) -
        (rightOrder === -1 ? guideNames.length : rightOrder) || left.title.localeCompare(right.title)
    );
  });
  const assets = new Map(
    pages.map((page) => [
      `docs/${pagePath(page.name)}`,
      renderPage(page, pages, shell),
    ]),
  );
  assets.set("docs/index.html", assets.get("docs/getting-started.html"));
  const chartIndex = `${demoHref}#supported-charts`;
  assets.set(
    "docs/chart-types.html",
    `<!doctype html>
<html lang="en"><head><meta charset="UTF-8" />
<meta http-equiv="refresh" content="0;url=${chartIndex}" />
<title>Chart types · Orchid Charts</title></head>
<body><a href="${chartIndex}">Explore chart types in the demo</a></body></html>`,
  );
  assets.set("docs/site.css", await readFile(new URL("../demo/site.css", import.meta.url), "utf8"));
  assets.set("docs/style.css", await readFile(stylesheet, "utf8"));
  return assets;
}

export function documentationPlugin() {
  return {
    name: "orchid-documentation",
    async generateBundle() {
      const assets = await documentationAssets();
      for (const [
        fileName,
        source,
      ] of assets) {
        // Vite provides the output context through its hook receiver.
        // eslint-disable-next-line unicorn/no-this-outside-of-class
        this.emitFile({ type: "asset", fileName, source });
      }
    },
    configureServer(server) {
      const cache = new Map();
      const directory = fileURLToPath(documentationDirectory);
      const demoHref = server.config.root.endsWith("/demo") ? "/" : "/demo/";
      server.watcher.add(directory);
      server.watcher.on("all", (_event, filename) => {
        const isDocumentation =
          filename.startsWith(directory) || /\/demo\/(?:index\.html|site\.css|docs\.css)$/.test(filename);
        if (isDocumentation) {
          cache.clear();
          server.ws.send({ type: "full-reload" });
        }
      });
      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(request.url, "http://localhost").pathname;
        if (pathname === "/docs") {
          response.writeHead(302, { Location: "/docs/" });
          response.end();
          return;
        }
        if (!pathname.startsWith("/docs/")) {
          next();
          return;
        }
        try {
          if (!cache.has("assets")) {
            cache.set("assets", documentationAssets(demoHref));
          }
          const assets = await cache.get("assets");
          const assetPath = pathname === "/docs/" ? "docs/index.html" : pathname.slice(1);
          const asset = assets.get(assetPath);
          if (asset === undefined) {
            next();
            return;
          }
          response.setHeader(
            "Content-Type",
            assetPath.endsWith(".css") ? "text/css; charset=utf-8" : "text/html; charset=utf-8",
          );
          response.end(asset);
        } catch (error) {
          cache.clear();
          next(error);
        }
      });
    },
  };
}
