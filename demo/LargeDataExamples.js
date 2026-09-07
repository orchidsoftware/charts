import { exampleCode } from "./ExampleCode.js";
import { largeDataBarExample, largeDataLineExample } from "./LargeDataFixtures.js";
import fixtureSource from "./LargeDataFixtures.js?raw";

const largeDataExamples = [
  [
    "#large-data-line",
    largeDataLineExample,
    "largeDataLineExample",
  ],
  [
    "#large-data-bar",
    largeDataBarExample,
    "largeDataBarExample",
  ],
].map(
  ([
    selector,
    render,
    name,
  ]) => {
    // Copy the authored function even when the production renderer is minified.
    const start = fixtureSource.indexOf(`export function ${name}() {`);
    const end = fixtureSource.indexOf("\n}", start) + 2;
    return [
      selector,
      render,
      exampleCode(selector, fixtureSource.slice(start, end)),
    ];
  },
);

/**
 * Defers full 100,000-point inputs until requested in the QA lab.
 *
 * @returns {Array<[string, () => object, string]>} Copyable public API examples.
 */
export function mountLargeDataExamples() {
  const controls = [
    ...document.querySelectorAll("[data-large-data-run]"),
  ];
  for (const [
    selector,
    renderExample,
  ] of largeDataExamples) {
    const host = document.querySelector(selector);
    if (!host) {
      continue;
    }
    const card = host.closest("article");
    const status = card.querySelector("[role=status]");
    const button = card.querySelector("[data-large-data-run]");
    let chart;

    button.addEventListener("click", () => {
      for (const control of controls) {
        control.disabled = true;
      }
      host.dataset.result = "running";
      status.textContent = "Constructing 100,000 values…";
      // Let the running state paint before constructing the complete SVG.
      requestAnimationFrame(() =>
        setTimeout(() => {
          let started = performance.now();
          try {
            chart?.destroy();
            chart = undefined;
            host.replaceChildren();
            started = performance.now();
            ({ chart } = renderExample());
            host.dataset.result = "rendered";
            status.textContent = `Constructed all 100,000 values in ${Math.round(performance.now() - started)} ms (excluding paint).`;
          } catch (error) {
            host.replaceChildren();
            host.dataset.result = "rejected";
            status.textContent = `Rendering rejected after ${Math.round(performance.now() - started)} ms — ${error.name}: ${error.message}`;
          } finally {
            for (const control of controls) {
              control.disabled = false;
            }
            button.textContent = "Run again · 100,000 values";
          }
        }, 0),
      );
    });
  }
  return largeDataExamples;
}
