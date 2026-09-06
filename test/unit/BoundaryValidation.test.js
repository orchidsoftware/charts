import { beforeEach, describe, expect, it } from "vitest";

import { createHeatmapModel, createSeriesModel } from "../../src/core/ChartData.js";
import { normalizeChartOptions, validateChartColors, validateChartOptions } from "../../src/core/Options.js";
import { requireFiniteNumber } from "../../src/support/data/InputValidation.js";
import { validateChartData } from "../../src/support/data/SeriesData.js";
import { normalizeTimesheetData } from "../../src/support/data/TimesheetData.js";

const scene = {
  datasets: [
    {
      values: [
        1,
      ],
    },
  ],
};

beforeEach(() => {
  document.body.innerHTML = '<div id="chart" style="width: 640px"></div>';
});

describe("internal boundary validation", () => {
  it.each([
    [
      null,
      "options",
    ],
    [
      { type: "line", data: scene, unknown: true },
      "Unsupported chart option",
    ],
    [
      { type: "unknown", data: scene },
      "Chart type",
    ],
    [
      { type: "bar", data: scene, orientation: "diagonal" },
      "orientation",
    ],
    [
      { type: "line", data: scene, yAxisPosition: "center" },
      "position",
    ],
    [
      { type: "pie", data: scene, padAngle: Infinity },
      "Pad angle",
    ],
    [
      { type: "pie", data: scene, radius: -1 },
      "Radius",
    ],
  ])("rejects invalid runtime options", (options, message) => {
    expect(() => validateChartOptions(options)).toThrow(message);
  });

  it("rejects invalid normalized dimensions and palettes", () => {
    const host = document.querySelector("#chart");

    expect(() => normalizeChartOptions(host, { type: "line", data: scene, width: 0 })).toThrow("width");
    expect(() => normalizeChartOptions(host, { type: "line", data: scene, colors: [] })).toThrow("colors");
  });

  it("validates only color-bearing fields declared by public data schemas", () => {
    const host = document.querySelector("#chart");
    const unreadableValues = new Proxy([], {
      get() {
        throw new Error("numeric values must not be inspected while collecting colors");
      },
    });

    expect(() =>
      validateChartColors(host, {
        colors: [
          "red",
        ],
        data: {
          datasets: [
            null,
            [],
            { values: unreadableValues },
            { values: unreadableValues, color: "blue" },
          ],
          markers: [
            { color: "green", labelColor: "purple" },
          ],
          regions: [
            { color: "orange", labelColor: "black" },
          ],
          tasks: [
            { color: "white" },
          ],
        },
      }),
    ).not.toThrow();

    for (const input of [
      {
        colors: [
          "definitely-not-a-color",
        ],
      },
      {
        datasets: [
          { color: "definitely-not-a-color" },
        ],
      },
      {
        markers: [
          { labelColor: "definitely-not-a-color" },
        ],
      },
      {
        regions: [
          { color: "definitely-not-a-color" },
        ],
      },
      {
        tasks: [
          { color: "definitely-not-a-color" },
        ],
      },
    ]) {
      expect(() => validateChartColors(host, input)).toThrow("Unsupported CSS color");
    }

    expect(() =>
      validateChartColors(host, {
        datasets: [
          { color: undefined },
        ],
      }),
    ).toThrow("non-empty supported CSS color");
    expect(() => validateChartColors(host, null)).not.toThrow();
    expect(() => validateChartColors(host, [])).not.toThrow();
  });

  it("covers normalization invariants used by updates and generated labels", () => {
    expect(() => requireFiniteNumber(NaN, "Value")).toThrow("finite");
    expect(() =>
      normalizeTimesheetData(
        {
          tasks: [
            null,
          ],
        },
        [
          "#007aff",
        ],
      ),
    ).toThrow("object");
    expect(() =>
      validateChartData(
        "pie",
        [
          {
            identityName: "A",
            points: [
              { y: 1 },
            ],
          },
          {
            identityName: "B",
            points: [
              { y: 1 },
            ],
          },
        ],
        [
          "One",
        ],
      ),
    ).toThrow("exactly one dataset");

    const data = createSeriesModel(
      "line",
      {
        labels: [
          1,
        ],
        datasets: [
          {
            values: [
              1,
            ],
          },
        ],
      },
      {},
    );
    expect(data.labels).toEqual([
      1,
    ]);

    const heatmap = createHeatmapModel("heatmap", { points: { "2026-01-01": 0 } }, {});
    const selection = heatmap.selectionFor({ kind: "cell", pointIndex: 0 });
    expect(selection.color).toBe("#E5E5EA");
  });
});
