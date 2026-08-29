import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  BarChart,
  BubbleChart,
  DonutChart,
  HeatmapChart,
  LineChart,
  MixedChart,
  PercentageChart,
  PieChart,
  PolarAreaChart,
  RadarChart,
  ScatterChart,
  TimesheetChart,
} from "../src/index.js";
import "../src/styles.css";
import Composition from "../src/renderers/Composition.js";
import { intensityLevel } from "../src/renderers/HeatmapRenderer.js";
import { linePath } from "../src/support/CartesianGeometry.js";
import { wrappedLabelElement } from "../src/support/Dom.js";
import { formatterText } from "../src/support/Formatting.js";
import { normalizePoint, validateChartData } from "../src/support/Normalize.js";
import { datasetSummary } from "../src/support/Presentation.js";
import { roundedSectorPath } from "../src/support/SectorGeometry.js";

function resetHost() {
  document.body.innerHTML = '<div id="chart" style="width: 640px"></div>';
}

function expectFailure(callback, message) {
  // eslint-disable-next-line security/detect-non-literal-regexp -- Expectations are fixed test-source strings.
  expect(callback).toThrow(new RegExp(message, "iu"));
}

function datasetScopeMethod(scope, receiver) {
  return Object.getPrototypeOf(scope).formatValue.call(receiver, String);
}

function annotationScopeMethod(scope, receiver) {
  return Object.getPrototypeOf(scope).width.call(receiver, 1);
}

