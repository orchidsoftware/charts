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

describe("FluentValidation", () => {
  beforeEach(resetHost);
  describe("rejects every independently invalid chart-level value", () => {
    it.each([
      ['LineChart.make("#chart").title(" ") [1]', () => LineChart.make("#chart").title(" "), "title"],
      ['LineChart.make("#chart").height(NaN) [2]', () => LineChart.make("#chart").height(NaN), "height"],
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
      ['LineChart.make("#chart").colors("red") [6]', () => LineChart.make("#chart").colors("red"), "colors"],
      [
        'LineChart.make("#chart").colors([ " ", ]) [7]',
        () => LineChart.make("#chart").colors([" "]),
        "color",
      ],
      ['LineChart.make("#chart").labels("A") [8]', () => LineChart.make("#chart").labels("A"), "labels"],
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
      ['PieChart.make("#chart").padAngle(-1) [13]', () => PieChart.make("#chart").padAngle(-1), "padAngle"],
      ['PieChart.make("#chart").padAngle(NaN) [14]', () => PieChart.make("#chart").padAngle(NaN), "padAngle"],
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
              values: [1],
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
        () => LineChart.make("#missing").dataset(" ", [1]).render(),
        "dataset name",
      ],
      [
        'LineChart.make("#missing") .dataset([ NaN, ]) .render() [6]',
        () => LineChart.make("#missing").dataset([NaN]).render(),
        "must be finite",
      ],
      [
        'RadarChart.make("#missing") .dataset([ -1, ]) .render() [7]',
        () => RadarChart.make("#missing").dataset([-1]).render(),
        "non-negative",
      ],
      [
        'ScatterChart.make("#missing") .dataset([ null, ]) .render() [8]',
        () => ScatterChart.make("#missing").dataset([null]).render(),
        "points must be objects",
      ],
      [
        'ScatterChart.make("#missing") .dataset([ { x: 1, y: NaN }, ]) .render() [9]',
        () =>
          ScatterChart.make("#missing")
            .dataset([{ x: 1, y: NaN }])
            .render(),
        "finite x and y",
      ],
      [
        'BubbleChart.make("#missing") .dataset([ { x: 1, y: 2, r: -1 }, ]) .render() [10]',
        () =>
          BubbleChart.make("#missing")
            .dataset([{ x: 1, y: 2, r: -1 }])
            .render(),
        "non-negative r",
      ],
      [
        'LineChart.make("#missing") .dataset( "A", [ 1, ], ) .dataset( "B", [ 1, 2, ], ) .render() [11]',
        () => LineChart.make("#missing").dataset("A", [1]).dataset("B", [1, 2]).render(),
        "labels length",
      ],
      [
        'LineChart.make("#missing") .labels([ "A", ]) .dataset([ 1, 2, ]) .render() [12]',
        () => LineChart.make("#missing").labels(["A"]).dataset([1, 2]).render(),
        "labels length",
      ],
      [
        'PieChart.make("#missing") .dataset([ 0, 0, ]) .render() [13]',
        () => PieChart.make("#missing").dataset([0, 0]).render(),
        "positive value",
      ],
      [
        'MixedChart.make("#missing").dataset({ chartType: "area", values: [ 1, ], }) [14]',
        () =>
          MixedChart.make("#missing").dataset({
            chartType: "area",
            values: [1],
          }),
        "chartType",
      ],
    ])("%s", (_name, callback, message) => {
      expectFailure(callback, message);
    });
  });
});
