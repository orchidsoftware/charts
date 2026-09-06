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
      .colors([
        "#123456",
        "#654321",
      ])
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
          .dash([
            2,
            3,
          ]);
      })
      .region(
        "Band",
        [
          2,
          6,
        ],
        (region) => {
          regionScope = region;
          region
            .color("#0000ff")
            .opacity(0.2)
            .labelPosition("start")
            .labelColor("#ffffff")
            .includeInDomain(true)
            .formatLabel((label) => `R:${label}`);
        },
      )
      .labels([
        "A",
        "B",
      ])
      .dataset(
        "Primary",
        [
          3,
          7,
        ],
        (dataset) =>
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
      [
        ...chart.element.querySelectorAll(".orchid-charts-annotation"),
      ].map((node) => node.textContent),
    ).toEqual([
      "R:Band",
      "M:Goal",
    ]);
    expect(
      [
        ...chart.element.querySelectorAll(".orchid-charts-annotation"),
      ].every(
        (label) =>
          getComputedStyle(label).paintOrder === "stroke" && getComputedStyle(label).fontWeight === "500",
      ),
    ).toBe(true);
    expect(chart.element.querySelectorAll(".orchid-charts-annotation-background")).toHaveLength(0);
    expect(chart.element.querySelectorAll(".orchid-charts-annotation-sample")).toHaveLength(0);
    expectFailure(() => tooltipScope.formatValue(String), "Tooltip scope has expired");
    expectFailure(() => axisScope.position("left"), "Y-axis scope has expired");
    expectFailure(() => markerScope.width(1), "Marker scope has expired");
    expectFailure(() => regionScope.opacity(1), "Region scope has expired");
    expectFailure(() => datasetScopeMethod(tooltipScope, {}), "Builder scope has expired");
    expectFailure(() => annotationScopeMethod(markerScope, {}), "Builder scope has expired");
  });

  it("covers bar, scatter, bubble, and every mixed dataset grammar", () => {
    const bar = BarChart.make("#chart")
      .labels([
        "A",
        "B",
      ])
      .horizontal(false)
      .stacked(false)
      .radius(3)
      .dataset(
        "Bars",
        [
          2,
          4,
        ],
        "#123456",
      )
      .render();
    expect(bar.element.querySelectorAll(".orchid-charts-bar")).toHaveLength(2);
    bar.destroy();

    resetHost();
    const scatter = ScatterChart.make("#chart")
      .dots(true)
      .dataset(
        "Points",
        [
          { x: 1, y: 2 },
        ],
        (dataset) => dataset.color("#234567").opacity(0.6),
      )
      .render();
    expect(scatter.point(0).x).toBe(1);
    scatter.destroy();

    resetHost();
    const bubble = BubbleChart.make("#chart")
      .dataset({
        name: "Bubbles",
        values: [
          { x: 1, y: 2, r: 3 },
        ],
        color: "#345678",
      })
      .render();
    expect(bubble.point(0).r).toBe(3);
    bubble.destroy();

    resetHost();
    const mixed = MixedChart.make("#chart")
      .labels([
        "A",
        "B",
      ])
      .gradient(false)
      .line(
        "Line",
        [
          2,
          3,
        ],
        (dataset) => dataset.smooth(false),
      )
      .bar(
        "Bar",
        [
          1,
          2,
        ],
        (dataset) => dataset.radius(4),
      )
      .scatter(
        "Scatter",
        [
          3,
          4,
        ],
        (dataset) => dataset.opacity(0.5),
      )
      .dataset(
        {
          chartType: "line",
          name: "Advanced",
          values: [
            4,
            5,
          ],
        },
        (dataset) => dataset.line(false),
      )
      .render();
    expect(mixed.element.querySelectorAll(".orchid-charts-mark").length).toBeGreaterThan(0);
  });

  it("covers all composition and radial presentation methods", () => {
    const renderers = [
      () =>
        PieChart.make("#chart")
          .labels([
            "A",
            "B",
            "C",
          ])
          .dataset(
            [
              1,
              2,
              3,
            ],
            "#123456",
          )
          .maxSlices(2)
          .startAngle(-90)
          .padAngle(2)
          .cornerRadius(3)
          .render(),
      () =>
        DonutChart.make("#chart")
          .labels([
            "A",
            "B",
          ])
          .dataset(
            {
              values: [
                1,
                2,
              ],
              color: "#234567",
            },
            (dataset) => dataset.opacity(0.7),
          )
          .startAngle(450)
          .padAngle(1)
          .cornerRadius(2)
          .render(),
      () =>
        PercentageChart.make("#chart")
          .labels([
            "A",
            "B",
          ])
          .dataset([
            1,
            2,
          ])
          .maxSlices(2)
          .radius(5)
          .render(),
      () =>
        PolarAreaChart.make("#chart")
          .labels([
            "A",
            "B",
          ])
          .dataset([
            1,
            2,
          ])
          .padAngle(3)
          .cornerRadius(4)
          .render(),
      () =>
        RadarChart.make("#chart")
          .labels([
            "A",
            "B",
            "C",
          ])
          .dataset([
            1,
            2,
            3,
          ])
          .strokeWidth(2)
          .render(),
    ];

    for (const render of renderers) {
      resetHost();
      const chart = render();
      expect(chart.element.querySelector(".orchid-charts-mark")).not.toBeNull();
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
    expect(heatmap.element.querySelectorAll(".orchid-charts-mark")).toHaveLength(3);
    expect(heatmap.point(1)).toMatchObject({ key: "2026-01-02", value: 0 });
    expectFailure(() => heatmapScope.formatDate(String), "Heatmap tooltip scope has expired");
    expectFailure(() => heatmapScope.formatDate.call({}, String), "Builder scope has expired");
    heatmap.destroy();

    expectFailure(
      () => HeatmapChart.make("#chart").height(240),
      "Heatmap height is derived from its adaptive calendar layout",
    );

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
    expect(timesheet.element.querySelectorAll(".orchid-charts-mark")).toHaveLength(2);
    expectFailure(() => timesheetScope.formatDuration(String), "Timesheet tooltip scope has expired");
  });

  it("covers explicit temporal tooltip switches and positional annotation colors", () => {
    const chart = LineChart.make("#chart")
      .dataset([
        1,
        2,
      ])
      .frameless()
      .marker("Goal", 2, "#ff0000")
      .region(
        "Band",
        [
          0,
          1,
        ],
        "#00ff00",
      )
      .render();
    expect(chart.element.querySelector(".orchid-charts-marker").getAttribute("stroke")).toBe("#ff0000");
    chart.destroy();

    resetHost();
    const heatmap = HeatmapChart.make("#chart").points({ "2026-01-01": 1 }).tooltip(false).render();
    expect(heatmap.element.querySelector(".orchid-charts-mark")).not.toBeNull();
    heatmap.destroy();

    resetHost();
    const timesheet = TimesheetChart.make("#chart")
      .task("Task", "2026-01-01", "2026-01-02")
      .tooltip(false)
      .render();
    expect(timesheet.element.querySelector(".orchid-charts-mark")).not.toBeNull();
  });

  it("covers independently optional tooltip formatters and vertical multiline labels", () => {
    const line = LineChart.make("#chart")
      .labels([
        "A",
      ])
      .dataset([
        1,
      ])
      .formatLabel(() => [
        "First",
        "Second",
      ])
      .tooltip((tooltip) => tooltip.formatLabel((label) => `Tooltip ${label}`))
      .render();
    expect(
      [
        ...line.element.querySelectorAll(".orchid-charts-label"),
      ].at(-1).textContent,
    ).toBe("First Second");
    line.destroy();

    resetHost();
    const heatmap = HeatmapChart.make("#chart")
      .points({ "2026-01-01": 1 })
      .tooltip((tooltip) => tooltip.formatDate(() => "Only date"))
      .render();
    expect(heatmap.element.querySelector(".orchid-charts-mark")).not.toBeNull();
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
      expect(timesheet.element.querySelector(".orchid-charts-mark")).not.toBeNull();
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
      .dataset([
        0,
        1,
      ])
      .marker("Outside", 100, (marker) => marker.includeInDomain(false))
      .region(
        "Outside",
        [
          100,
          200,
        ],
        (region) => region.includeInDomain(false),
      )
      .region(
        "Below",
        [
          -200,
          -100,
        ],
        (region) => region.includeInDomain(false),
      )
      .gradient({ fromOpacity: 0.4 })
      .render();
    expect(line.element.querySelector(".orchid-charts-marker")).toBeNull();
    expect(line.element.querySelector(".orchid-charts-region")).toBeNull();
    resizeCallback();
    line.destroy();
    resizeCallback();
    resetHost();
    const heatmapResize = HeatmapChart.make("#chart").points({ "2026-01-01": 1 }).render();
    const animationFrame = vi.spyOn(globalThis, "requestAnimationFrame");
    resizeCallback();
    resizeCallback();
    expect(animationFrame).toHaveBeenCalledTimes(1);
    heatmapResize.destroy();
    animationFrame.mockRestore();
    vi.stubGlobal("ResizeObserver", null);
    resetHost();
    const fallback = LineChart.make("#chart")
      .dataset([
        1,
        2,
      ])
      .render();
    dispatchEvent(new Event("resize"));
    fallback.destroy();
    vi.stubGlobal("ResizeObserver", OriginalResizeObserver);

    resetHost();
    const scatter = ScatterChart.make("#chart")
      .dataset([
        2,
      ])
      .render();
    expect(scatter.point(0).x).toBe(0);
    expect(scatter.point(9)).toBeUndefined();
    scatter.destroy();

    resetHost();
    const heatmap = HeatmapChart.make("#chart").points({ "2026-01-01": 0 }).render();
    expect(heatmap.point(0).value).toBe(0);
  });
});
