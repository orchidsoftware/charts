import { beforeEach, describe, expect, it, vi } from "vitest";

import { LineChart } from "../src/index.js";
import { wrappedLabelElement } from "../src/support/presentation/TextLayout.js";
import "../src/styles.css";

function resetHost() {
  document.body.innerHTML = '<div id="chart" style="width: 640px"></div>';
}
function expectFailure(callback, message) {
  // eslint-disable-next-line security/detect-non-literal-regexp -- Expectations are fixed test-source strings.
  expect(callback).toThrow(new RegExp(message, "iu"));
}

describe("Boundary Policies", () => {
  beforeEach(resetHost);
  it("explains missing theme colors and allows rendering after styles arrive", () => {
    const host = document.querySelector("#chart");
    host.textContent = "Loading revenue";
    const builder = LineChart.make(host).dataset("Revenue", [1, 2], "var(--revenue-color)");

    expect(() => builder.render()).toThrow(
      "Unresolved CSS color variable: --revenue-color. Define it on the chart host or an ancestor and wait for its stylesheet to load before calling render() or update().",
    );
    expect(host.textContent).toBe("Loading revenue");
    expect(host.querySelector("svg")).toBeNull();

    const style = document.createElement("style");
    style.textContent = "#chart { --revenue-color: #2563eb; }";
    document.body.prepend(style);
    const chart = builder.render();

    expect(chart.element.isConnected).toBe(true);
    expect(getComputedStyle(chart.element.querySelector(".orchid-charts-line")).stroke).toBe(
      "rgb(37, 99, 235)",
    );
  });

  it("validates CSS colors with variables and the style-parser fallback", () => {
    const OriginalCss = CSS;
    vi.stubGlobal("CSS");
    const chart = LineChart.make("#chart").dataset([1], "red").render();
    expect(chart.element.querySelector(".orchid-charts-line").getAttribute("stroke")).toBe("red");
    expectFailure(
      () =>
        chart.update({
          labels: ["A"],
          datasets: [
            {
              values: [1],
              color: "",
            },
          ],
        }),
      "non-empty supported CSS color",
    );
    expectFailure(
      () =>
        chart.update({
          labels: ["A"],
          datasets: [
            {
              values: [1],
              color: "definitely-not-a-color",
            },
          ],
        }),
      "Unsupported CSS color",
    );
    expectFailure(
      () =>
        chart.update({
          labels: ["A"],
          datasets: [
            {
              values: [1],
              color: "var(--missing-color)",
            },
          ],
        }),
      "Unresolved CSS color variable",
    );
    vi.stubGlobal("CSS", OriginalCss);
  });
  it("wraps explicit label lines and preserves a truncated word in its title", () => {
    const wrapped = wrappedLabelElement({
      value: ["One", "Two"],
      attributes: { x: 10, y: 10, class: "label" },
      maxWidth: 100,
    });
    expect(wrapped.querySelectorAll("tspan")).toHaveLength(2);
    const truncatedWord = wrappedLabelElement({
      value: "Supercalifragilisticexpialidocious",
      attributes: { x: 10, y: 10, class: "label" },
      maxWidth: 8,
    });
    expect(truncatedWord.querySelector("title").textContent).toBe("Supercalifragilisticexpialidocious");
    const chart = LineChart.make("#chart").dataset([2]).render();
    expect(chart.element.querySelector(".orchid-charts-x-hit").getAttribute("aria-label")).toContain(
      "1 — Series 1: 2",
    );
  });
});
