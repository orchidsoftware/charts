import { beforeEach, describe, expect, it } from "vitest";

import { HeatmapChart, LineChart } from "../src/index.js";

import "../src/styles.css";

function resetHost() {
  document.body.innerHTML = '<div id="chart" style="width: 640px"></div>';
}
function expectFailure(callback, message) {
  // eslint-disable-next-line security/detect-non-literal-regexp -- Expectations are fixed test-source strings.
  expect(callback).toThrow(new RegExp(message, "iu"));
}

describe("FluentScopeValidation", () => {
  beforeEach(resetHost);
  describe("rejects invalid scoped values and always expires scopes after callback failure", () => {
    it("expires the scope when its callback throws", () => {
      let failedScope;
      expectFailure(
        () =>
          LineChart.make("#chart").dataset([1], (dataset) => {
            failedScope = dataset;
            throw new Error("callback failed");
          }),
        "callback failed",
      );
      expectFailure(() => failedScope.color("red"), "Dataset scope has expired");
    });
    it.each([
      [
        'LineChart.make("#chart").dataset( [ 1, ], (dataset) => dataset.color(" "), ) [1]',
        () => LineChart.make("#chart").dataset([1], (dataset) => dataset.color(" ")),
        "color",
      ],
      [
        'LineChart.make("#chart").dataset( [ 1, ], (dataset) => dataset.opacity(2), ) [2]',
        () => LineChart.make("#chart").dataset([1], (dataset) => dataset.opacity(2)),
        "opacity",
      ],
      [
        'LineChart.make("#chart").dataset( [ 1, ], (dataset) => dataset.opacity(NaN), ) [3]',
        () => LineChart.make("#chart").dataset([1], (dataset) => dataset.opacity(NaN)),
        "opacity",
      ],
      [
        'LineChart.make("#chart").dataset( [ 1, ], (dataset) => dataset.dots("yes"), ) [4]',
        () => LineChart.make("#chart").dataset([1], (dataset) => dataset.dots("yes")),
        "dots",
      ],
      [
        'LineChart.make("#chart").dataset( [ 1, ], (dataset) => dataset.formatValue(null), ) [5]',
        () => LineChart.make("#chart").dataset([1], (dataset) => dataset.formatValue(null)),
        "formatValue",
      ],
      [
        'LineChart.make("#chart").dataset( [ 1, ], (dataset) => dataset.gradient([]), ) [6]',
        () => LineChart.make("#chart").dataset([1], (dataset) => dataset.gradient([])),
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
        () => LineChart.make("#chart").marker("A", 1, (marker) => marker.dash([0, 0])),
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
        () => LineChart.make("#missing").dataset([1]).marker(null).render(),
        "marker must be",
      ],
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .marker({ label: "A", value: 1, unknown: true }) .render() [2]',
        () =>
          LineChart.make("#missing").dataset([1]).marker({ label: "A", value: 1, unknown: true }).render(),
        "Unsupported marker key",
      ],
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .marker({ label: " ", value: 1 }) .render() [3]',
        () => LineChart.make("#missing").dataset([1]).marker({ label: " ", value: 1 }).render(),
        "marker label",
      ],
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .marker({ label: "A", value: NaN }) .render() [4]',
        () => LineChart.make("#missing").dataset([1]).marker({ label: "A", value: NaN }).render(),
        "marker value",
      ],
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .marker({ label: "A", value: 1, opacity: 2 }) .render() [5]',
        () => LineChart.make("#missing").dataset([1]).marker({ label: "A", value: 1, opacity: 2 }).render(),
        "marker opacity",
      ],
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .marker({ label: "A", value: 1, width: -1 }) .render() [6]',
        () => LineChart.make("#missing").dataset([1]).marker({ label: "A", value: 1, width: -1 }).render(),
        "marker width",
      ],
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .marker({ label: "A", value: 1, lineStyle: "x" }) .render() [7]',
        () =>
          LineChart.make("#missing").dataset([1]).marker({ label: "A", value: 1, lineStyle: "x" }).render(),
        "lineStyle",
      ],
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .marker({ label: "A", value: 1, dash: [] }) .render() [8]',
        () => LineChart.make("#missing").dataset([1]).marker({ label: "A", value: 1, dash: [] }).render(),
        "marker dash",
      ],
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .region(null) .render() [9]',
        () => LineChart.make("#missing").dataset([1]).region(null).render(),
        "region must be",
      ],
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .region({ label: "A", range: [ 1, 2, ], unknown: true, }) .render() [10]',
        () =>
          LineChart.make("#missing")
            .dataset([1])
            .region({
              label: "A",
              range: [1, 2],
              unknown: true,
            })
            .render(),
        "Unsupported region key",
      ],
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .region({ label: "A", range: [ 1, ], }) .render() [11]',
        () =>
          LineChart.make("#missing")
            .dataset([1])
            .region({
              label: "A",
              range: [1],
            })
            .render(),
        "exactly two",
      ],
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .region({ label: "A", range: [ 1, 2, ], labelPosition: "x", }) .render() [12]',
        () =>
          LineChart.make("#missing")
            .dataset([1])
            .region({
              label: "A",
              range: [1, 2],
              labelPosition: "x",
            })
            .render(),
        "labelPosition",
      ],
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .region({ label: "A", range: [ 1, 2, ], includeInDomain: "yes", }) .render() [13]',
        () =>
          LineChart.make("#missing")
            .dataset([1])
            .region({
              label: "A",
              range: [1, 2],
              includeInDomain: "yes",
            })
            .render(),
        "includeInDomain",
      ],
      [
        'LineChart.make("#missing") .dataset([ 1, ]) .region({ label: "A", range: [ 1, 2, ], formatLabel: "x", }) .render() [14]',
        () =>
          LineChart.make("#missing")
            .dataset([1])
            .region({
              label: "A",
              range: [1, 2],
              formatLabel: "x",
            })
            .render(),
        "formatLabel",
      ],
    ])("%s", (_name, callback, message) => {
      expectFailure(callback, message);
    });
  });
});
