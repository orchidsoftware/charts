import { beforeEach, describe, expect, it } from "vitest";

import { HeatmapChart, LineChart, MixedChart, ScatterChart, TimesheetChart } from "../src/index.js";

import "../src/styles.css";

function resetHost() {
  document.body.innerHTML = '<div id="chart" style="width: 640px"></div>';
}
function expectFailure(callback, message) {
  // eslint-disable-next-line security/detect-non-literal-regexp -- Expectations are fixed test-source strings.
  expect(callback).toThrow(new RegExp(message, "iu"));
}

describe("FluentUpdateValidation", () => {
  beforeEach(resetHost);
  describe("mounted update validation", () => {
    it("line accepts partial gradient updates", () => {
      const line = LineChart.make("#chart").dataset([1]).render();
      expect(
        line.update({
          labels: ["A"],
          datasets: [
            {
              values: [1],
              gradient: {},
            },
          ],
        }),
      ).toBe(line);
      expect(
        line.update({
          labels: ["A"],
          datasets: [
            {
              values: [1],
              gradient: { fromOpacity: 0.5 },
            },
          ],
        }),
      ).toBe(line);
    });
    it.each([
      ["line: Chart data must be an object (1)", null, "Chart data must be an object"],
      [
        "line: Dataset name (2)",
        {
          labels: ["A"],
          datasets: [
            {
              name: " ",
              values: [1],
            },
          ],
        },
        "Dataset name",
      ],
      [
        "line: formatValue (3)",
        {
          labels: ["A"],
          datasets: [
            {
              values: [1],
              formatValue: "x",
            },
          ],
        },
        "formatValue",
      ],
      [
        "line: opacity (4)",
        {
          labels: ["A"],
          datasets: [
            {
              values: [1],
              opacity: 2,
            },
          ],
        },
        "opacity",
      ],
      [
        "line: smooth (5)",
        {
          labels: ["A"],
          datasets: [
            {
              values: [1],
              smooth: "yes",
            },
          ],
        },
        "smooth",
      ],
      [
        "line: dotSize (6)",
        {
          labels: ["A"],
          datasets: [
            {
              values: [1],
              dotSize: -1,
            },
          ],
        },
        "dotSize",
      ],
      [
        "line: gradient (7)",
        {
          labels: ["A"],
          datasets: [
            {
              values: [1],
              gradient: [],
            },
          ],
        },
        "gradient",
      ],
      [
        "line: Unsupported gradient option (8)",
        {
          labels: ["A"],
          datasets: [
            {
              values: [1],
              gradient: { unknown: 1 },
            },
          ],
        },
        "Unsupported gradient option",
      ],
      [
        "line: Gradient opacity (9)",
        {
          labels: ["A"],
          datasets: [
            {
              values: [1],
              gradient: { fromOpacity: 2 },
            },
          ],
        },
        "Gradient opacity",
      ],
      [
        "line: Gradient opacity (10)",
        {
          labels: ["A"],
          datasets: [
            {
              values: [1],
              gradient: { fromOpacity: -1 },
            },
          ],
        },
        "Gradient opacity",
      ],
      [
        "line: Gradient opacity (11)",
        {
          labels: ["A"],
          datasets: [
            {
              values: [1],
              gradient: { fromOpacity: NaN },
            },
          ],
        },
        "Gradient opacity",
      ],
      [
        "line: Chart labels (12)",
        {
          labels: [""],
          datasets: [
            {
              values: [1],
            },
          ],
        },
        "Chart labels",
      ],
      [
        "line: Chart labels must be an array (13)",
        {
          labels: "A",
          datasets: [
            {
              values: [1],
            },
          ],
        },
        "Chart labels must be an array",
      ],
      [
        "line: Unsupported chart data key (14)",
        {
          labels: ["A"],
          datasets: [
            {
              values: [1],
            },
          ],
          unknown: true,
        },
        "Unsupported chart data key",
      ],
    ])("%s", (_name, data, message) => {
      const line = LineChart.make("#chart").dataset([1]).render();
      expectFailure(() => line.update(data), message);
      expect(line.element.isConnected).toBe(true);
    });
    it("line rejects invalid point indexes and download paths", () => {
      const line = LineChart.make("#chart").dataset([1]).render();
      expectFailure(() => line.point(-1), "non-negative integer");
      expectFailure(() => line.download("../chart"), "path separators");
    });
    it("mixed rejects invalid updates", () => {
      const mixed = MixedChart.make("#chart").line("A", [1]).render();
      expectFailure(
        () =>
          mixed.update({
            labels: ["A"],
            datasets: [
              {
                chartType: "area",
                name: "A",
                values: [1],
              },
            ],
          }),
        "chartType",
      );
      mixed.destroy();
    });
    it("scatter rejects invalid updates", () => {
      const scatter = ScatterChart.make("#chart")
        .dataset([{ x: 1, y: 2 }])
        .render();
      expectFailure(
        () =>
          scatter.update({
            datasets: [
              {
                values: [[]],
              },
            ],
          }),
        "points must be objects",
      );
      scatter.destroy();
    });
    it.each([
      ["heatmap: at least one (1)", { points: null }, "at least one"],
      ["heatmap: Invalid heatmap date (2)", { points: { 10: 1 } }, "Invalid heatmap date"],
      ["heatmap: Invalid heatmap date (3)", { points: { "-2000000000": 1 } }, "Invalid heatmap date"],
      [
        "heatmap: both start and end (4)",
        { points: { "2026-01-02": 1 }, start: "2026-01-01" },
        "both start and end",
      ],
      [
        "heatmap: contain every point (5)",
        { points: { "2026-01-02": 1 }, start: "2026-01-03", end: "2026-01-04" },
        "contain every point",
      ],
      [
        "heatmap: Unsupported heatmap data key (6)",
        { points: { "2026-01-02": 1 }, unknown: true },
        "Unsupported heatmap data key",
      ],
    ])("%s", (_name, data, message) => {
      const heatmap = HeatmapChart.make("#chart").points({ "2026-01-02": 1 }).render();
      expectFailure(() => heatmap.update(data), message);
      expect(heatmap.element.isConnected).toBe(true);
    });
    it.each([
      [
        "timesheet: task label (1)",
        {
          tasks: [{ label: "", start: "2026-01-01", end: "2026-01-02" }],
        },
        "task label",
      ],
      [
        "timesheet: task group (2)",
        {
          tasks: [{ label: "A", group: "", start: "2026-01-01", end: "2026-01-02" }],
        },
        "task group",
      ],
      [
        "timesheet: valid date (3)",
        {
          tasks: [{ label: "A", start: new Date(NaN), end: "2026-01-02" }],
        },
        "valid date",
      ],
      [
        "timesheet: timezone (5)",
        {
          tasks: [{ label: "A", start: "2026-01-01T00:00:00+aa:bb", end: "2026-01-02T00:00:00Z" }],
        },
        "timezone",
      ],
    ])("%s", (_name, data, message) => {
      const timesheet = TimesheetChart.make("#chart").task("A", "2026-01-01", "2026-01-02").render();
      expectFailure(() => timesheet.update(data), message);
      expect(timesheet.element.isConnected).toBe(true);
    });
  });
});

it("accepts explicit timezone offsets when updating timesheet tasks", () => {
  const chart = TimesheetChart.make("#chart").task("A", "2026-01-01", "2026-01-02").render();
  expect(
    chart.update({
      tasks: [{ label: "A", start: "2026-01-01T00:00:00+03:00", end: "2026-01-02T00:00:00+03:00" }],
    }),
  ).toBe(chart);
});
