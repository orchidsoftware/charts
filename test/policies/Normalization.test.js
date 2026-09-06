import { expect, it } from "vitest";

import { createHeatmapModel, createSeriesModel } from "../../src/core/ChartData.js";
import { requireFiniteNumber } from "../../src/support/data/InputValidation.js";
import { validateChartData } from "../../src/support/data/SeriesData.js";
import { normalizeTimesheetData } from "../../src/support/data/TimesheetData.js";

it("rejects non-finite numbers", () => {
  expect(() => requireFiniteNumber(NaN, "Value")).toThrow("finite");
});

it("rejects a null timesheet task", () => {
  expect(() =>
    normalizeTimesheetData(
      {
        tasks: [null],
      },
      ["#007aff"],
    ),
  ).toThrow("object");
});

it("rejects multiple pie datasets", () => {
  expect(() =>
    validateChartData(
      "pie",
      [
        {
          identityName: "A",
          points: [{ y: 1 }],
        },
        {
          identityName: "B",
          points: [{ y: 1 }],
        },
      ],
      ["One"],
    ),
  ).toThrow("exactly one dataset");
});

it("preserves numeric series labels", () => {
  const data = createSeriesModel(
    "line",
    {
      labels: [1],
      datasets: [
        {
          values: [1],
        },
      ],
    },
    {},
  );
  expect(data.labels).toEqual([1]);
});

it("uses the empty-cell color for zero heatmap values", () => {
  const heatmap = createHeatmapModel("heatmap", { points: { "2026-01-01": 0 } }, {});
  const selection = heatmap.selectionFor({ kind: "cell", pointIndex: 0 });
  expect(selection.color).toBe("#E5E5EA");
});