describe("complete fluent authoring surface", () => {
  beforeEach(resetHost);

  it("covers common, Cartesian, tooltip, axis, line, and annotation scopes", () => {
    let tooltipScope;
    let axisScope;
    let markerScope;
    let regionScope;
    const select = vi.fn();
    const chart = LineChart.make("#chart")
      .title("Revenue")
      .description("Monthly revenue")
      .ariaLabel("Revenue chart")
      .width(600)
      .height(280)
      .colors(["#123456", "#654321"])
      .legend(false)
      .axes(true)
      .grid(true)
      .valueLabels(true)
      .frameless(false)
      .formatLabel((label) => `L:${label}`)
      .formatValue((value) => `V:${value}`)
      .tooltip((tooltip) => {
        tooltipScope = tooltip;
        tooltip.formatLabel((label) => `T:${label}`).formatValue((value) => `TV:${value}`);
      })
      .yAxis((axis) => {
        axisScope = axis;
        axis.position("right").formatValue((value) => `A:${value}`);
      })
      .smooth(false)
      .dots(false)
      .dotSize(5)
      .line(true)
      .area(true)
      .gradient({ fromOpacity: 0.5, toOpacity: 0.1 })
      .strokeWidth(4)
      .marker("Goal", 8, (marker) => {
        markerScope = marker;
        marker
          .color("#ff0000")
          .opacity(0.7)
          .labelPosition("center")
          .labelColor("#00ff00")
          .includeInDomain(false)
          .formatLabel((label) => `M:${label}`)
          .width(2)
          .lineStyle("dotted")
          .dash([2, 3]);
      })
      .region("Band", [2, 6], (region) => {
        regionScope = region;
        region
          .color("#0000ff")
          .opacity(0.2)
          .labelPosition("start")
          .labelColor("#ffffff")
          .includeInDomain(true)
          .formatLabel((label) => `R:${label}`);
      })
      .labels(["A", "B"])
      .dataset("Primary", [3, 7], (dataset) =>
        dataset
          .color("#abcdef")
          .opacity(0.8)
          .formatValue((value) => `D:${value}`)
          .gradient(false)
          .smooth(true)
          .dots(true)
          .dotSize(6)
          .line(true)
          .area(false)
          .strokeWidth(3),
      )
      .onSelect(select)
      .render();

    expect(chart.element.getAttribute("aria-label")).toBe("Revenue chart");
    expect(chart.element.getAttribute("viewBox")).toBe("0 0 600 280");
    expect(
      [...chart.element.querySelectorAll(".charts2-annotation")].map((node) => node.textContent),
    ).toEqual(["R:Band", "M:Goal"]);
    expectFailure(() => tooltipScope.formatValue(String), "Tooltip scope has expired");
    expectFailure(() => axisScope.position("left"), "Y-axis scope has expired");
    expectFailure(() => markerScope.width(1), "Marker scope has expired");
    expectFailure(() => regionScope.opacity(1), "Region scope has expired");
    expectFailure(() => datasetScopeMethod(tooltipScope, {}), "Builder scope has expired");
    expectFailure(() => annotationScopeMethod(markerScope, {}), "Annotation scope has expired");
  });

  it("covers bar, scatter, bubble, and every mixed dataset grammar", () => {
    const bar = BarChart.make("#chart")
      .labels(["A", "B"])
      .horizontal(false)
      .stacked(false)
      .radius(3)
      .dataset("Bars", [2, 4], "#123456")
      .render();
    expect(bar.element.querySelectorAll(".charts2-bar")).toHaveLength(2);
    bar.destroy();

    resetHost();
    const scatter = ScatterChart.make("#chart")
      .dots(true)
      .dataset("Points", [{ x: 1, y: 2 }], (dataset) => dataset.color("#234567").opacity(0.6))
      .render();
    expect(scatter.point(0).x).toBe(1);
    scatter.destroy();

    resetHost();
    const bubble = BubbleChart.make("#chart")
      .dataset({ name: "Bubbles", values: [{ x: 1, y: 2, r: 3 }], color: "#345678" })
      .render();
    expect(bubble.point(0).r).toBe(3);
    bubble.destroy();

    resetHost();
    const mixed = MixedChart.make("#chart")
      .labels(["A", "B"])
      .gradient(false)
      .line("Line", [2, 3], (dataset) => dataset.smooth(false))
      .bar("Bar", [1, 2], (dataset) => dataset.radius(4))
      .scatter("Scatter", [3, 4], (dataset) => dataset.opacity(0.5))
      .dataset({ chartType: "line", name: "Advanced", values: [4, 5] }, (dataset) => dataset.line(false))
      .render();
    expect(mixed.element.querySelectorAll(".charts2-mark").length).toBeGreaterThan(0);
  });

  it("covers all composition and radial presentation methods", () => {
    const renderers = [
      () =>
        PieChart.make("#chart")
          .labels(["A", "B", "C"])
          .dataset([1, 2, 3], "#123456")
          .maxSlices(2)
          .startAngle(-90)
          .padAngle(2)
          .cornerRadius(3)
          .render(),
      () =>
        DonutChart.make("#chart")
          .labels(["A", "B"])
          .dataset({ values: [1, 2], color: "#234567" }, (dataset) => dataset.opacity(0.7))
          .startAngle(450)
          .padAngle(1)
          .cornerRadius(2)
          .render(),
      () => PercentageChart.make("#chart").labels(["A", "B"]).dataset([1, 2]).maxSlices(2).radius(5).render(),
      () =>
        PolarAreaChart.make("#chart").labels(["A", "B"]).dataset([1, 2]).padAngle(3).cornerRadius(4).render(),
      () => RadarChart.make("#chart").labels(["A", "B", "C"]).dataset([1, 2, 3]).strokeWidth(2).render(),
    ];

    for (const render of renderers) {
      resetHost();
      const chart = render();
      expect(chart.element.querySelector(".charts2-mark")).not.toBeNull();
      chart.destroy();
    }
  });

  it("covers heatmap and timesheet ranges, presentation, and temporal tooltip scopes", () => {
    let heatmapScope;
    const heatmap = HeatmapChart.make("#chart")
      .range("2026-01-01", "2026-01-03")
      .points({ "2026-01-01": 2, "2026-01-03": 4 })
      .countLabel("commits")
      .radius(2)
      .tooltip((tooltip) => {
        heatmapScope = tooltip;
        tooltip.formatDate(() => "date").formatValue((value) => `${value} commits`);
      })
      .render();
    expect(heatmap.element.querySelector(".charts2-mark")).not.toBeNull();
    expectFailure(() => heatmapScope.formatDate(String), "Heatmap tooltip scope has expired");
    expectFailure(() => heatmapScope.formatDate.call({}, String), "Tooltip scope has expired");
    heatmap.destroy();

    resetHost();
    let timesheetScope;
    const timesheet = TimesheetChart.make("#chart")
      .range("2026-01-01", "2026-01-08")
      .task("Design", "2026-01-01", "2026-01-03")
      .task({ label: "Build", start: "2026-01-03", end: "2026-01-06", group: "Product", color: "#123456" })
      .axes(false)
      .grid(false)
      .valueLabels(false)
      .formatDate(() => "day")
      .formatDuration(() => "duration")
      .formatTick(() => "tick")
      .radius(4)
      .tooltip((tooltip) => {
        timesheetScope = tooltip;
        tooltip.formatDate(() => "tooltip date").formatDuration(() => "tooltip duration");
      })
      .render();
    expect(timesheet.element.querySelectorAll(".charts2-mark")).toHaveLength(2);
    expectFailure(() => timesheetScope.formatDuration(String), "Timesheet tooltip scope has expired");
  });

  it("covers explicit temporal tooltip switches and positional annotation colors", () => {
    const chart = LineChart.make("#chart")
      .dataset([1, 2])
      .frameless()
      .marker("Goal", 2, "#ff0000")
      .region("Band", [0, 1], "#00ff00")
      .render();
    expect(chart.element.querySelector(".charts2-marker").getAttribute("stroke")).toBe("#ff0000");
    chart.destroy();

    resetHost();
    const heatmap = HeatmapChart.make("#chart").points({ "2026-01-01": 1 }).tooltip(false).render();
    expect(heatmap.element.querySelector(".charts2-mark")).not.toBeNull();
    heatmap.destroy();

    resetHost();
    const timesheet = TimesheetChart.make("#chart")
      .task("Task", "2026-01-01", "2026-01-02")
      .tooltip(false)
      .render();
    expect(timesheet.element.querySelector(".charts2-mark")).not.toBeNull();
  });

  it("covers independently optional tooltip formatters and vertical multiline labels", () => {
    const line = LineChart.make("#chart")
      .labels(["A"])
      .dataset([1])
      .formatLabel(() => ["First", "Second"])
      .tooltip((tooltip) => tooltip.formatLabel((label) => `Tooltip ${label}`))
      .render();
    expect([...line.element.querySelectorAll(".charts2-label")].at(-1).textContent).toBe("First Second");
    line.destroy();

    resetHost();
    const heatmap = HeatmapChart.make("#chart")
      .points({ "2026-01-01": 1 })
      .tooltip((tooltip) => tooltip.formatDate(() => "Only date"))
      .render();
    expect(heatmap.element.querySelector(".charts2-mark")).not.toBeNull();
    heatmap.destroy();

    for (const configure of [
      (tooltip) => tooltip.formatDate(() => "Only date"),
      (tooltip) => tooltip.formatDuration(() => "Only duration"),
    ]) {
      resetHost();
      const timesheet = TimesheetChart.make("#chart")
        .task("Task", "2026-01-01", "2026-01-02")
        .tooltip(configure)
        .render();
      expect(timesheet.element.querySelector(".charts2-mark")).not.toBeNull();
      timesheet.destroy();
    }
  });

  it("covers scalar scatter labels, clipped annotations, zero heatmaps, and resize teardown", () => {
    let resizeCallback;
    const OriginalResizeObserver = ResizeObserver;
    class FakeResizeObserver {
      constructor(callback) {
        resizeCallback = callback;
      }

      observe() {}

      disconnect() {}
    }

    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    const line = LineChart.make("#chart")
      .dataset([0, 1])
      .marker("Outside", 100, (marker) => marker.includeInDomain(false))
      .region("Outside", [100, 200], (region) => region.includeInDomain(false))
      .region("Below", [-200, -100], (region) => region.includeInDomain(false))
      .gradient({ fromOpacity: 0.4 })
      .render();
    expect(line.element.querySelector(".charts2-marker")).toBeNull();
    expect(line.element.querySelector(".charts2-region")).toBeNull();
    resizeCallback();
    line.destroy();
    resizeCallback();
    vi.stubGlobal("ResizeObserver", null);
    resetHost();
    const fallback = LineChart.make("#chart").dataset([1, 2]).render();
    dispatchEvent(new Event("resize"));
    fallback.destroy();
    vi.stubGlobal("ResizeObserver", OriginalResizeObserver);

    resetHost();
    const scatter = ScatterChart.make("#chart").dataset([2]).render();
    expect(scatter.point(0).x).toBe(0);
    expect(scatter.point(9)).toBeUndefined();
    scatter.destroy();

    resetHost();
    const heatmap = HeatmapChart.make("#chart").points({ "2026-01-01": 0 }).render();
    expect(heatmap.point(0).value).toBe(0);
  });
});

