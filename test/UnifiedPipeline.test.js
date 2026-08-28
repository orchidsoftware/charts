import { beforeEach, describe, expect, it, vi } from "vitest";

import { createChart } from "../src/index.js";

const tooltipFor = (chart) => chart.element.parentElement.querySelector(".charts2-tooltip");
const widthOf = (chart) => chart.element.viewBox.baseVal.width;
const heightOf = (chart) => chart.element.viewBox.baseVal.height;
const timesheetOptions = (data) => ({ type: "timesheet", data });

const series = { labels: ["A", "B", "C"], datasets: [{ name: "One", values: [2, 4, -1] }] };

beforeEach(() => {
  document.body.innerHTML = '<div id="chart" style="width: 640px"></div>';
});

describe("unified public pipeline", () => {
  it("routes every supported type through the single public factory", () => {
    const cases = [
      ["line", { data: series }],
      ["bar", { data: series }],
      ["scatter", { data: series }],
      ["axis-mixed", { data: series }],
      ["bubble", { data: { datasets: [{ values: [{ y: 2, r: 7 }] }] } }],
      ["radar", { data: series }],
      ["polar-area", { data: series }],
      ["pie", { data: series }],
      ["donut", { data: series }],
      ["percentage", { data: series }],
      ["heatmap", { data: { dataPoints: { "2026-01-01": 2 } } }],
      ["timesheet", { data: { tasks: [{ label: "Build", start: "2026-01-01", end: "2026-01-02" }] } }],
    ];
    for (const [type, options] of cases) {
      const chart = createChart("#chart", { type, ...options });
      expect(chart.element.querySelector("desc")).not.toBeNull();
      chart.destroy();
    }
  });

  it("requires an explicit supported type", () => {
    expect(() => createChart("#chart", { data: series })).toThrow("Chart type must be one of");
    expect(() => createChart("#chart", { type: "unknown", data: series })).toThrow("Chart type must be one of");
  });

  it("renders scatter and mixed stacked marks with shared annotations", () => {
    const scatter = createChart("#chart", { type: "scatter", data: series });
    expect(scatter.element.querySelectorAll(".charts2-scatter")).toHaveLength(3);
    expect(scatter.element.querySelector(".charts2-scatter").getAttribute("fill")).toBe("var(--charts-point-fill)");
    expect(scatter.element.querySelector(".charts2-scatter").getAttribute("stroke")).toBe("#007AFF");
    expect(scatter.element.querySelector(".charts2-scatter").getAttribute("opacity")).toBe("1");
    expect(getComputedStyle(scatter.element.querySelector(".charts2-scatter")).strokeWidth).toBe("3px");
    expect(scatter.element.querySelectorAll(".charts2-point-halo")).toHaveLength(3);
    scatter.destroy();

    const mixed = createChart("#chart", {
      type: "axis-mixed",
      barOptions: { stacked: true },
      tooltipOptions: { formatTooltipX: (value) => `X ${value}`, formatTooltipY: (value) => `$${value}` },
      data: {
        labels: ["A", "B"],
        datasets: [
          { name: "Line", values: [1, 3] },
          { name: "Positive", chartType: "bar", values: [2, 4] },
          { name: "Negative", chartType: "bar", values: [-1, -2] },
        ],
        yRegions: [{ start: 1, end: 3 }],
        yMarkers: [{ value: 2, label: "Target" }],
      },
    });
    expect(mixed.element.querySelectorAll(".charts2-region")).toHaveLength(1);
    expect(mixed.element.querySelectorAll(".charts2-marker")).toHaveLength(1);
    expect(mixed.element.textContent).toContain("Target");
    expect(mixed.element.querySelector(".charts2-x-hit").dataset.tooltip).toBe(
      "X A — Line: $1 · Positive: $2 · Negative: $-1",
    );
    const mixedBar = mixed.element.querySelector(".charts2-bar.charts2-visual-mark");
    const mixedHalo = mixed.element.querySelector(".charts2-point-halo");
    const mixedPoint = mixed.element.querySelector(".charts2-point");
    expect(mixedBar.compareDocumentPosition(mixedHalo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(mixedHalo.compareDocumentPosition(mixedPoint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(getComputedStyle(mixedHalo).stroke).toBe(getComputedStyle(mixedPoint).fill);
  });

  it("supports horizontal annotations, region fill, hidden line parts, and long summaries", () => {
    const horizontal = createChart("#chart", {
      type: "bar",
      orientation: "horizontal",
      data: { ...series, yRegions: [{ start: 0, end: 3 }], yMarkers: [{ value: 2 }] },
    });
    expect(horizontal.element.querySelector(".charts2-region").getAttribute("x")).not.toBeNull();
    expect(horizontal.element.querySelector(".charts2-marker").getAttribute("x1")).toBe(
      horizontal.element.querySelector(".charts2-marker").getAttribute("x2"),
    );
    horizontal.destroy();

    const filled = createChart("#chart", {
      type: "line",
      lineOptions: { regionFill: true, hideDots: true },
      data: series,
    });
    expect(filled.element.querySelector(".charts2-area")).not.toBeNull();
    expect(filled.element.querySelector(".charts2-point")).toBeNull();
    filled.destroy();
    const points = Array.from({ length: 201 }, (_, index) => index);
    const long = createChart("#chart", { type: "line", data: { labels: [], datasets: [{ values: points }] } });
    expect(long.element.querySelectorAll(".charts2-mark")).toHaveLength(1);
    expect(long.element.querySelector(".charts2-mark").dataset.tooltip).toContain("201 points");
    expect(long.element.querySelector(".charts2-mark").dataset.tooltip).toContain("range 0–200");
    expect(long.element.querySelector(".charts2-mark").dataset.tooltip.length).toBeLessThan(100);
    long.destroy();
    const denseHorizontal = createChart("#chart", {
      type: "bar",
      orientation: "horizontal",
      data: { datasets: [{ values: Array.from({ length: 65 }, (_, index) => index) }] },
    });
    expect(denseHorizontal.element.querySelectorAll(".charts2-bar.charts2-mark")).toHaveLength(65);
    expect(denseHorizontal.element.querySelector(".charts2-x-hit")).toBeNull();
    denseHorizontal.destroy();
    const hidden = createChart("#chart", { type: "line", lineOptions: { hideLine: true, dotSize: 6 }, data: series });
    expect(hidden.element.querySelector(".charts2-line")).toBeNull();
    expect(hidden.element.querySelector(".charts2-point").getAttribute("r")).toBe("6");
  });

  it("smooths line geometry without overshooting and allows straight segments", () => {
    const smooth = createChart("#chart", {
      type: "line",
      data: { labels: ["A", "B", "C"], datasets: [{ values: [0, 10, 0] }] },
    });
    const path = smooth.element.querySelector(".charts2-line").getAttribute("d");
    expect(path).toContain("C");
    const coordinates = path
      .split(/[MC, ]+/)
      .filter(Boolean)
      .map(Number);
    let previousY = coordinates[1];
    for (let offset = 2; offset < coordinates.length; offset += 6) {
      const firstControlY = coordinates[offset + 1];
      const secondControlY = coordinates[offset + 3];
      const endY = coordinates[offset + 5];
      const minimum = Math.min(previousY, endY);
      const maximum = Math.max(previousY, endY);
      expect(firstControlY).toBeGreaterThanOrEqual(minimum);
      expect(firstControlY).toBeLessThanOrEqual(maximum);
      expect(secondControlY).toBeGreaterThanOrEqual(minimum);
      expect(secondControlY).toBeLessThanOrEqual(maximum);
      previousY = endY;
    }
    smooth.destroy();

    const straight = createChart("#chart", { type: "line", lineOptions: { spline: false }, data: series });
    expect(straight.element.querySelector(".charts2-line").getAttribute("d")).toContain("L");
    expect(straight.element.querySelector(".charts2-line").getAttribute("d")).not.toContain("C");
  });

  it("rounds only the value-facing outer end of signed and stacked bars", () => {
    const signed = createChart("#chart", {
      type: "bar",
      barOptions: { radius: 4 },
      data: { labels: ["Loss", "Zero", "Gain"], datasets: [{ values: [-10, 0, 10] }] },
    });
    const signedBars = [...signed.element.querySelectorAll(".charts2-bar")];
    expect(signedBars[0].getAttribute("d")).toContain("Q");
    expect(signedBars[1].getAttribute("d")).not.toContain("Q");
    expect(signedBars[2].getAttribute("d")).toContain("Q");
    signed.destroy();

    const stacked = createChart("#chart", {
      type: "bar",
      barOptions: { stacked: true, radius: 4 },
      data: { labels: ["Total"], datasets: [{ values: [5] }, { values: [3] }, { values: [-4] }, { values: [-2] }] },
    });
    const stackedBars = [...stacked.element.querySelectorAll(".charts2-bar")];
    expect(stackedBars.map((bar) => bar.getAttribute("d").includes("Q"))).toEqual([false, true, false, true]);
    stacked.destroy();

    const sparseStack = createChart("#chart", {
      type: "bar",
      barOptions: { stacked: true },
      data: { labels: ["A", "B"], datasets: [{ values: [5, 4] }, { values: [2] }] },
    });
    expect(sparseStack.element.querySelectorAll(".charts2-bar")).toHaveLength(3);
    sparseStack.destroy();

    const square = createChart("#chart", { type: "bar", barOptions: { radius: 0 }, data: series });
    expect(
      [...square.element.querySelectorAll(".charts2-bar")].every((bar) => !bar.getAttribute("d").includes("Q")),
    ).toBe(true);
    square.destroy();

    const horizontalLoss = createChart("#chart", {
      type: "bar",
      orientation: "horizontal",
      data: { datasets: [{ values: [-5] }] },
    });
    expect(horizontalLoss.element.querySelector(".charts2-bar").getAttribute("d")).toContain("Q");
  });

  it("renders the demo stress matrix through the shared Cartesian pipeline", () => {
    const labels = ["A", "B", "C", "D"];
    const gradient = createChart("#chart", {
      type: "line",
      gradient: true,
      data: {
        labels,
        datasets: [
          { name: "Current", values: [2, 5, 4, 8] },
          { name: "Forecast", values: [3, 4, 6, 9] },
          { name: "Previous", values: [1, 3, 3, 6] },
        ],
      },
    });
    expect(gradient.element.querySelectorAll("linearGradient")).toHaveLength(3);
    expect(gradient.element.querySelectorAll(".charts2-area")).toHaveLength(3);
    expect(gradient.element.querySelectorAll(".charts2-line")).toHaveLength(3);
    gradient.destroy();

    const mixed = createChart("#chart", {
      type: "axis-mixed",
      data: {
        labels,
        datasets: [
          { name: "Actual", chartType: "bar", values: [-3, 5, 0, 8] },
          { name: "Target", chartType: "line", values: [2, 3, 4, 5] },
          { name: "Capacity", chartType: "line", values: [6, 6, 7, 7] },
        ],
      },
    });
    expect(mixed.element.querySelectorAll(".charts2-bar.charts2-visual-mark")).toHaveLength(4);
    expect(mixed.element.querySelectorAll(".charts2-line")).toHaveLength(2);
    expect(JSON.parse(mixed.element.querySelector(".charts2-x-hit").dataset.tooltipItems)).toHaveLength(3);
    const mixedFirstBand = mixed.element.querySelector(".charts2-x-hit[data-point-index='0']");
    const mixedFirstCenter =
      Number(mixedFirstBand.getAttribute("x")) + Number(mixedFirstBand.getAttribute("width")) / 2;
    const mixedFirstLineX = Number(
      mixed.element
        .querySelector(".charts2-line")
        .getAttribute("d")
        .match(/^M([^,]+)/)[1],
    );
    expect(mixedFirstLineX).toBeCloseTo(mixedFirstCenter);
    mixed.destroy();

    const narrowMixed = createChart("#chart", {
      type: "axis-mixed",
      width: 220,
      height: 520,
      data: {
        labels,
        datasets: [
          { name: "Daily change", chartType: "bar", values: [-18, 9, -6, 22] },
          { name: "Rolling trend", chartType: "line", values: [-8, -4, -2, 5] },
          { name: "Alert threshold", chartType: "line", values: [12, 12, 12, 12] },
        ],
      },
    });
    const narrowLegendRows = new Set(
      [...narrowMixed.element.querySelectorAll(".charts2-legend")].map((item) => item.getAttribute("y")),
    );
    const narrowLegend = narrowMixed.element.querySelector(".charts2-legend-group").getBBox();
    const narrowPlotTop = Number(narrowMixed.element.querySelector(".charts2-grid-vertical").getAttribute("y1"));
    expect(narrowLegendRows.size).toBeGreaterThan(1);
    expect(narrowLegend.y + narrowLegend.height).toBeLessThanOrEqual(narrowPlotTop - 6);
    expect(Number(narrowMixed.element.querySelector(".charts2-x-hit").getAttribute("y"))).toBe(narrowPlotTop);
    narrowMixed.destroy();

    const grouped = createChart("#chart", {
      type: "bar",
      orientation: "horizontal",
      data: {
        labels: labels.slice(0, 3),
        datasets: [
          { name: "Critical", values: [3, 5, 2] },
          { name: "Standard", values: [7, 8, 6] },
          { name: "Deferred", values: [4, 3, 5] },
        ],
      },
    });
    expect(grouped.element.querySelectorAll(".charts2-bar.charts2-visual-mark")).toHaveLength(9);
    expect(grouped.element.querySelectorAll(".charts2-legend")).toHaveLength(3);
    grouped.destroy();

    const stacked = createChart("#chart", {
      type: "bar",
      orientation: "horizontal",
      barOptions: { stacked: true },
      data: {
        labels: labels.slice(0, 3),
        datasets: [
          { name: "Done", values: [3, 5, 2] },
          { name: "Open", values: [7, 8, 6] },
        ],
      },
    });
    const stackedBars = [...stacked.element.querySelectorAll(".charts2-bar.charts2-visual-mark")];
    expect(stackedBars).toHaveLength(6);
    expect(stackedBars[0].getBBox().y).toBe(stackedBars[3].getBBox().y);
    expect(stackedBars[3].getBBox().x).toBeCloseTo(stackedBars[0].getBBox().x + stackedBars[0].getBBox().width);
    stacked.destroy();

    const denseLabels = Array.from({ length: 48 }, (_, index) => `W${index + 1}`);
    const dense = createChart("#chart", {
      type: "line",
      data: {
        labels: denseLabels,
        datasets: [
          { name: "Observed", values: denseLabels.map((_, index) => index % 9) },
          { name: "Baseline", values: denseLabels.map((_, index) => (index + 3) % 7) },
        ],
      },
    });
    expect(dense.element.querySelector(".charts2-line.charts2-mark")).toBeNull();
    expect(dense.element.querySelector(".charts2-point")).toBeNull();
    expect(dense.element.querySelectorAll(".charts2-x-hit")).toHaveLength(48);
    expect(JSON.parse(dense.element.querySelector(".charts2-x-hit").dataset.tooltipItems)).toHaveLength(2);
    dense.destroy();
  });

  it("renders all aggregation variants, pruning, legend control, and validation", () => {
    const many = { labels: ["A", "B", "C", "D"], datasets: [{ values: [40, 30, 20, 10] }] };
    const pie = createChart("#chart", { type: "pie", data: many, maxSlices: 3, showLegend: false, startAngle: 30 });
    expect(pie.element.querySelectorAll(".charts2-pie-slice")).toHaveLength(3);
    expect(pie.element.querySelector(".charts2-legend")).toBeNull();
    pie.destroy();
    const donut = createChart("#chart", { type: "donut", data: many });
    expect(donut.element.querySelectorAll(".charts2-donut-slice")).toHaveLength(4);
    expect(donut.element.querySelector(".charts2-direct-value").textContent).toBe("100");
    donut.destroy();
    const single = createChart("#chart", { type: "donut", data: { labels: ["All"], datasets: [{ values: [100] }] } });
    expect(single.element.querySelector("circle.charts2-donut-slice")).not.toBeNull();
    single.destroy();
    const percentage = createChart("#chart", { type: "percentage", data: many });
    expect(percentage.element.querySelectorAll(".charts2-percentage-segment")).toHaveLength(4);
    expect(percentage.element.querySelector("clipPath rect").getAttribute("rx")).toBe("6");
    expect(percentage.element.querySelectorAll(".charts2-percentage-segment[clip-path]")).toHaveLength(4);
    percentage.destroy();
    const squarePercentage = createChart("#chart", { type: "percentage", barOptions: { radius: 0 }, data: many });
    expect(squarePercentage.element.querySelector("clipPath")).toBeNull();
    expect(() =>
      createChart("#chart", { type: "pie", data: { labels: ["None"], datasets: [{ values: [0] }] } }),
    ).toThrow("positive total");
  });

  it("rounds radial sector boundaries according to their data geometry", () => {
    const data = { labels: ["A", "B", "C"], datasets: [{ values: [50, 30, 20] }] };
    const pie = createChart("#chart", { type: "pie", showLegend: false, data });
    expect(pie.element.querySelector(".charts2-pie-slice").getAttribute("d").match(/Q/g)).toHaveLength(2);
    pie.destroy();

    const donut = createChart("#chart", { type: "donut", showLegend: false, data });
    expect(donut.element.querySelector(".charts2-donut-slice").getAttribute("d").match(/Q/g)).toHaveLength(4);
    donut.destroy();

    const polar = createChart("#chart", { type: "polar-area", showLegend: false, data });
    expect(polar.element.querySelector(".charts2-polar-area").getAttribute("d").match(/Q/g)).toHaveLength(2);
    polar.destroy();

    const sharp = createChart("#chart", { type: "donut", showLegend: false, sectorOptions: { cornerRadius: 0 }, data });
    expect(sharp.element.querySelector(".charts2-donut-slice").getAttribute("d")).not.toContain("Q");
  });

  it("uses radius-aware pad geometry without distorting sector proportions", () => {
    const radialData = { labels: ["A", "B"], datasets: [{ values: [60, 40] }] };
    const startX = (chart, selector, isRing = false) => {
      const path = chart.element.querySelector(selector).getAttribute("d");
      const command = isRing ? "M" : "L";
      return Number(path.slice(path.indexOf(command) + 1).split(",", 1)[0]);
    };

    for (const [type, selector, ring] of [
      ["pie", ".charts2-pie-slice", false],
      ["donut", ".charts2-donut-slice", true],
      ["polar-area", ".charts2-polar-area", false],
    ]) {
      const contiguous = createChart("#chart", {
        type,
        width: 240,
        height: 240,
        showLegend: false,
        padAngle: 0,
        sectorOptions: { cornerRadius: 0 },
        data: radialData,
      });
      const separated = createChart("#chart", {
        type,
        width: 240,
        height: 240,
        showLegend: false,
        sectorOptions: { cornerRadius: 0 },
        data: radialData,
      });
      expect(startX(contiguous, selector, ring)).toBeCloseTo(120);
      expect(startX(separated, selector, ring)).toBeGreaterThan(startX(contiguous, selector, ring));
      contiguous.destroy();
      separated.destroy();
    }

    const custom = createChart("#chart", {
      type: "pie",
      width: 240,
      height: 240,
      showLegend: false,
      padAngle: 12,
      sectorOptions: { cornerRadius: 0 },
      data: radialData,
    });
    const standard = createChart("#chart", {
      type: "pie",
      width: 240,
      height: 240,
      showLegend: false,
      sectorOptions: { cornerRadius: 0 },
      data: radialData,
    });
    expect(startX(custom, ".charts2-pie-slice")).toBeGreaterThan(startX(standard, ".charts2-pie-slice"));

    const tiny = createChart("#chart", {
      type: "pie",
      padAngle: 359,
      data: { labels: ["Tiny", "Rest"], datasets: [{ values: [0.000001, 1] }] },
    });
    expect(
      [...tiny.element.querySelectorAll(".charts2-pie-slice")].every(
        (slice) => !slice.getAttribute("d").includes("NaN"),
      ),
    ).toBe(true);
    const zero = createChart("#chart", {
      type: "pie",
      data: { labels: ["None", "All"], datasets: [{ values: [0, 1] }] },
    });
    expect(zero.element.querySelectorAll(".charts2-pie-slice")).toHaveLength(1);
    expect(zero.element.querySelector("circle.charts2-pie-slice")).not.toBeNull();

    const donut = createChart("#chart", {
      type: "donut",
      width: 240,
      height: 240,
      showLegend: false,
      padAngle: 12,
      sectorOptions: { cornerRadius: 0 },
      data: radialData,
    });
    const numbers = donut.element
      .querySelector(".charts2-donut-slice")
      .getAttribute("d")
      .split(/[A-Za-z, ]+/)
      .filter(Boolean)
      .map(Number);
    const outerStartAngle = Math.atan2(numbers[1] - 120, numbers[0] - 120);
    const innerStartAngle = Math.atan2(numbers[17] - 120, numbers[16] - 120);
    expect(innerStartAngle).not.toBeCloseTo(outerStartAngle);
  });

  it("fills aggregation height and reserves wrapped legends systematically", () => {
    const data = { labels: ["Done", "In progress", "Waiting", "Open"], datasets: [{ values: [40, 30, 20, 10] }] };
    const percentage = createChart("#chart", { type: "percentage", height: 280, data });
    const segment = percentage.element.querySelector(".charts2-percentage-segment");
    const legendLabels = [...percentage.element.querySelectorAll(".charts2-legend")];
    expect(Number(segment.getAttribute("height"))).toBeCloseTo(162.72);
    expect(Number(segment.getAttribute("y"))).toBeCloseTo(47.64);
    expect(Number(segment.getAttribute("y")) + Number(segment.getAttribute("height"))).toBeLessThan(
      Number(legendLabels[0].getAttribute("y")) - 20,
    );
    expect(Number(legendLabels.at(-1).getAttribute("y"))).toBe(262);
    percentage.destroy();

    const hiddenLegend = createChart("#chart", { type: "percentage", height: 280, showLegend: false, data });
    expect(
      Number(hiddenLegend.element.querySelector(".charts2-percentage-segment").getAttribute("height")),
    ).toBeCloseTo(178.56);
    expect(hiddenLegend.element.querySelector(".charts2-legend-group")).toBeNull();
    hiddenLegend.destroy();

    const wrappedData = {
      labels: ["Completed after review", "In progress with owner", "Waiting for approval", "Open without assignee"],
      datasets: [{ values: [40, 30, 20, 10] }],
    };
    const wrapped = createChart("#chart", { type: "percentage", width: 180, height: 280, data: wrappedData });
    const wrappedLegendY = [...wrapped.element.querySelectorAll(".charts2-legend")].map((label) =>
      Number(label.getAttribute("y")),
    );
    const wrappedSegment = wrapped.element.querySelector(".charts2-percentage-segment");
    expect(wrappedLegendY).toEqual([202, 222, 242, 262]);
    expect(Number(wrappedSegment.getAttribute("y")) + Number(wrappedSegment.getAttribute("height"))).toBeLessThan(
      wrappedLegendY[0] - 20,
    );
    wrapped.destroy();

    for (const type of ["pie", "donut"]) {
      const radial = createChart("#chart", { type, height: 280, data });
      const slices = [...radial.element.querySelectorAll(`.charts2-${type}-slice`)].map((slice) => slice.getBBox());
      const top = Math.min(...slices.map((bounds) => bounds.y));
      const bottom = Math.max(...slices.map((bounds) => bounds.y + bounds.height));
      expect(bottom - top).toBeGreaterThan(190);
      expect(top).toBeGreaterThanOrEqual(16);
      expect(bottom).toBeLessThan(242);
      radial.destroy();
    }
  });

  it("normalizes heatmap dates, colors, updates, and invalid inputs", () => {
    const stamp = Date.parse("2026-01-02T00:00:00Z") / 1000;
    const palette = [
      "#f8f8f8",
      "#e4f2ff",
      "#cce5ff",
      "#acd7ff",
      "#8bc7ff",
      "#67b5ff",
      "#429fff",
      "#2188e5",
      "#126fbd",
      "#084b83",
    ];
    const heatmap = createChart("#chart", {
      type: "heatmap",
      countLabel: "events",
      radius: 4,
      colors: palette,
      data: { dataPoints: { [stamp]: 5, "2026-01-01": 1 } },
    });
    expect(heatmap.element.querySelector(".charts2-heat-cell").dataset.tooltip).toBe("2026-01-01: 1 events");
    expect(heatmap.element.querySelector(".charts2-heat-cell title")).toBeNull();
    const cells = [...heatmap.element.querySelectorAll(".charts2-heat-cell")];
    const swatches = [...heatmap.element.querySelectorAll(".charts2-heat-legend-swatch")];
    expect(cells.map((cell) => cell.getAttribute("fill"))).toEqual([palette[0], palette.at(-1)]);
    expect(swatches.map((swatch) => swatch.getAttribute("fill"))).toEqual(palette);
    const gridBottom = Math.max(
      ...cells.map((cell) => Number(cell.getAttribute("y")) + Number(cell.getAttribute("height"))),
    );
    expect(Number(swatches[0].getAttribute("y")) - gridBottom).toBe(12);
    expect(
      heatmap.element.querySelector(".charts2-heat-legend-more").getBBox().x +
        heatmap.element.querySelector(".charts2-heat-legend-more").getBBox().width,
    ).toBeLessThanOrEqual(widthOf(heatmap) - 24);
    expect(Number(swatches[0].getAttribute("y")) + Number(swatches[0].getAttribute("height"))).toBe(
      heightOf(heatmap) - 24,
    );
    expect(heatmap.point(1).key).toBe("2026-01-02");
    document.querySelector("#chart").style.width = "180px";
    dispatchEvent(new Event("resize"));
    expect(widthOf(heatmap)).toBe(180);
    expect(heatmap.element.style.minWidth).toBe("");
    const resizedCells = [...heatmap.element.querySelectorAll(".charts2-heat-cell")];
    expect(
      Math.max(...resizedCells.map((cell) => Number(cell.getAttribute("x")) + Number(cell.getAttribute("width")))),
    ).toBeLessThanOrEqual(widthOf(heatmap) - 14.4);
    expect(heatmap.update({ dataPoints: {} })).toBe(heatmap);
    expect(heatmap.element.querySelector(".charts2-heat-cell")).toBeNull();
    expect(heatmap.element.querySelectorAll(".charts2-heat-legend-swatch")).toHaveLength(10);
    heatmap.destroy();
    const hiddenLegend = createChart("#chart", {
      type: "heatmap",
      showLegend: false,
      data: { dataPoints: { "2026-01-01": 2 } },
    });
    expect(hiddenLegend.element.querySelector(".charts2-heat-legend")).toBeNull();
    const hiddenCell = hiddenLegend.element.querySelector(".charts2-heat-cell");
    expect(Number(hiddenCell.getAttribute("y")) + Number(hiddenCell.getAttribute("height"))).toBe(
      heightOf(hiddenLegend) - 24,
    );
    hiddenLegend.destroy();

    const year = Object.fromEntries(
      Array.from({ length: 365 }, (_, index) => [
        new Date(Date.UTC(2026, 0, index + 1)).toISOString().slice(0, 10),
        index,
      ]),
    );
    const onWeekSelect = vi.fn();
    const narrow = createChart("#chart", {
      type: "heatmap",
      width: 100,
      height: 280,
      colors: palette,
      onSelect: onWeekSelect,
      data: { dataPoints: year },
    });
    const narrowCells = [...narrow.element.querySelectorAll(".charts2-heat-cell")];
    const narrowSwatches = [...narrow.element.querySelectorAll(".charts2-heat-legend-swatch")];
    const weekHits = [...narrow.element.querySelectorAll(".charts2-heat-week-hit")];
    expect(narrow.element.parentElement).toHaveClass("charts2-scrollable-heatmap");
    expect(Number(narrow.element.style.width.replace("px", ""))).toBeGreaterThan(100);
    expect(Math.min(...narrowCells.map((cell) => Number(cell.getAttribute("width"))))).toBeGreaterThanOrEqual(16);
    expect(narrowCells.every((cell) => !cell.classList.contains("charts2-mark"))).toBe(true);
    expect(weekHits).toHaveLength(53);
    expect(JSON.parse(weekHits[0].dataset.tooltipItems)).toHaveLength(7);
    expect(Number(weekHits[0].getAttribute("height"))).toBeGreaterThan(180);
    expect(
      Number(narrowSwatches[1].getAttribute("x")) -
        Number(narrowSwatches[0].getAttribute("x")) -
        Number(narrowSwatches[0].getAttribute("width")),
    ).toBeCloseTo(2);
    weekHits[0].dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(tooltipFor(narrow).hidden).toBe(false);
    expect(tooltipFor(narrow).querySelectorAll(".charts2-tooltip-row")).toHaveLength(7);
    weekHits[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onWeekSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "heatmap",
        index: 0,
        values: [0, 1, 2, 3, 4, 5, 6],
        range: { start: "2026-01-01", end: "2026-01-07" },
      }),
    );
    narrow.destroy();
    const compactLegend = createChart("#chart", {
      type: "heatmap",
      width: 100,
      colors: palette,
      data: { dataPoints: { "2026-01-01": 1 } },
    });
    const compactSwatches = [...compactLegend.element.querySelectorAll(".charts2-heat-legend-swatch")];
    expect(compactLegend.element.parentElement).not.toHaveClass("charts2-scrollable-heatmap");
    expect(
      Number(compactSwatches[1].getAttribute("x")) -
        Number(compactSwatches[0].getAttribute("x")) -
        Number(compactSwatches[0].getAttribute("width")),
    ).toBeCloseTo(0);
    compactLegend.destroy();
    const tall = createChart("#chart", { type: "heatmap", height: 280, data: { dataPoints: year } });
    const tallCells = [...tall.element.querySelectorAll(".charts2-heat-cell")];
    const tallGridBottom = Math.max(
      ...tallCells.map((cell) => Number(cell.getAttribute("y")) + Number(cell.getAttribute("height"))),
    );
    expect(Number(tallCells[0].getAttribute("height"))).toBeGreaterThan(18);
    expect(Number(tall.element.querySelector(".charts2-heat-legend-swatch").getAttribute("y")) - tallGridBottom).toBe(
      12,
    );
    expect(Number(tall.element.querySelector(".charts2-heat-legend-swatch").getAttribute("y")) + 11).toBe(256);
    tall.destroy();
    expect(() =>
      createChart("#chart", { type: "heatmap", data: { start: new Date("2026-02-01"), end: new Date("2026-01-01") } }),
    ).toThrow("after");
    expect(() => createChart("#chart", { type: "heatmap", data: { dataPoints: { bad: 1 } } })).toThrow(
      "Invalid heatmap date",
    );
    expect(() => createChart("#chart", { type: "heatmap", data: { dataPoints: { "2026-01-01": NaN } } })).toThrow(
      "finite",
    );
    expect(() => createChart("#chart", { type: "line", colors: [], data: series })).toThrow("colors");
  });

  it("shares selection, serialization, download, update, and destroy lifecycle", () => {
    const chart = createChart("#chart", { type: "line", title: "Revenue", data: series });
    expect(chart.point(1)).toEqual({ index: 1, label: "B", values: [4] });
    expect(chart.update({ labels: ["A", "D", "B", "C"], datasets: [{ values: [2, 8, 4, -1] }] })).toBe(chart);
    expect(chart.point(1).label).toBe("D");
    expect(chart.update(series)).toBe(chart);
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    expect(chart.toSvg()).toContain("<svg");
    expect(chart.download()).toBe(chart);
    expect(click).toHaveBeenCalledOnce();
    click.mockRestore();
    chart.destroy();
  });

  it("reports selected data consistently for chart families", () => {
    const selected = [];
    const onSelect = vi.fn();
    const chart = createChart("#chart", { type: "bar", onSelect, data: series });
    chart.element.parentElement.addEventListener("data-select", (event) => {
      selected.push(event.detail);
    });
    chart.element.querySelector(".charts2-mark").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(selected[0]).toMatchObject({ type: "bar", index: 0, label: "A", x: 0, values: [2] });
    expect(selected[0].points).toEqual([{ datasetIndex: 0, dataset: "One", label: "A", x: 0, y: 2 }]);
    expect(onSelect).toHaveBeenCalledWith(selected[0]);
    chart.destroy();

    const bubbleSelect = vi.fn();
    const bubble = createChart("#chart", {
      type: "bubble",
      onSelect: bubbleSelect,
      data: { labels: ["Reach"], datasets: [{ name: "Audience", values: [{ x: 7, y: 12, r: 9 }] }] },
    });
    bubble.element.querySelector(".charts2-x-hit").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(bubbleSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "bubble",
        x: 7,
        values: [12],
        points: [{ datasetIndex: 0, dataset: "Audience", label: "Reach", x: 7, y: 12, r: 9 }],
      }),
    );
    bubble.destroy();

    const sparseSelect = vi.fn();
    const sparse = createChart("#chart", {
      type: "line",
      onSelect: sparseSelect,
      data: {
        labels: ["A", "B"],
        datasets: [
          { name: "Short", values: [1] },
          { name: "Long", values: [2, 3] },
        ],
      },
    });
    sparse.element.querySelectorAll(".charts2-x-hit")[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(sparseSelect).toHaveBeenCalledWith(expect.objectContaining({ values: [undefined, 3] }));
    expect(sparseSelect.mock.calls[0][0].points).toEqual([
      { datasetIndex: 1, dataset: "Long", label: "B", x: 1, y: 3 },
    ]);
    sparse.destroy();
  });

  it("covers sparse and unlabeled data without diverging from the pipeline", () => {
    const unlabeled = createChart("#chart", {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            values: [
              { x: 7, y: 2 },
              { x: 8, y: 3 },
            ],
          },
        ],
      },
    });
    expect(unlabeled.element.querySelector(".charts2-line title").textContent).toContain("7: 2");
    expect(unlabeled.element.querySelector(".charts2-label:not(.charts2-value-label)")).toBeNull();
    unlabeled.destroy();

    const bubble = createChart("#chart", {
      type: "bubble",
      data: { labels: [], datasets: [{ values: [{ x: 4, y: 2 }] }] },
    });
    expect(bubble.element.querySelector("title").textContent).toContain("4: 2");
    bubble.destroy();
    const polar = createChart("#chart", { type: "polar-area", data: { labels: [], datasets: [{ values: [2] }] } });
    expect(polar.element.querySelector(".charts2-mark").dataset.tooltip).toBe("1: 2");
    expect(polar.element.querySelector(".charts2-label")).toBeNull();
    polar.destroy();
    const radar = createChart("#chart", { type: "radar", data: { labels: [], datasets: [{ values: [2, 3] }] } });
    expect(radar.element.querySelectorAll(".charts2-label")).toHaveLength(0);
    radar.destroy();
    const scatter = createChart("#chart", {
      type: "scatter",
      onSelect: () => {},
      data: { labels: [], datasets: [{ values: [{ x: 5, y: 2 }] }] },
    });
    expect(scatter.element.querySelector("title").textContent).toBe("5: 2");
    const scatterSelection = [];
    scatter.element.parentElement.addEventListener("data-select", (event) => {
      scatterSelection.push(event.detail);
    });
    scatter.element.querySelector(".charts2-mark").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(scatterSelection[0].label).toBe(5);
    scatter.destroy();
    const bars = createChart("#chart", { type: "bar", data: { labels: [], datasets: [{ values: [2] }] } });
    expect(bars.element.querySelector(".charts2-x-hit").dataset.tooltip).toBe("0 — Series 1: 2");
    bars.destroy();
    const mixedDefault = createChart("#chart", { type: "axis-mixed", data: { datasets: [{ values: [1, 2] }] } });
    expect(mixedDefault.element.querySelector(".charts2-line")).not.toBeNull();
    mixedDefault.destroy();
    const multiBubble = createChart("#chart", {
      type: "bubble",
      data: {
        datasets: [
          { name: "First", values: [{ y: 1 }] },
          { name: "Second", values: [{ y: 2 }] },
        ],
      },
    });
    expect(multiBubble.element.querySelector(".charts2-bubble title").textContent).toContain("First,");
    multiBubble.destroy();
    const multiScatter = createChart("#chart", {
      type: "scatter",
      data: {
        datasets: [
          { name: "First", values: [1] },
          { name: "Second", values: [2] },
        ],
      },
    });
    expect(multiScatter.element.querySelector(".charts2-scatter title").textContent).toContain("First,");
  });

  it("covers sparse stacking, fallback labels, and horizontal marker labels", () => {
    const chart = createChart("#chart", {
      type: "bar",
      orientation: "horizontal",
      barOptions: { stacked: true },
      data: {
        labels: [],
        datasets: [{ values: [2] }, { values: [3, -1] }, { values: [4, -2] }],
        yMarkers: [{ value: 2, label: "Goal" }],
      },
    });
    expect(chart.element.textContent).toContain("Goal");
    expect(chart.element.querySelector(".charts2-x-hit").dataset.tooltip).toBe(
      "0 — Series 1: 2 · Series 2: 3 · Series 3: 4",
    );
    expect(chart.element.querySelectorAll(".charts2-x-hit")).toHaveLength(2);

    const defaultLayerMixed = createChart("#chart", {
      type: "axis-mixed",
      barOptions: { stacked: true },
      data: { datasets: [{ chartType: "bar", values: [2, 3] }, { values: [1, 2] }] },
    });
    expect(defaultLayerMixed.element.querySelector(".charts2-line")).not.toBeNull();
    defaultLayerMixed.destroy();

    const lineOnlyMixed = createChart("#chart", {
      type: "axis-mixed",
      barOptions: { stacked: true },
      data: { datasets: [{ chartType: "line", values: [1, 2] }] },
    });
    expect(lineOnlyMixed.element.querySelector(".charts2-bar")).toBeNull();
    lineOnlyMixed.destroy();
  });

  it("covers sparse aggregation, explicit frameless routing, empty heatmaps, and download names", () => {
    const pie = createChart("#chart", {
      type: "pie",
      data: { labels: ["A", "B"], datasets: [{ values: [2, 3] }, { values: [1] }] },
    });
    expect(pie.element.querySelectorAll(".charts2-pie-slice")).toHaveLength(2);
    pie.destroy();
    const frameless = createChart("#chart", {
      type: "line",
      showAxes: false,
      showGrid: false,
      showLabels: false,
      showLegend: false,
      lineOptions: { regionFill: true },
      data: { datasets: [{ values: [2, 5] }] },
    });
    expect(frameless.element.querySelector(".charts2-area")).not.toBeNull();
    frameless.destroy();
    const empty = createChart("#chart", { type: "heatmap", data: {} });
    expect(empty.element.textContent).toContain("Less");
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    expect(empty.toSvg()).toContain("<svg");
    expect(empty.download("Empty heatmap")).toBe(empty);
    click.mockRestore();
    empty.destroy();
    const gradient = createChart("#chart", { type: "line", gradient: true, data: series });
    expect(gradient.element.querySelector("linearGradient")).not.toBeNull();
  });

  it("covers lifecycle defaults after selection", () => {
    const chart = createChart("#chart", { type: "bar", data: series });
    expect(chart.point()).toMatchObject({ index: 0, label: "A" });
    chart.element.querySelector(".charts2-mark").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(chart.point()).toMatchObject({ index: 0, label: "A" });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    expect(chart.toSvg()).toContain("<svg");
    expect(chart.download()).toBe(chart);
    click.mockRestore();
  });

  it("formats extreme values, truncates long labels, wraps legends, and reports exact series selection", () => {
    const onSelect = vi.fn();
    const chart = createChart("#chart", {
      type: "line",
      width: 180,
      onSelect,
      data: {
        labels: ["A label that cannot fit in its category", "Short"],
        datasets: [
          { name: "A very long first series", values: [9_800_000, 0.00012] },
          { name: "Another very long series", values: [8_400_000, 0.00009] },
          { name: "Third comparison series", values: [7_600_000, 0.00015] },
        ],
      },
    });
    expect(chart.element.textContent).toContain("9.8M");
    expect(chart.element.querySelector(".charts2-label title").textContent).toContain("cannot fit");
    const legendRows = new Set(
      [...chart.element.querySelectorAll(".charts2-legend")].map((item) => item.getAttribute("y")),
    );
    expect(legendRows.size).toBeGreaterThan(1);
    const tinyMark = chart.element.querySelector('[data-dataset-index="-1"][data-point-index="1"]');
    expect(tinyMark.dataset.tooltip).toContain("0.00012");
    tinyMark.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ values: [0.00012, 0.00009, 0.00015] }));

    const compact = createChart("#chart", {
      type: "line",
      width: 180,
      data: { labels: ["A", "B", "C", "D", "E", "F"], datasets: [{ values: [1, 2, 3, 4, 5, 6] }] },
    });
    const compactLabels = [...compact.element.querySelectorAll(".charts2-label:not(.charts2-value-label)")];
    expect(compactLabels.map((node) => node.textContent)).toEqual(["A", "C", "F"]);
    expect(compactLabels.map((node) => node.getAttribute("text-anchor"))).toEqual(["start", "middle", "end"]);
  });

  it("reports heatmap selection and keeps tooltip positioning safe with an unmeasured host", () => {
    const chart = createChart("#chart", {
      type: "heatmap",
      onSelect: () => {},
      data: { dataPoints: { "2026-01-01": 4 } },
    });
    const selected = [];
    chart.element.parentElement.addEventListener("data-select", (event) => {
      selected.push(event.detail);
    });
    const cell = chart.element.querySelector(".charts2-heat-cell");
    cell.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(selected[0]).toMatchObject({ key: "2026-01-01", value: 4 });
    vi.spyOn(chart.element.parentElement, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      toJSON() {},
    });
    cell.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 40, clientY: 20 }));
    const hoverPosition = { left: tooltipFor(chart).style.left, top: tooltipFor(chart).style.top };
    cell.focus();
    expect({ left: tooltipFor(chart).style.left, top: tooltipFor(chart).style.top }).toEqual(hoverPosition);
    expect(tooltipFor(chart).hidden).toBe(false);

    delete cell.dataset.tooltip;
    delete cell.dataset.tooltipItems;
    delete cell.dataset.tooltipHeading;
    cell.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
    expect(tooltipFor(chart).childElementCount).toBe(0);
  });

  it("falls back to individual marks for dense Cartesian data", () => {
    const values = Array.from({ length: 41 }, (_, index) => ({ x: index + 0.5, y: index }));
    const scatter = createChart("#chart", {
      type: "scatter",
      onSelect: () => {},
      data: { labels: [], datasets: [{ name: "Dense", values }] },
    });
    expect(scatter.element.querySelector(".charts2-x-hit")).toBeNull();
    expect(scatter.element.querySelectorAll(".charts2-point-hit")).toHaveLength(41);
    const selected = [];
    scatter.element.parentElement.addEventListener("data-select", (event) => {
      selected.push(event.detail);
    });
    scatter.element.querySelector(".charts2-point-hit").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(selected[0]).toMatchObject({ dataset: "Dense", label: 0.5, value: 0 });
    scatter.destroy();

    const denseBars = Array.from({ length: 41 }, (_, index) => index + 1);
    const vertical = createChart("#chart", { type: "bar", data: { datasets: [{ values: denseBars }] } });
    expect(vertical.element.querySelector(".charts2-x-hit").getAttribute("fill")).toBe("transparent");
    vertical.destroy();
    const horizontal = createChart("#chart", {
      type: "bar",
      orientation: "horizontal",
      data: { datasets: [{ values: denseBars }] },
    });
    expect(horizontal.element.querySelector(".charts2-x-hit").getAttribute("fill")).toBe("transparent");
    horizontal.destroy();

    const sparse = createChart("#chart", { type: "line", data: { datasets: [{ values: [1] }, { values: [2, 3] }] } });
    expect(sparse.element.querySelectorAll(".charts2-x-hit")).toHaveLength(2);
    sparse.destroy();

    const polar = createChart("#chart", {
      type: "polar-area",
      onSelect: () => {},
      data: { labels: ["Only"], datasets: [{ values: [4] }] },
    });
    const polarSelected = [];
    polar.element.parentElement.addEventListener("data-select", (event) => {
      polarSelected.push(event.detail);
    });
    polar.element.querySelector(".charts2-mark").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(polarSelected[0]).toMatchObject({
      type: "polar-area",
      index: 0,
      label: "Only",
      x: 0,
      y: 4,
      value: 4,
      values: [4],
    });
  });

  it("renders, formats, updates, and selects timesheet work intervals", () => {
    const onSelect = vi.fn();
    const chart = createChart("#chart", {
      type: "timesheet",
      width: 320,
      onSelect,
      timesheetOptions: {
        formatTick: (date) => `T${date.getDate()}`,
        formatDate: (date) => `D${date.getDate()}`,
        formatDuration: (milliseconds) => `${milliseconds / 3_600_000} hours`,
      },
      data: {
        start: "2026-09-01T00:00:00",
        end: "2026-09-05T00:00:00",
        tasks: [
          {
            label: "Design review with a deliberately long label",
            start: "2026-09-01T00:00:00",
            end: "2026-09-02T00:00:00",
            group: "Design",
            color: "#af52de",
          },
          { label: "Build", start: "2026-09-02T00:00:00", end: "2026-09-04T00:00:00" },
        ],
      },
    });
    expect(chart.element).toHaveClass("charts2-timesheet-chart");
    expect(chart.element.querySelectorAll(".charts2-timesheet-bar")).toHaveLength(2);
    expect(chart.element.querySelector(".charts2-timesheet-task-label title").textContent).toContain(
      "deliberately long",
    );
    expect(chart.element.querySelector(".charts2-timesheet-tick").textContent).toBe("T1");
    const firstBar = chart.element.querySelector(".charts2-timesheet-bar");
    const first = chart.element.querySelector(".charts2-timesheet-hit");
    expect(firstBar.getAttribute("rx")).toBe("3");
    expect(Number(first.getAttribute("width"))).toBeGreaterThan(Number(firstBar.getAttribute("width")));
    expect(first.dataset.tooltip).toBe("Design review with a deliberately long label: D1 – D2, 24 hours, Design");
    first.focus();
    expect(tooltipFor(chart).querySelector(".charts2-tooltip-heading").textContent).toContain("Design review");
    expect(
      [...tooltipFor(chart).querySelectorAll(".charts2-tooltip-row span")].map((node) => node.textContent),
    ).toEqual(["D1 – D2"]);
    expect(tooltipFor(chart).querySelector(".charts2-tooltip-row strong").textContent).toBe("24 hours");
    first.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "timesheet",
        label: "Design review with a deliberately long label",
        duration: 86_400_000,
        group: "Design",
        color: "#af52de",
      }),
    );
    expect(chart.point(1)).toMatchObject({ label: "Build", color: "#AF52DE" });

    expect(chart.update({ tasks: [{ start: "2026-10-01T08:00:00", end: "2026-10-01T12:00:00" }] })).toBe(chart);
    expect(chart.element.querySelector(".charts2-timesheet-task-label").textContent).toBe("Task 1");
    expect(chart.element.querySelector(".charts2-timesheet-hit").dataset.tooltip).toContain("4 hours");

    const square = createChart("#chart", {
      type: "timesheet",
      timesheetOptions: { radius: 0 },
      data: { tasks: [{ start: "2026-10-01T08:00:00", end: "2026-10-01T12:00:00" }] },
    });
    expect(square.element.querySelector(".charts2-timesheet-bar").getAttribute("rx")).toBe("0");
  });

  it("validates timesheet dates, bounds, and task structure", () => {
    expect(() => createChart("#chart", timesheetOptions())).toThrow("non-empty tasks");
    expect(() => createChart("#chart", timesheetOptions({ tasks: [] }))).toThrow("non-empty tasks");
    expect(() => createChart("#chart", timesheetOptions({ tasks: [null] }))).toThrow("must be an object");
    expect(() => createChart("#chart", timesheetOptions({ tasks: [{ start: "bad", end: "2026-01-02" }] }))).toThrow(
      "valid date",
    );
    expect(() => createChart("#chart", timesheetOptions({ tasks: [{ start: "2026-01-02", end: "bad" }] }))).toThrow(
      "valid date",
    );
    expect(() =>
      createChart("#chart", timesheetOptions({ tasks: [{ start: "2026-01-02", end: "2026-01-02" }] })),
    ).toThrow("after start");
    expect(() =>
      createChart(
        "#chart",
        timesheetOptions({
          start: "2026-02-01",
          end: "2026-01-01",
          tasks: [{ start: "2026-01-01", end: "2026-01-02" }],
        }),
      ),
    ).toThrow("after start");
    expect(() =>
      createChart(
        "#chart",
        timesheetOptions({ start: "2026-01-02", tasks: [{ start: "2026-01-01", end: "2026-01-03" }] }),
      ),
    ).toThrow("contain every task");
    expect(() =>
      createChart(
        "#chart",
        timesheetOptions({ end: "2026-01-02", tasks: [{ start: "2026-01-01", end: "2026-01-03" }] }),
      ),
    ).toThrow("contain every task");
  });

  it("adapts timesheet tick units and can hide all labels", () => {
    const ranges = [
      [new Date("2026-01-01T00:00:00"), new Date("2026-01-02T00:00:00")],
      ["2026-01-01", "2026-01-12"],
      ["2026-01-01", "2027-01-01"],
      ["2020-01-01", "2025-01-01"],
      ["2000-01-01", "2020-01-01"],
    ];
    for (const [index, [start, end]] of ranges.entries()) {
      const chart = createChart("#chart", {
        type: "timesheet",
        width: 240,
        showLabels: index !== 4,
        data: { tasks: [{ start, end }] },
      });
      expect(chart.element.querySelectorAll(".charts2-timesheet-bar")).toHaveLength(1);
      if (index === 4) {
        expect(chart.element.querySelector(".charts2-timesheet-tick")).toBeNull();
        expect(chart.element.querySelector(".charts2-timesheet-task-label")).toBeNull();
      }

      if (index !== 4) {
        expect(chart.element.querySelector(".charts2-timesheet-tick")).not.toBeNull();
      }
      expect(chart.element.querySelector(".charts2-timesheet-hit").dataset.tooltip).toMatch(
        index === 0 ? /1 day/ : /days|year/,
      );
      chart.destroy();
    }

    const hours = createChart("#chart", {
      type: "timesheet",
      data: { tasks: [{ start: "2026-01-01T08:00:00", end: "2026-01-01T12:00:00" }] },
    });
    expect(hours.element.querySelector(".charts2-timesheet-hit").dataset.tooltip).toContain("4 hours");

    const bare = createChart("#chart", {
      type: "timesheet",
      width: 240,
      showAxes: false,
      showGrid: false,
      showLabels: false,
      data: { tasks: [{ start: "2026-01-01", end: "2026-01-02" }] },
    });
    expect(bare.element.querySelector(".charts2-grid")).toBeNull();
    expect(bare.element.querySelector(".charts2-axis")).toBeNull();
    expect(bare.element.querySelector("text")).toBeNull();
    expect(bare.element.querySelector(".charts2-timesheet-hit").getAttribute("x")).toBe("16");
  });
});
