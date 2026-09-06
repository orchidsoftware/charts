import assert from "node:assert/strict";
import test from "node:test";

import {
  createSeriesModel,
  createCompositionModel,
  createHeatmapModel,
  createTimesheetModel,
} from "../src/core/ChartData.js";
import { formatValue, formatLabel, seriesContext } from "../src/support/presentation/Formatting.js";
import { formatNumber } from "../src/support/presentation/NumberFormatting.js";

test("reads series points without a browser", () => {
  assert.equal(typeof document, "undefined");
  const line = createSeriesModel(
    "line",
    {
      labels: ["A"],
      datasets: [
        {
          name: "Series",
          values: [2],
        },
      ],
    },
    {},
  );
  assert.deepEqual(line.pointAt(0), {
    index: 0,
    label: "A",
    values: [2],
  });
});

test("reads composition points without a browser", () => {
  assert.equal(typeof document, "undefined");
  const pie = createCompositionModel(
    "pie",
    {
      labels: ["Zero", "Visible"],
      datasets: [
        {
          values: [0, 2],
        },
      ],
    },
    {},
  );
  assert.equal(pie.pointFor({ kind: "point", datasetIndex: 0, pointIndex: 1 }).label, "Visible");
});

test("reads heatmap cells without a browser", () => {
  assert.equal(typeof document, "undefined");
  const heatmap = createHeatmapModel("heatmap", { points: { "2026-09-01": 3 } }, {});
  assert.equal(heatmap.pointAt(0).value, 3);
});

test("reads timesheet tasks without a browser", () => {
  assert.equal(typeof document, "undefined");
  const timesheet = createTimesheetModel(
    "timesheet",
    {
      tasks: [{ label: "Build", start: "2026-09-01", end: "2026-09-02" }],
    },
    {},
  );
  assert.equal(timesheet.pointAt(0).label, "Build");
});

test("formats numbers and defensive contexts without importing browser mechanisms", () => {
  const model = createSeriesModel(
    "line",
    {
      labels: ["A"],
      datasets: [
        {
          name: "Series",
          values: [2],
        },
      ],
    },
    {},
  );
  const context = { ...seriesContext(model, 0, 0), target: "tooltip" };
  const options = {
    type: "line",
    formatValue(value, details) {
      assert.equal(details.dataset, undefined);
      assert.equal(Object.isFrozen(details), true);
      assert.equal(Object.isFrozen(details.point), true);
      return `Value:${value}`;
    },
  };
  assert.equal(formatValue(options, 2, context), "Value:2");
  assert.equal(formatLabel(options, "A", context), "A");
  assert.equal(formatNumber(2), "2");
});