describe("complete fluent boundary validation", () => {
  beforeEach(resetHost);

  it("rejects every independently invalid chart-level value", () => {
    const cases = [
      [() => LineChart.make("#chart").title(" "), "title"],
      [() => LineChart.make("#chart").height(NaN), "height"],
      [() => LineChart.make("#chart").strokeWidth(-1), "strokeWidth"],
      [() => LineChart.make("#chart").tooltip("yes"), "tooltip"],
      [() => LineChart.make("#chart").onSelect(null), "onSelect"],
      [() => LineChart.make("#chart").colors("red"), "colors"],
      [() => LineChart.make("#chart").colors([" "]), "color"],
      [() => LineChart.make("#chart").labels("A"), "labels"],
      [() => LineChart.make("#chart").gradient(null), "gradient"],
      [() => LineChart.make("#chart").gradient({ unknown: 1 }), "Unsupported gradient option"],
      [() => LineChart.make("#chart").gradient({ fromOpacity: -1 }), "at least 0"],
      [() => PieChart.make("#chart").startAngle(NaN), "startAngle"],
      [() => PieChart.make("#chart").padAngle(-1), "padAngle"],
      [() => PieChart.make("#chart").padAngle(NaN), "padAngle"],
      [() => PieChart.make("#chart").cornerRadius(-1), "cornerRadius"],
      [() => BarChart.make("#chart").horizontal("yes"), "horizontal"],
      [() => TimesheetChart.make("#chart").task("A", 1, 2, 3), "task accepts"],
      [() => TimesheetChart.make("#chart").task(null), "task must be"],
      [
        () => TimesheetChart.make("#chart").task({ label: "A", start: 1, end: 2, unknown: true }),
        "Unsupported task key",
      ],
      [() => TimesheetChart.make("#chart").task({ label: "A", start: 1, end: 2, group: " " }), "task group"],
      [() => HeatmapChart.make("#chart").points(null), "at least one"],
      [() => HeatmapChart.make("#chart").points([]), "at least one"],
      [() => HeatmapChart.make("#chart").points({ "2026-01-01": NaN }), "finite"],
    ];

    for (const [callback, message] of cases) {
      expectFailure(callback, message);
    }
  });

  it("rejects invalid datasets and scene-level combinations before mounting", () => {
    const cases = [
      [() => LineChart.make("#missing").render(), "at least one dataset"],
      [() => LineChart.make("#missing").dataset(null).render(), "dataset must be"],
      [
        () =>
          LineChart.make("#missing")
            .dataset({ values: [1], unknown: true })
            .render(),
        "Unsupported dataset key",
      ],
      [() => LineChart.make("#missing").dataset([]).render(), "non-empty array"],
      [() => LineChart.make("#missing").dataset(" ", [1]).render(), "dataset name"],
      [() => LineChart.make("#missing").dataset([NaN]).render(), "must be finite"],
      [() => RadarChart.make("#missing").dataset([-1]).render(), "non-negative"],
      [() => ScatterChart.make("#missing").dataset([null]).render(), "points must be objects"],
      [
        () =>
          ScatterChart.make("#missing")
            .dataset([{ x: 1, y: NaN }])
            .render(),
        "finite x and y",
      ],
      [
        () =>
          BubbleChart.make("#missing")
            .dataset([{ x: 1, y: 2, r: -1 }])
            .render(),
        "non-negative r",
      ],
      [() => LineChart.make("#missing").dataset("A", [1]).dataset("B", [1, 2]).render(), "labels length"],
      [() => LineChart.make("#missing").labels(["A"]).dataset([1, 2]).render(), "labels length"],
      [() => PieChart.make("#missing").dataset([0, 0]).render(), "positive value"],
      [() => MixedChart.make("#missing").dataset({ chartType: "area", values: [1] }), "chartType"],
    ];

    for (const [callback, message] of cases) {
      expectFailure(callback, message);
    }
  });

  it("rejects invalid scoped values and always expires scopes after callback failure", () => {
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

    const cases = [
      [() => LineChart.make("#chart").dataset([1], (dataset) => dataset.color(" ")), "color"],
      [() => LineChart.make("#chart").dataset([1], (dataset) => dataset.opacity(2)), "opacity"],
      [() => LineChart.make("#chart").dataset([1], (dataset) => dataset.opacity(NaN)), "opacity"],
      [() => LineChart.make("#chart").dataset([1], (dataset) => dataset.dots("yes")), "dots"],
      [() => LineChart.make("#chart").dataset([1], (dataset) => dataset.formatValue(null)), "formatValue"],
      [() => LineChart.make("#chart").dataset([1], (dataset) => dataset.gradient([])), "gradient"],
      [() => LineChart.make("#chart").yAxis((axis) => axis.position("middle")), "position"],
      [() => LineChart.make("#chart").marker("A", 1, (marker) => marker.width(-1)), "width"],
      [() => LineChart.make("#chart").marker("A", 1, (marker) => marker.lineStyle("dash")), "lineStyle"],
      [
        () => LineChart.make("#chart").marker("A", 1, (marker) => marker.labelPosition("middle")),
        "labelPosition",
      ],
      [() => LineChart.make("#chart").marker("A", 1, (marker) => marker.dash([])), "dash"],
      [() => LineChart.make("#chart").marker("A", 1, (marker) => marker.dash([0, 0])), "dash values"],
      [() => HeatmapChart.make("#chart").tooltip((tooltip) => tooltip.formatDate(null)), "formatDate"],
    ];

    for (const [callback, message] of cases) {
      expectFailure(callback, message);
    }
  });

  it("rejects malformed advanced annotations at render time", () => {
    const cases = [
      [() => LineChart.make("#missing").dataset([1]).marker(null).render(), "marker must be"],
      [
        () =>
          LineChart.make("#missing").dataset([1]).marker({ label: "A", value: 1, unknown: true }).render(),
        "Unsupported marker key",
      ],
      [
        () => LineChart.make("#missing").dataset([1]).marker({ label: " ", value: 1 }).render(),
        "marker label",
      ],
      [
        () => LineChart.make("#missing").dataset([1]).marker({ label: "A", value: NaN }).render(),
        "marker value",
      ],
      [
        () => LineChart.make("#missing").dataset([1]).marker({ label: "A", value: 1, opacity: 2 }).render(),
        "marker opacity",
      ],
      [
        () => LineChart.make("#missing").dataset([1]).marker({ label: "A", value: 1, width: -1 }).render(),
        "marker width",
      ],
      [
        () =>
          LineChart.make("#missing").dataset([1]).marker({ label: "A", value: 1, lineStyle: "x" }).render(),
        "lineStyle",
      ],
      [
        () => LineChart.make("#missing").dataset([1]).marker({ label: "A", value: 1, dash: [] }).render(),
        "marker dash",
      ],
      [() => LineChart.make("#missing").dataset([1]).region(null).render(), "region must be"],
      [
        () =>
          LineChart.make("#missing")
            .dataset([1])
            .region({ label: "A", range: [1, 2], unknown: true })
            .render(),
        "Unsupported region key",
      ],
      [
        () =>
          LineChart.make("#missing")
            .dataset([1])
            .region({ label: "A", range: [1] })
            .render(),
        "exactly two",
      ],
      [
        () =>
          LineChart.make("#missing")
            .dataset([1])
            .region({ label: "A", range: [1, 2], labelPosition: "x" })
            .render(),
        "labelPosition",
      ],
      [
        () =>
          LineChart.make("#missing")
            .dataset([1])
            .region({ label: "A", range: [1, 2], includeInDomain: "yes" })
            .render(),
        "includeInDomain",
      ],
      [
        () =>
          LineChart.make("#missing")
            .dataset([1])
            .region({ label: "A", range: [1, 2], formatLabel: "x" })
            .render(),
        "formatLabel",
      ],
    ];

    for (const [callback, message] of cases) {
      expectFailure(callback, message);
    }
  });

  it("rejects malformed update payloads through the mounted lifecycle boundary", () => {
    const line = LineChart.make("#chart").dataset([1]).render();
    expect(line.update({ labels: ["A"], datasets: [{ values: [1], gradient: {} }] })).toBe(line);
    expect(line.update({ labels: ["A"], datasets: [{ values: [1], gradient: { fromOpacity: 0.5 } }] })).toBe(
      line,
    );
    const lineCases = [
      [null, "Chart data must be an object"],
      [{ labels: ["A"], datasets: [{ name: " ", values: [1] }] }, "Dataset name"],
      [{ labels: ["A"], datasets: [{ values: [1], formatValue: "x" }] }, "formatValue"],
      [{ labels: ["A"], datasets: [{ values: [1], opacity: 2 }] }, "opacity"],
      [{ labels: ["A"], datasets: [{ values: [1], smooth: "yes" }] }, "smooth"],
      [{ labels: ["A"], datasets: [{ values: [1], dotSize: -1 }] }, "dotSize"],
      [{ labels: ["A"], datasets: [{ values: [1], gradient: [] }] }, "gradient"],
      [{ labels: ["A"], datasets: [{ values: [1], gradient: { unknown: 1 } }] }, "Unsupported gradient key"],
      [{ labels: ["A"], datasets: [{ values: [1], gradient: { fromOpacity: 2 } }] }, "Gradient opacity"],
      [{ labels: ["A"], datasets: [{ values: [1], gradient: { fromOpacity: -1 } }] }, "Gradient opacity"],
      [{ labels: ["A"], datasets: [{ values: [1], gradient: { fromOpacity: NaN } }] }, "Gradient opacity"],
      [{ labels: [""], datasets: [{ values: [1] }] }, "Chart labels"],
      [{ labels: "A", datasets: [{ values: [1] }] }, "Chart labels must be an array"],
      [{ labels: ["A"], datasets: [{ values: [1] }], unknown: true }, "Unsupported chart data key"],
    ];
    for (const [data, message] of lineCases) {
      expectFailure(() => line.update(data), message);
    }
    expectFailure(() => line.point(-1), "non-negative integer");
    expectFailure(() => line.download("../chart"), "path separators");
    line.destroy();

    resetHost();
    const mixed = MixedChart.make("#chart").line("A", [1]).render();
    expectFailure(
      () => mixed.update({ labels: ["A"], datasets: [{ chartType: "area", name: "A", values: [1] }] }),
      "chartType",
    );
    mixed.destroy();

    resetHost();
    const scatter = ScatterChart.make("#chart")
      .dataset([{ x: 1, y: 2 }])
      .render();
    expectFailure(() => scatter.update({ datasets: [{ values: [[]] }] }), "points must be objects");
    scatter.destroy();

    resetHost();
    const heatmap = HeatmapChart.make("#chart").points({ "2026-01-02": 1 }).render();
    const heatmapCases = [
      [{ points: null }, "at least one"],
      [{ points: { 10: 1 } }, "Invalid heatmap date"],
      [{ points: { "-2000000000": 1 } }, "Invalid heatmap date"],
      [{ points: { "2026-01-02": 1 }, start: "2026-01-01" }, "both start and end"],
      [{ points: { "2026-01-02": 1 }, start: "2026-01-03", end: "2026-01-04" }, "contain every point"],
      [{ points: { "2026-01-02": 1 }, unknown: true }, "Unsupported heatmap data key"],
    ];
    for (const [data, message] of heatmapCases) {
      expectFailure(() => heatmap.update(data), message);
    }
    heatmap.destroy();

    resetHost();
    const timesheet = TimesheetChart.make("#chart").task("A", "2026-01-01", "2026-01-02").render();
    const timesheetCases = [
      [{ tasks: [{ label: "", start: "2026-01-01", end: "2026-01-02" }] }, "task label"],
      [{ tasks: [{ label: "A", group: "", start: "2026-01-01", end: "2026-01-02" }] }, "task group"],
      [{ tasks: [{ label: "A", start: new Date(NaN), end: "2026-01-02" }] }, "valid date"],
      [
        { tasks: [{ label: "A", start: "2026-01-01T00:00:00+03:00", end: "2026-01-02T00:00:00+03:00" }] },
        null,
      ],
      [
        { tasks: [{ label: "A", start: "2026-01-01T00:00:00+aa:bb", end: "2026-01-02T00:00:00Z" }] },
        "timezone",
      ],
    ];
    for (const [data, message] of timesheetCases) {
      if (!message) {
        expect(timesheet.update(data)).toBe(timesheet);
        continue;
      }

      expectFailure(() => timesheet.update(data), message);
    }
  });

  it("validates CSS colors with variables and the style-parser fallback", () => {
    const OriginalCss = CSS;
    vi.stubGlobal("CSS");
    const chart = LineChart.make("#chart").dataset([1], "red").render();
    expect(chart.element.querySelector(".charts2-line").getAttribute("stroke")).toBe("red");
    expectFailure(
      () => chart.update({ labels: ["A"], datasets: [{ values: [1], color: "" }] }),
      "non-empty supported CSS color",
    );
    expectFailure(
      () => chart.update({ labels: ["A"], datasets: [{ values: [1], color: "definitely-not-a-color" }] }),
      "Unsupported CSS color",
    );
    expectFailure(
      () => chart.update({ labels: ["A"], datasets: [{ values: [1], color: "var(--missing-color)" }] }),
      "Unresolved CSS color variable",
    );
    vi.stubGlobal("CSS", OriginalCss);
  });

  it("unit-covers internal normalization and selection policies unreachable through valid marks", () => {
    expectFailure(() => normalizePoint(null, 0), "number or an object");
    expect(normalizePoint({ y: 2 }, 3).x).toBe(3);
    expectFailure(() => validateChartData("line", [{ points: [{ y: 1 }] }], "A"), "labels must be an array");
    expectFailure(
      () => validateChartData("radar", [{ points: [{ y: -1 }] }], ["A"]),
      "values must be non-negative",
    );

    expectFailure(
      () =>
        new Composition({
          labels: ["A"],
          datasets: [{ points: [{ y: 0 }] }],
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
    expect(intensityLevel(0, [0, 0], 5)).toBe(0);
    expect(intensityLevel(2, [2, 2], 5)).toBe(4);
    expect(
      linePath([
        { x: 2, y: 1 },
        { x: 1, y: 2 },
      ]),
    ).toBe("M2,1 L1,2");
    expectFailure(() => formatterText(1, "Value"), "Value formatter must return a string");

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
    expect(datasetSummary({ name: "A", points: [{ x: 5, y: 2 }] }, [])).toContain("5: 2");
  });
});
