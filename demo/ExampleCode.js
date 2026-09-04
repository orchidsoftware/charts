function exampleBody(renderExample) {
  const source = renderExample.toString();
  const body = source.slice(source.indexOf("{") + 1, source.lastIndexOf("}"));
  const lines = body.split("\n");
  const returnIndex = lines.findIndex((line) => line.trim() === "return {");

  return lines
    .slice(0, returnIndex)
    .map((line) => line.replace(/^ {2}/, ""))
    .join("\n")
    .trim();
}

function formatHelper() {
  return `function formatValue(value) {
  const absolute = Math.abs(value);
  if (absolute >= 10_000) {
    return new Intl.NumberFormat(undefined, {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  if (absolute > 0 && absolute < 0.01) {
    return new Intl.NumberFormat(undefined, {
      maximumSignificantDigits: 3,
    }).format(value);
  }
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(value);
}`;
}

function selectionHelper(selector) {
  return `function reportSelection(detail) {
  const host = document.querySelector(${JSON.stringify(selector)});
  let status = host.nextElementSibling;
  if (!status?.matches("[aria-live]")) {
    status = document.createElement("p");
    status.setAttribute("aria-live", "polite");
    host.after(status);
  }
  const series = detail.dataset ? \`\${detail.dataset} · \` : "";
  const label = detail.label ?? detail.key ?? \`Point \${detail.index + 1}\`;
  const value = detail.value ?? detail.values?.join(", ");
  status.textContent = \`\${series}\${label}: \${value}\`;
}`;
}

/**
 * Reads the actual fluent example function used to render a card.
 * There is no second configuration representation to keep in sync.
 *
 * @param {string} selector - Chart host selector.
 * @param {() => object} renderExample - Canonical fluent example.
 * @returns {string} Standalone JavaScript ready to copy.
 */
export function exampleCode(selector, renderExample) {
  let body = exampleBody(renderExample);
  const chartName = body.match(/\b[A-Z][A-Za-z]+Chart\b/)?.[0];
  const helpers = [];

  if (body.includes("formatDemoValue")) {
    body = body.replaceAll("formatDemoValue", "formatValue");
    helpers.push(formatHelper());
  }
  if (body.includes("selectionReporter")) {
    body = body.replace(`selectionReporter(${JSON.stringify(selector)})`, "reportSelection");
    helpers.push(selectionHelper(selector));
  }

  return [
    `import { ${chartName} } from "@charts2/core";`,
    'import "@charts2/core/style.css";',
    ...helpers.flatMap((helper) => [
      "",
      helper,
    ]),
    "",
    body,
  ].join("\n");
}

function copyButton(code) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "example-code-copy";
  button.textContent = "Copy";
  button.addEventListener("click", async () => {
    await navigator.clipboard.writeText(code);
    button.textContent = "Copied";
    setTimeout(() => {
      button.textContent = "Copy";
    }, 1600);
  });
  return button;
}

/**
 * Adds the exact rendering source to every chart card present on the page.
 *
 * @param {Array<[string, () => object]>} examples - Selectors and fluent example functions.
 */
export function showExampleCode(examples) {
  for (const [
    selector,
    renderExample,
  ] of examples) {
    const host = document.querySelector(selector);
    const card = host?.closest("article");
    if (!card || card.querySelector(":scope > .example-code")) {
      continue;
    }

    const code = exampleCode(selector, renderExample);
    const details = document.createElement("details");
    details.className = "example-code";
    const summary = document.createElement("summary");
    summary.textContent = "Code";
    const toolbar = document.createElement("div");
    toolbar.className = "example-code-toolbar";
    toolbar.append(copyButton(code));
    const pre = document.createElement("pre");
    const codeElement = document.createElement("code");
    codeElement.textContent = code;
    pre.append(codeElement);
    details.append(summary, toolbar, pre);
    card.append(details);
  }

  const toggle = document.querySelector("#example-code-toggle");
  toggle?.addEventListener("click", () => {
    const visible = document.body.classList.toggle("example-code-visible");
    toggle.setAttribute("aria-pressed", String(visible));
    toggle.textContent = visible ? "Hide code" : "Show code";
  });
}
