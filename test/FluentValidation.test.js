import { beforeEach, describe, expect, it } from "vitest";

import {
  BarChart,
  BubbleChart,
  HeatmapChart,
  LineChart,
  MixedChart,
  PieChart,
  RadarChart,
  ScatterChart,
  TimesheetChart,
} from "../src/index.js";

import "../src/styles.css";

function resetHost() {
  document.body.innerHTML = '<div id="chart" style="width: 640px"></div>';
}
function expectFailure(callback, message) {
  // eslint-disable-next-line security/detect-non-literal-regexp -- Expectations are fixed test-source strings.
  expect(callback).toThrow(new RegExp(message, "iu"));
}

describe("Fluent Validation", () => {
  beforeEach(resetHost);
  describe("rejects every independently invalid chart-level value", () => {
    it.each([
      [
        'LineChart.make("#chart").title(" ") [1]',
        () => LineChart.make("#chart").title(" "),
        "title",
      ],
      [
        'LineChart.make("#chart").height(NaN) [2]',
        () => LineChart.make("#chart").height(NaN),
        "height",
      ],
      [
        'LineChart.make("#chart").strokeWidth(-1) [3]',
        () => LineChart.make("#chart").strokeWidth(-1),
        "strokeWidth",
      ],
      [
        'LineChart.make("#chart").tooltip("yes") [4]',
        () => LineChart.make("#chart").tooltip("yes"),
        "tooltip",
      ],
      [
        'LineChart.make("#chart").onSelect(null) [5]',
        () => LineChart.make("#chart").onSelect(null),
        "onSelect",
      ],
      [
        'LineChart.make("#chart").colors("red") [6]',
        () => LineChart.make("#chart").colors("red"),
        "colors",
      ],
      [
        'LineChart.make("#chart").colors([ " ", ]) [7]',
        () =>
          LineChart.make("#chart").colors([
            " ",
          ]),
        "color",
      ],
      [
        'LineChart.make("#chart").labels("A") [8]',
        () => LineChart.make("#chart").labels("A"),
        "labels",
      ],
      [
        'LineChart.make("#chart").gradient(null) [9]',
        () => LineChart.make("#chart").gradient(null),
        "gradient",
      ],
      [
        'LineChart.make("#chart").gradient({ unknown: 1 }) [10]',
        () => LineChart.make("#chart").gradient({ unknown: 1 }),
        "Unsupported gradient option",
      ],
      [
        'LineChart.make("#chart").gradient({ fromOpacity: -1 }) [11]',
        () => LineChart.make("#chart").gradient({ fromOpacity: -1 }),
        "at least 0",
      ],
      [
        'PieChart.make("#chart").startAngle(NaN) [12]',
        () => PieChart.make("#chart").startAngle(NaN),
        "startAngle",
      ],
      [
        'PieChart.make("#chart").padAngle(-1) [13]',
        () => PieChart.make("#chart").padAngle(-1),
        "padAngle",
      ],
      [
        'PieChart.make("#chart").padAngle(NaN) [14]',
        () => PieChart.make("#chart").padAngle(NaN),
        "padAngle",
      ],
      [
        'PieChart.make("#chart").cornerRadius(-1) [15]',
        () => PieChart.make("#chart").cornerRadius(-1),
        "cornerRadius",
      ],
      [
        'BarChart.make("#chart").horizontal("yes") [16]',
        () => BarChart.make("#chart").horizontal("yes"),
        "horizontal",
      ],
      [
        'TimesheetChart.make("#chart").task("A", 1, 2, 3) [17]',
        () => TimesheetChart.make("#chart").task("A", 1, 2, 3),
        "task accepts",
      ],
      [
        'TimesheetChart.make("#chart").task(null) [18]',
        () => TimesheetChart.make("#chart").task(null),
        "task must be",
      ],
      [
        'TimesheetChart.make("#chart").task({ label: "A", start: 1, end: 2, unknown: true }) [19]',
        () => TimesheetChart.make("#chart").task({ label: "A", start: 1, end: 2, unknown: true }),
        "Unsupported task key",
      ],
      [
        'TimesheetChart.make("#chart").task({ label: "A", start: 1, end: 2, group: " " }) [20]',
        () => TimesheetChart.make("#chart").task({ label: "A", start: 1, end: 2, group: " " }),
        "task group",
      ],
      [
        'HeatmapChart.make("#chart").points(null) [21]',
        () => HeatmapChart.make("#chart").points(null),
        "at least one",
      ],
      [
        'HeatmapChart.make("#chart").points([]) [22]',
        () => HeatmapChart.make("#chart").points([]),
        "at least one",
      ],
      [
        'HeatmapChart.make("#chart").points({ "2026-01-01": NaN }) [23]',
        () => HeatmapChart.make("#chart").points({ "2026-01-01": NaN }),
        "finite",
      ],
    ])("%s", (_name, callback, message) => {
      expectFailure(callback, message);
    });
  });
  describe("rejects invalid datasets and scene-level combinations before mounting", () => {
    it.each([
      [
        'LineChart.make("#missing").render() [1]',
        () => LineChart.make("#missing").render(),
        "at least one dataset",
      ],
      [
        'LineChart.make("#missing").dataset(null).render() [2]',
        () => LineChart.make("#missing").dataset(null).render(),
        "dataset must be",
      ],
      [
        'LineChart.make("#missing") .dataset({ values: [ 1, ], unknown: true, }) .render() [3]',
        () =>
          LineChart.make("#missing")
            .dataset({
              values: [
                1,
              ],
              unknown: true,
            })
            .render(),
        "Unsupported dataset key",
      ],
      [
        'LineChart.make("#missing").dataset([]).render() [4]',
        () => LineChart.make("#missing").dataset([]).render(),
        "non-empty array",
      ],
      [
        'LineChart.make("#missing") .dataset( " ", [ 1, ], ) .render() [5]',
        () =>
          LineChart.make("#missing")
            .dataset(
              " ",
              [
                1,
              ],
            )
            .render(),
        "dataset name",
      ],
      [
        'LineChart.make("#missing") .dataset([ NaN, ]) .render() [6]',
        () =>
          LineChart.make("#missing")
            .dataset([
              NaN,
            ])
            .render(),
        "must be finite",
      ],
      [
        'RadarChart.make("#missing") .dataset([ -1, ]) .render() [7]',
        () =>
          RadarChart.make("#missing")
            .dataset([
              -1,
            ])
            .render(),
        "non-negative",
      ],
      [
        'ScatterChart.make("#missing") .dataset([ null, ]) .render() [8]',
        () =>
          ScatterChart.make("#missing")
            .dataset([
              null,
            ])
            .render(),
        "points must be objects",
      ],
      [
        'ScatterChart.make("#missing") .dataset([ { x: 1, y: NaN }, ]) .render() [9]',
        () =>
          ScatterChart.make("#missing")
            .dataset([
              { x: 1, y: NaN },
            ])
            .render(),
        "finite x and y",
      ],
      [
        'BubbleChart.make("#missing") .dataset([ { x: 1, y: 2, r: -1 }, ]) .render() [10]',
        () =>
          BubbleChart.make("#missing")
            .dataset([
              { x: 1, y: 2, r: -1 },
            ])
            .render(),
        "non-negative r",
      ],
      [
        'LineChart.make("#missing") .dataset( "A", [ 1, ], ) .dataset( "B", [ 1, 2, ], ) .render() [11]',
        () =>
          LineChart.make("#missing")
            .dataset(
              "A",
              [
                1,
              ],
            )
            .dataset(
              "B",
              [
                1,
                2,
              ],
            )
            .render(),
        "labels length",
      ],
      [
        'LineChart.make("#missing") .labels([ "A", ]) .dataset([ 1, 2, ]) .render() [12]',
        () =>
          LineChart.make("#missing")
            .labels([
              "A",
            ])
            .dataset([
              1,
              2,
            ])
            .render(),
        "labels length",
      ],
      [
        'PieChart.make("#missing") .dataset([ 0, 0, ]) .render() [13]',
        () =>
          PieChart.make("#missing")
            .dataset([
              0,
              0,
            ])
            .render(),
        "positive value",
      ],
      [
        'MixedChart.make("#missing").dataset({ chartType: "area", values: [ 1, ], }) [14]',
        () =>
          MixedChart.make("#missing").dataset({
            chartType: "area",
            values: [
              1,
            ],
          }),
        "chartType",
      ],
    ])("%s", (_name, callback, message) => {
      expectFailure(callback, message);
    });
  });
  describe("rejects invalid scoped values and always expires scopes after callback failure", () => {
    it("expires the scope when its callback throws", () => {
      let failedScope;
      expectFailure(
        () =>
          LineChart.make("#chart").dataset(
            [
              1,
            ],
            (dataset) => {
              failedScope = dataset;
              throw new Error("callback failed");
            },
          ),
        "callback failed",
      );
      expectFailure(() => failedScope.color("red"), "Dataset scope has expired");
    });
    it.each([
      [
        'LineChart.make("#chart").dataset( [ 1, ], (dataset) => dataset.color(" "), ) [1]',
        () =>
          LineChart.make("#chart").dataset(
            [
              1,
            ],
            (dataset) => dataset.color(" "),
          ),
        "color",
      ],
      [
        'LineChart.make("#chart").dataset( [ 1, ], (dataset) => dataset.opacity(2), ) [2]',
        () =>
          LineChart.make("#chart").dataset(
            [
              1,
            ],
            (dataset) => dataset.opacity(2),
          ),
        "opacity",
      ],
      [
        'LineChart.make("#chart").dataset( [ 1, ], (dataset) => dataset.opacity(NaN), ) [3]',
        () =>
          LineChart.make("#chart").dataset(
            [
              1,
            ],
            (dataset) => dataset.opacity(NaN),
          ),
        "opacity",
      ],
      [
        'LineChart.make("#chart").dataset( [ 1, ], (dataset) => dataset.dots("yes"), ) [4]',
        () =>
          LineChart.make("#chart").dataset(
            [
              1,
            ],
            (dataset) => dataset.dots("yes"),
          ),
        "dots",
      ],
      [
        'LineChart.make("#chart").dataset( [ 1, ], (dataset) => dataset.formatValue(null), ) [5]',
        () =>
          LineChart.make("#chart").dataset(
            [
              1,
            ],
            (dataset) => dataset.formatValue(null),
          ),
        "formatValue",
      ],
      [
        'LineChart.make("#chart").dataset( [ 1, ], (dataset) => dataset.gradient([]), ) [6]',
        () =>
          LineChart.make("#chart").dataset(
            [
              1,
            ],
            (dataset) => dataset.gradient([]),
          ),
        "gradient",
      ],
      [
        'LineChart.make("#chart").yAxis((axis) => axis.position("middle")) [7]',
        () => LineChart.make("#chart").yAxis((axis) => axis.position("middle")),
        "position",
      ],
      [
        'LineChart.make("#chart").marker("A", 1, (marker) => marker.width(-1)) [8]',
        () => LineChart.make("#chart").marker("A", 1, (marker) => marker.width(-1)),
        "width",
      ],
      [
        'LineChart.make("#chart").marker("A", 1, (marker) => marker.lineStyle("dash")) [9]',
        () => LineChart.make("#chart").marker("A", 1, (marker) => marker.lineStyle("dash")),
        "lineStyle",
      ],
      [
        'LineChart.make("#chart").marker("A", 1, (marker) => marker.labelPosition("middle")) [10]',
        () => LineChart.make("#chart").marker("A", 1, (marker) => marker.labelPosition("middle")),
        "labelPosition",
      ],
      [
        'LineChart.make("#chart").marker("A", 1, (marker) => marker.dash([])) [11]',
        () => LineChart.make("#chart").marker("A", 1, (marker) => marker.dash([])),
        "dash",
      ],
      [
        'LineChart.make("#chart").marker("A", 1, (marker) => marker.dash([ 0, 0, ]), ) [12]',
        () =>
          LineChart.make("#chart").marker("A", 1, (marker) =>
            marker.dash([
              0,
              0,
            ]),
          ),
        "dash values",
      ],
      [
        'HeatmapChart.make("#chart").tooltip((tooltip) => tooltip.formatDate(null)) [13]',
        () => HeatmapChart.make("#chart").tooltip((tooltip) => tooltip.formatDate(null)),
        "formatDate",
      ],
    ])("%s", (_name, callback, message) => {
      expectFailure(callback, message);
    });
  });
  describe("rejects malformed advanced annotations at render time", () => {
    it.each([
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .marker(null) .render() [1]',
        () =>
          LineChart.make("#missing")
            .dataset([
              1,
            ])
            .marker(null)
            .render(),
        "marker must be",
      ],
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .marker({ label: "A", value: 1, unknown: true }) .render() [2]',
        () =>
          LineChart.make("#missing")
            .dataset([
              1,
            ])
            .marker({ label: "A", value: 1, unknown: true })
            .render(),
        "Unsupported marker key",
      ],
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .marker({ label: " ", value: 1 }) .render() [3]',
        () =>
          LineChart.make("#missing")
            .dataset([
              1,
            ])
            .marker({ label: " ", value: 1 })
            .render(),
        "marker label",
      ],
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .marker({ label: "A", value: NaN }) .render() [4]',
        () =>
          LineChart.make("#missing")
            .dataset([
              1,
            ])
            .marker({ label: "A", value: NaN })
            .render(),
        "marker value",
      ],
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .marker({ label: "A", value: 1, opacity: 2 }) .render() [5]',
        () =>
          LineChart.make("#missing")
            .dataset([
              1,
            ])
            .marker({ label: "A", value: 1, opacity: 2 })
            .render(),
        "marker opacity",
      ],
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .marker({ label: "A", value: 1, width: -1 }) .render() [6]',
        () =>
          LineChart.make("#missing")
            .dataset([
              1,
            ])
            .marker({ label: "A", value: 1, width: -1 })
            .render(),
        "marker width",
      ],
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .marker({ label: "A", value: 1, lineStyle: "x" }) .render() [7]',
        () =>
          LineChart.make("#missing")
            .dataset([
              1,
            ])
            .marker({ label: "A", value: 1, lineStyle: "x" })
            .render(),
        "lineStyle",
      ],
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .marker({ label: "A", value: 1, dash: [] }) .render() [8]',
        () =>
          LineChart.make("#missing")
            .dataset([
              1,
            ])
            .marker({ label: "A", value: 1, dash: [] })
            .render(),
        "marker dash",
      ],
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .region(null) .render() [9]',
        () =>
          LineChart.make("#missing")
            .dataset([
              1,
            ])
            .region(null)
            .render(),
        "region must be",
      ],
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .region({ label: "A", range: [ 1, 2, ], unknown: true, }) .render() [10]',
        () =>
          LineChart.make("#missing")
            .dataset([
              1,
            ])
            .region({
              label: "A",
              range: [
                1,
                2,
              ],
              unknown: true,
            })
            .render(),
        "Unsupported region key",
      ],
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .region({ label: "A", range: [ 1, ], }) .render() [11]',
        () =>
          LineChart.make("#missing")
            .dataset([
              1,
            ])
            .region({
              label: "A",
              range: [
                1,
              ],
            })
            .render(),
        "exactly two",
      ],
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .region({ label: "A", range: [ 1, 2, ], labelPosition: "x", }) .render() [12]',
        () =>
          LineChart.make("#missing")
            .dataset([
              1,
            ])
            .region({
              label: "A",
              range: [
                1,
                2,
              ],
              labelPosition: "x",
            })
            .render(),
        "labelPosition",
      ],
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .region({ label: "A", range: [ 1, 2, ], includeInDomain: "yes", }) .render() [13]',
        () =>
          LineChart.make("#missing")
            .dataset([
              1,
            ])
            .region({
              label: "A",
              range: [
                1,
                2,
              ],
              includeInDomain: "yes",
            })
            .render(),
        "includeInDomain",
      ],
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .region({ label: "A", range: [ 1, 2, ], formatLabel: "x", }) .render() [14]',
        () =>
          LineChart.make("#missing")
            .dataset([
              1,
            ])
            .region({
              label: "A",
              range: [
                1,
                2,
              ],
              formatLabel: "x",
            })
            .render(),
        "formatLabel",
      ],
    ])("%s", (_name, callback, message) => {
      expectFailure(callback, message);
    });
  });
  describe("mounted update validation", () => {
    it("line accepts partial gradient updates", () => {
      const line = LineChart.make("#chart")
        .dataset([
          1,
        ])
        .render();
      expect(
        line.update({
          labels: [
            "A",
          ],
          datasets: [
            {
              values: [
                1,
              ],
              gradient: {},
            },
          ],
        }),
      ).toBe(line);
      expect(
        line.update({
          labels: [
            "A",
          ],
          datasets: [
            {
              values: [
                1,
              ],
              gradient: { fromOpacity: 0.5 },
            },
          ],
        }),
      ).toBe(line);
    });
    it.each([
      [
        "line: Chart data must be an object (1)",
        null,
        "Chart data must be an object",
      ],
      [
        "line: Dataset name (2)",
        {
          labels: [
            "A",
          ],
          datasets: [
            {
              name: " ",
              values: [
                1,
              ],
            },
          ],
        },
        "Dataset name",
      ],
      [
        "line: formatValue (3)",
        {
          labels: [
            "A",
          ],
          datasets: [
            {
              values: [
                1,
              ],
              formatValue: "x",
            },
          ],
        },
        "formatValue",
      ],
      [
        "line: opacity (4)",
        {
          labels: [
            "A",
          ],
          datasets: [
            {
              values: [
                1,
              ],
              opacity: 2,
            },
          ],
        },
        "opacity",
      ],
      [
        "line: smooth (5)",
        {
          labels: [
            "A",
          ],
          datasets: [
            {
              values: [
                1,
              ],
              smooth: "yes",
            },
          ],
        },
        "smooth",
      ],
      [
        "line: dotSize (6)",
        {
          labels: [
            "A",
          ],
          datasets: [
            {
              values: [
                1,
              ],
              dotSize: -1,
            },
          ],
        },
        "dotSize",
      ],
      [
        "line: gradient (7)",
        {
          labels: [
            "A",
          ],
          datasets: [
            {
              values: [
                1,
              ],
              gradient: [],
            },
          ],
        },
        "gradient",
      ],
      [
        "line: Unsupported gradient option (8)",
        {
          labels: [
            "A",
          ],
          datasets: [
            {
              values: [
                1,
              ],
              gradient: { unknown: 1 },
            },
          ],
        },
        "Unsupported gradient option",
      ],
      [
        "line: Gradient opacity (9)",
        {
          labels: [
            "A",
          ],
          datasets: [
            {
              values: [
                1,
              ],
              gradient: { fromOpacity: 2 },
            },
          ],
        },
        "Gradient opacity",
      ],
      [
        "line: Gradient opacity (10)",
        {
          labels: [
            "A",
          ],
          datasets: [
            {
              values: [
                1,
              ],
              gradient: { fromOpacity: -1 },
            },
          ],
        },
        "Gradient opacity",
      ],
      [
        "line: Gradient opacity (11)",
        {
          labels: [
            "A",
          ],
          datasets: [
            {
              values: [
                1,
              ],
              gradient: { fromOpacity: NaN },
            },
          ],
        },
        "Gradient opacity",
      ],
      [
        "line: Chart labels (12)",
        {
          labels: [
            "",
          ],
          datasets: [
            {
              values: [
                1,
              ],
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
              values: [
                1,
              ],
            },
          ],
        },
        "Chart labels must be an array",
      ],
      [
        "line: Unsupported chart data key (14)",
        {
          labels: [
            "A",
          ],
          datasets: [
            {
              values: [
                1,
              ],
            },
          ],
          unknown: true,
        },
        "Unsupported chart data key",
      ],
    ])("%s", (_name, data, message) => {
      const line = LineChart.make("#chart")
        .dataset([
          1,
        ])
        .render();
      expectFailure(() => line.update(data), message);
      expect(line.element.isConnected).toBe(true);
    });
    it("line rejects invalid point indexes and download paths", () => {
      const line = LineChart.make("#chart")
        .dataset([
          1,
        ])
        .render();
      expectFailure(() => line.point(-1), "non-negative integer");
      expectFailure(() => line.download("../chart"), "path separators");
    });
    it("mixed rejects invalid updates", () => {
      const mixed = MixedChart.make("#chart")
        .line(
          "A",
          [
            1,
          ],
        )
        .render();
      expectFailure(
        () =>
          mixed.update({
            labels: [
              "A",
            ],
            datasets: [
              {
                chartType: "area",
                name: "A",
                values: [
                  1,
                ],
              },
            ],
          }),
        "chartType",
      );
      mixed.destroy();
    });
    it("scatter rejects invalid updates", () => {
      const scatter = ScatterChart.make("#chart")
        .dataset([
          { x: 1, y: 2 },
        ])
        .render();
      expectFailure(
        () =>
          scatter.update({
            datasets: [
              {
                values: [
                  [],
                ],
              },
            ],
          }),
        "points must be objects",
      );
      scatter.destroy();
    });
    it.each([
      [
        "heatmap: at least one (1)",
        { points: null },
        "at least one",
      ],
      [
        "heatmap: Invalid heatmap date (2)",
        { points: { 10: 1 } },
        "Invalid heatmap date",
      ],
      [
        "heatmap: Invalid heatmap date (3)",
        { points: { "-2000000000": 1 } },
        "Invalid heatmap date",
      ],
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
          tasks: [
            { label: "", start: "2026-01-01", end: "2026-01-02" },
          ],
        },
        "task label",
      ],
      [
        "timesheet: task group (2)",
        {
          tasks: [
            { label: "A", group: "", start: "2026-01-01", end: "2026-01-02" },
          ],
        },
        "task group",
      ],
      [
        "timesheet: valid date (3)",
        {
          tasks: [
            { label: "A", start: new Date(NaN), end: "2026-01-02" },
          ],
        },
        "valid date",
      ],
      [
        "timesheet: accepts timezone offset (4)",
        {
          tasks: [
            { label: "A", start: "2026-01-01T00:00:00+03:00", end: "2026-01-02T00:00:00+03:00" },
          ],
        },
        null,
      ],
      [
        "timesheet: timezone (5)",
        {
          tasks: [
            { label: "A", start: "2026-01-01T00:00:00+aa:bb", end: "2026-01-02T00:00:00Z" },
          ],
        },
        "timezone",
      ],
    ])("%s", (_name, data, message) => {
      const timesheet = TimesheetChart.make("#chart").task("A", "2026-01-01", "2026-01-02").render();
      if (!message) {
        expect(timesheet.update(data)).toBe(timesheet);
        return;
      }
      expectFailure(() => timesheet.update(data), message);
      expect(timesheet.element.isConnected).toBe(true);
    });
  });
});
