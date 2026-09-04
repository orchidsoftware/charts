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

function copyIcon(isCopied = false) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");

  if (isCopied) {
    const check = document.createElementNS("http://www.w3.org/2000/svg", "path");
    check.setAttribute("d", "m5 12.5 4.5 4.5L19 7");
    svg.append(check);
    return svg;
  }

  const back = document.createElementNS("http://www.w3.org/2000/svg", "path");
  back.setAttribute("d", "M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2");
  const front = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  front.setAttribute("x", "8");
  front.setAttribute("y", "8");
  front.setAttribute("width", "12");
  front.setAttribute("height", "12");
  front.setAttribute("rx", "2");
  svg.append(back, front);
  return svg;
}

function setCopyState(button, isCopied) {
  button.replaceChildren(copyIcon(isCopied));
  button.classList.toggle("is-copied", isCopied);
  button.setAttribute("aria-label", isCopied ? "Code copied" : button.dataset.copyLabel);
  button.setAttribute("title", isCopied ? "Copied" : "Copy code");
}

function copyButton(code, selector) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "example-code-copy";
  button.dataset.copyLabel = `Copy code for ${selector}`;
  setCopyState(button, false);
  button.addEventListener("click", async () => {
    await navigator.clipboard.writeText(code);
    setCopyState(button, true);
    setTimeout(() => {
      setCopyState(button, false);
    }, 1600);
  });
  return button;
}

/**
 * Adds a copy button for the exact rendering source to every chart card header.
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
    const header = card?.querySelector(":scope > header");
    if (!header || header.querySelector(":scope > .example-code-actions")) {
      continue;
    }

    const code = exampleCode(selector, renderExample);
    const actions = document.createElement("div");
    actions.className = "example-code-actions";
    const reference = header.querySelector(":scope > code");
    if (reference) {
      actions.append(reference);
    }
    actions.append(copyButton(code, selector));
    header.append(actions);
  }
}
