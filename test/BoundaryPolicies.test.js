import { beforeEach, describe, expect, it, vi } from "vitest";

import { LineChart } from "../src/index.js";
import Composition from "../src/renderers/composition/Composition.js";
import { normalizePoint, validateChartData } from "../src/support/data/SeriesData.js";
import { linePath } from "../src/support/geometry/CartesianGeometry.js";
import { roundedSectorPath } from "../src/support/geometry/SectorGeometry.js";
import { intensityLevel } from "../src/support/Palette.js";
import { formatterText } from "../src/support/presentation/Formatting.js";
import { datasetSummary } from "../src/support/presentation/Presentation.js";
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
  it("validates CSS colors with variables and the style-parser fallback", () => {
    const OriginalCss = CSS;
    vi.stubGlobal("CSS");
    const chart = LineChart.make("#chart")
      .dataset(
        [
          1,
        ],
        "red",
      )
      .render();
    expect(chart.element.querySelector(".orchid-charts-line").getAttribute("stroke")).toBe("red");
    expectFailure(
      () =>
        chart.update({
          labels: [
            "A",
          ],
          datasets: [
            {
              values: [
                1,
              ],
              color: "",
            },
          ],
        }),
      "non-empty supported CSS color",
    );
    expectFailure(
      () =>
        chart.update({
          labels: [
            "A",
          ],
          datasets: [
            {
              values: [
                1,
              ],
              color: "definitely-not-a-color",
            },
          ],
        }),
      "Unsupported CSS color",
    );
    expectFailure(
      () =>
        chart.update({
          labels: [
            "A",
          ],
          datasets: [
            {
              values: [
                1,
              ],
              color: "var(--missing-color)",
            },
          ],
        }),
      "Unresolved CSS color variable",
    );
    vi.stubGlobal("CSS", OriginalCss);
  });
  it("unit-covers internal normalization and selection policies unreachable through valid marks", () => {
    expectFailure(() => normalizePoint(null, 0), "number or an object");
    expect(normalizePoint({ y: 2 }, 3).x).toBe(3);
    expectFailure(
      () =>
        validateChartData(
          "line",
          [
            {
              points: [
                { y: 1 },
              ],
            },
          ],
          "A",
        ),
      "labels must be an array",
    );
    expectFailure(
      () =>
        validateChartData(
          "radar",
          [
            {
              points: [
                { y: -1 },
              ],
            },
          ],
          [
            "A",
          ],
        ),
      "values must be non-negative",
    );

    expectFailure(
      () =>
        new Composition({
          labels: [
            "A",
          ],
          datasets: [
            {
              points: [
                { y: 0 },
              ],
            },
          ],
          options: { type: "pie" },
        }),
      "positive total",
    );
    expect(
      roundedSectorPath({
        center: { x: 0, y: 0 },
        radii: { outer: 10, inner: 0 },
        angles: { outer: { start: 0, end: 1 }, inner: { start: 0, end: 1 } },
        cornerRadius: 0,
      }),
    ).toContain("A10,10");
    expect(
      roundedSectorPath({
        center: { x: 0, y: 0 },
        radii: { outer: 0, inner: 0 },
        angles: { outer: { start: 0, end: 0 }, inner: { start: 0, end: 0 } },
        cornerRadius: 1,
      }),
    ).toContain("A0,0");
    expect(
      intensityLevel(
        0,
        [
          0,
          0,
        ],
        5,
      ),
    ).toBe(0);
    expect(
      intensityLevel(
        2,
        [
          2,
          2,
        ],
        5,
      ),
    ).toBe(4);
    expect(
      linePath([
        { x: 2, y: 1 },
        { x: 1, y: 2 },
      ]),
    ).toBe("M2,1 L1,2");
    expectFailure(() => formatterText(1, "Value"), "Value formatter must return a string");

    const wrapped = wrappedLabelElement({
      value: [
        "One",
        "Two",
      ],
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
    expect(
      datasetSummary(
        {
          name: "A",
          points: [
            { x: 5, y: 2 },
          ],
        },
        [],
      ),
    ).toContain("5: 2");
  });
});
