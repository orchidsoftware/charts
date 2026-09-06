import { beforeEach, describe, expect, it } from "vitest";

import { BarChart, LineChart, MixedChart, PolarAreaChart, ScatterChart } from "../src/index.js";
import "../src/styles.css";

const series = {
  labels: [
    "A",
    "B",
    "C",
  ],
  datasets: [
    {
      name: "One",
      values: [
        2,
        4,
        -1,
      ],
    },
  ],
};
beforeEach(() => {
  document.body.innerHTML = '<div id="chart" style="width: 640px"></div>';
});
describe("Cartesian Rendering", () => {
  it("renders scatter and mixed marks with shared annotations", () => {
    const scatter = ScatterChart.make("#chart")
      .labels(series.labels)
      .dataset({
        name: "One",
        values: [
          2,
          4,
          -1,
        ],
      })
      .render();
    expect(scatter.element.querySelectorAll(".orchid-charts-scatter")).toHaveLength(3);
    expect(scatter.element.querySelector(".orchid-charts-scatter").getAttribute("fill")).toBe(
      "var(--orchid-charts-point-fill)",
    );
    expect(scatter.element.querySelector(".orchid-charts-scatter").getAttribute("stroke")).toBe("#007AFF");
    expect(scatter.element.querySelector(".orchid-charts-scatter").getAttribute("opacity")).toBe("1");
    expect(getComputedStyle(scatter.element.querySelector(".orchid-charts-scatter")).strokeWidth).toBe("3px");
    expect(scatter.element.querySelectorAll(".orchid-charts-point-halo")).toHaveLength(3);
    scatter.destroy();

    const mixed = MixedChart.make("#chart")
      .tooltip((tooltip) => tooltip.formatLabel((value) => `X ${value}`))
      .tooltip((tooltip) => tooltip.formatValue((value) => `$${value}`))
      .labels([
        "A",
        "B",
      ])
      .dataset({
        name: "Line",
        chartType: "line",
        values: [
          1,
          3,
        ],
      })
      .dataset({
        name: "Positive",
        chartType: "bar",
        values: [
          2,
          4,
        ],
      })
      .dataset({
        name: "Negative",
        chartType: "bar",
        values: [
          -1,
          -2,
        ],
      })
      .marker({ value: 2, label: "Target" })
      .region({
        label: "Expected range",
        range: [
          1,
          3,
        ],
      })
      .render();
    expect(mixed.element.querySelectorAll(".orchid-charts-region")).toHaveLength(1);
    expect(mixed.element.querySelectorAll(".orchid-charts-marker")).toHaveLength(1);
    expect(mixed.element.textContent).toContain("Target");
    expect(mixed.point(0)).toMatchObject({ dataset: "Line", label: "A", y: 1 });
    const mixedBar = mixed.element.querySelector(".orchid-charts-bar");
    const mixedHalo = mixed.element.querySelector(".orchid-charts-point-halo");
    const mixedPoint = mixed.element.querySelector(".orchid-charts-point");
    expect(mixedBar.compareDocumentPosition(mixedHalo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(mixedHalo.compareDocumentPosition(mixedPoint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(getComputedStyle(mixedHalo).stroke).toBe(getComputedStyle(mixedPoint).fill);
  });
  it("supports horizontal annotations, region fill, hidden line parts, and long summaries", () => {
    const horizontal = BarChart.make("#chart")
      .horizontal()
      .labels([
        "A",
        "B",
        "C",
      ])
      .dataset({
        name: "One",
        values: [
          2,
          4,
          -1,
        ],
      })
      .marker({ value: 2, label: "Target" })
      .region({
        label: "Expected range",
        range: [
          0,
          3,
        ],
      })
      .render();
    expect(horizontal.element.querySelector(".orchid-charts-region").getAttribute("x")).not.toBeNull();
    expect(horizontal.element.querySelector(".orchid-charts-marker").getAttribute("x1")).toBe(
      horizontal.element.querySelector(".orchid-charts-marker").getAttribute("x2"),
    );
    horizontal.destroy();

    const filled = LineChart.make("#chart")
      .area(true)
      .dots(false)
      .labels(series.labels)
      .dataset({
        name: "One",
        values: [
          2,
          4,
          -1,
        ],
      })
      .render();
    expect(filled.element.querySelector(".orchid-charts-area")).not.toBeNull();
    expect(filled.element.querySelector(".orchid-charts-point")).toBeNull();
    filled.destroy();
    const points = Array.from({ length: 201 }, (_, index) => index);
    const long = LineChart.make("#chart").dataset({ values: points }).render();
    expect(long.element.querySelectorAll(".orchid-charts-mark")).toHaveLength(1);
    expect(long.element.querySelector(".orchid-charts-mark").dataset.tooltip).toContain("201 points");
    expect(long.element.querySelector(".orchid-charts-mark").dataset.tooltip).toContain("range 0–200");
    expect(long.element.querySelector(".orchid-charts-mark").dataset.tooltip.length).toBeLessThan(100);
    long.destroy();
    const denseHorizontal = BarChart.make("#chart")
      .horizontal()
      .dataset({ values: Array.from({ length: 65 }, (_, index) => index) })
      .render();
    expect(denseHorizontal.element.querySelectorAll(".orchid-charts-bar.orchid-charts-mark")).toHaveLength(
      65,
    );
    expect(denseHorizontal.element.querySelector(".orchid-charts-x-hit")).toBeNull();
    denseHorizontal.destroy();
    const hidden = LineChart.make("#chart")
      .line(false)
      .dotSize(6)
      .labels(series.labels)
      .dataset({
        name: "One",
        values: [
          2,
          4,
          -1,
        ],
      })
      .render();
    expect(hidden.element.querySelector(".orchid-charts-line")).toBeNull();
    expect(hidden.element.querySelector(".orchid-charts-point").getAttribute("r")).toBe("6");
  });
  it("smooths line geometry without overshooting and allows straight segments", () => {
    const smooth = LineChart.make("#chart")
      .labels([
        "A",
        "B",
        "C",
      ])
      .dataset({
        values: [
          0,
          10,
          0,
        ],
      })
      .render();
    const path = smooth.element.querySelector(".orchid-charts-line").getAttribute("d");
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

    const straight = LineChart.make("#chart")
      .smooth(false)
      .labels(series.labels)
      .dataset({
        name: "One",
        values: [
          2,
          4,
          -1,
        ],
      })
      .render();
    expect(straight.element.querySelector(".orchid-charts-line").getAttribute("d")).toContain("L");
    expect(straight.element.querySelector(".orchid-charts-line").getAttribute("d")).not.toContain("C");
  });
  it("rounds only the value-facing outer end of signed and stacked bars", () => {
    const signed = BarChart.make("#chart")
      .radius(4)
      .labels([
        "Loss",
        "Zero",
        "Gain",
      ])
      .dataset({
        values: [
          -10,
          0,
          10,
        ],
      })
      .render();
    const signedBars = [
      ...signed.element.querySelectorAll(".orchid-charts-bar"),
    ];
    expect(signedBars[0].getAttribute("d")).toContain("Q");
    expect(signedBars[1].getAttribute("d")).not.toContain("Q");
    expect(signedBars[2].getAttribute("d")).toContain("Q");
    signed.destroy();

    const stacked = BarChart.make("#chart")
      .stacked(true)
      .radius(4)
      .labels([
        "Total",
      ])
      .dataset({
        name: "Positive base",
        values: [
          5,
        ],
      })
      .dataset({
        name: "Positive cap",
        values: [
          3,
        ],
      })
      .dataset({
        name: "Negative base",
        values: [
          -4,
        ],
      })
      .dataset({
        name: "Negative cap",
        values: [
          -2,
        ],
      })
      .render();
    const stackedBars = [
      ...stacked.element.querySelectorAll(".orchid-charts-bar"),
    ];
    expect(stackedBars.map((bar) => bar.getAttribute("d").includes("Q"))).toEqual([
      false,
      true,
      false,
      true,
    ]);
    stacked.destroy();

    const sparseStack = BarChart.make("#chart")
      .stacked(true)
      .labels([
        "A",
        "B",
      ])
      .dataset({
        name: "Base",
        values: [
          5,
          4,
        ],
      })
      .dataset({
        name: "Additional",
        values: [
          2,
          0,
        ],
      })
      .render();
    expect(sparseStack.element.querySelectorAll(".orchid-charts-bar")).toHaveLength(4);
    sparseStack.destroy();

    const square = BarChart.make("#chart")
      .radius(0)
      .labels(series.labels)
      .dataset({
        name: "One",
        values: [
          2,
          4,
          -1,
        ],
      })
      .render();
    expect(
      [
        ...square.element.querySelectorAll(".orchid-charts-bar"),
      ].every((bar) => !bar.getAttribute("d").includes("Q")),
    ).toBe(true);
    square.destroy();

    const horizontalLoss = BarChart.make("#chart")
      .horizontal()
      .dataset({
        values: [
          -5,
        ],
      })
      .render();
    expect(horizontalLoss.element.querySelector(".orchid-charts-bar").getAttribute("d")).toContain("Q");
  });
  it("renders the demo stress matrix through the shared Cartesian pipeline", () => {
    const labels = [
      "A",
      "B",
      "C",
      "D",
    ];
    const gradient = LineChart.make("#chart")
      .gradient(true)
      .labels(labels)
      .dataset({
        name: "Current",
        values: [
          2,
          5,
          4,
          8,
        ],
      })
      .dataset({
        name: "Forecast",
        values: [
          3,
          4,
          6,
          9,
        ],
      })
      .dataset({
        name: "Previous",
        values: [
          1,
          3,
          3,
          6,
        ],
      })
      .render();
    expect(gradient.element.querySelectorAll("linearGradient")).toHaveLength(3);
    expect(gradient.element.querySelectorAll(".orchid-charts-area")).toHaveLength(3);
    expect(gradient.element.querySelectorAll(".orchid-charts-line")).toHaveLength(3);
    gradient.destroy();

    const mixed = MixedChart.make("#chart")
      .labels(labels)
      .dataset({
        name: "Actual",
        chartType: "bar",
        values: [
          -3,
          5,
          0,
          8,
        ],
      })
      .dataset({
        name: "Target",
        chartType: "line",
        values: [
          2,
          3,
          4,
          5,
        ],
      })
      .dataset({
        name: "Capacity",
        chartType: "line",
        values: [
          6,
          6,
          7,
          7,
        ],
      })
      .render();
    expect(mixed.element.querySelectorAll(".orchid-charts-bar")).toHaveLength(4);
    expect(mixed.element.querySelectorAll(".orchid-charts-line")).toHaveLength(2);
    expect(mixed.element.querySelectorAll(".orchid-charts-x-hit")).toHaveLength(4);
    expect(mixed.point(0)).toMatchObject({ dataset: "Actual", chartType: "bar", y: -3 });
    expect(mixed.point(4)).toMatchObject({ dataset: "Target", chartType: "line", y: 2 });
    mixed.destroy();

    const narrowMixed = MixedChart.make("#chart")
      .width(220)
      .height(520)
      .labels(labels)
      .dataset({
        name: "Daily change",
        chartType: "bar",
        values: [
          -18,
          9,
          -6,
          22,
        ],
      })
      .dataset({
        name: "Rolling trend",
        chartType: "line",
        values: [
          -8,
          -4,
          -2,
          5,
        ],
      })
      .dataset({
        name: "Alert threshold",
        chartType: "line",
        values: [
          12,
          12,
          12,
          12,
        ],
      })
      .render();
    const narrowLegendRows = new Set(
      [
        ...narrowMixed.element.querySelectorAll(".orchid-charts-legend"),
      ].map((item) => item.getAttribute("y")),
    );
    const narrowLegend = narrowMixed.element.querySelector(".orchid-charts-legend-group").getBBox();
    const narrowPlotBottom = Number(
      narrowMixed.element.querySelector(".orchid-charts-x-axis").getAttribute("y1"),
    );
    expect(narrowLegendRows.size).toBeGreaterThan(1);
    expect(narrowPlotBottom).toBeLessThan(narrowLegend.y);
    expect(narrowMixed.element.querySelectorAll(".orchid-charts-x-hit")).toHaveLength(4);
    narrowMixed.destroy();

    const grouped = BarChart.make("#chart")
      .horizontal()
      .labels(labels.slice(0, 3))
      .dataset({
        name: "Critical",
        values: [
          3,
          5,
          2,
        ],
      })
      .dataset({
        name: "Standard",
        values: [
          7,
          8,
          6,
        ],
      })
      .dataset({
        name: "Deferred",
        values: [
          4,
          3,
          5,
        ],
      })
      .render();
    expect(grouped.element.querySelectorAll(".orchid-charts-bar.orchid-charts-visual-mark")).toHaveLength(9);
    expect(grouped.element.querySelectorAll(".orchid-charts-legend")).toHaveLength(3);
    grouped.destroy();

    const stacked = BarChart.make("#chart")
      .horizontal()
      .stacked(true)
      .labels(labels.slice(0, 3))
      .dataset({
        name: "Done",
        values: [
          3,
          5,
          2,
        ],
      })
      .dataset({
        name: "Open",
        values: [
          7,
          8,
          6,
        ],
      })
      .render();
    const stackedBars = [
      ...stacked.element.querySelectorAll(".orchid-charts-bar.orchid-charts-visual-mark"),
    ];
    expect(stackedBars).toHaveLength(6);
    expect(stackedBars[0].getBBox().y).toBe(stackedBars[3].getBBox().y);
    expect(stackedBars[3].getBBox().x).toBeCloseTo(
      stackedBars[0].getBBox().x + stackedBars[0].getBBox().width,
    );
    stacked.destroy();

    const denseLabels = Array.from({ length: 48 }, (_, index) => `W${index + 1}`);
    const dense = LineChart.make("#chart")
      .labels(denseLabels)
      .dataset({ name: "Observed", values: denseLabels.map((_, index) => index % 9) })
      .dataset({ name: "Baseline", values: denseLabels.map((_, index) => (index + 3) % 7) })
      .render();
    expect(dense.element.querySelector(".orchid-charts-line.orchid-charts-mark")).toBeNull();
    expect(dense.element.querySelector(".orchid-charts-point")).toBeNull();
    expect(dense.element.querySelectorAll(".orchid-charts-x-hit")).toHaveLength(48);
    expect(JSON.parse(dense.element.querySelector(".orchid-charts-x-hit").dataset.tooltipItems)).toHaveLength(
      2,
    );
    dense.destroy();
  });
  it("covers sparse stacking, fallback labels, and horizontal marker labels", () => {
    const chart = BarChart.make("#chart")
      .horizontal()
      .stacked(true)
      .dataset({
        name: "Series 1",
        values: [
          2,
          0,
        ],
      })
      .dataset({
        name: "Series 2",
        values: [
          3,
          -1,
        ],
      })
      .dataset({
        name: "Series 3",
        values: [
          4,
          -2,
        ],
      })
      .marker({ value: 2, label: "Goal" })
      .render();
    expect(chart.element.textContent).toContain("Goal");
    expect(chart.element.querySelector(".orchid-charts-x-hit").dataset.tooltip).toBe(
      "1 — Series 1: 2 · Series 2: 3 · Series 3: 4",
    );
    expect(chart.element.querySelectorAll(".orchid-charts-x-hit")).toHaveLength(2);

    const defaultLayerMixed = MixedChart.make("#chart")
      .dataset({
        name: "Bars",
        chartType: "bar",
        values: [
          2,
          3,
        ],
      })
      .dataset({
        name: "Line",
        chartType: "line",
        values: [
          1,
          2,
        ],
      })
      .render();
    expect(defaultLayerMixed.element.querySelector(".orchid-charts-line")).not.toBeNull();
    defaultLayerMixed.destroy();

    const lineOnlyMixed = MixedChart.make("#chart")
      .dataset({
        chartType: "line",
        values: [
          1,
          2,
        ],
      })
      .render();
    expect(lineOnlyMixed.element.querySelector(".orchid-charts-bar")).toBeNull();
    lineOnlyMixed.destroy();
  });
  it("falls back to individual marks for dense Cartesian data", () => {
    const values = Array.from({ length: 41 }, (_, index) => ({ x: index + 0.5, y: index }));
    const scatter = ScatterChart.make("#chart")
      .onSelect(() => {})
      .labels([])
      .dataset({ name: "Dense", values })
      .render();
    expect(scatter.element.querySelector(".orchid-charts-x-hit")).toBeNull();
    expect(scatter.element.querySelectorAll(".orchid-charts-point-hit")).toHaveLength(41);
    const selected = [];
    scatter.element.parentElement.addEventListener("data-select", (event) => {
      selected.push(event.detail);
    });
    scatter.element
      .querySelector(".orchid-charts-point-hit")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(selected[0]).toMatchObject({ dataset: "Dense", label: 0.5, value: 0 });
    scatter.destroy();

    const denseBars = Array.from({ length: 41 }, (_, index) => index + 1);
    const vertical = BarChart.make("#chart").dataset({ values: denseBars }).render();
    expect(vertical.element.querySelector(".orchid-charts-x-hit").getAttribute("fill")).toBe("transparent");
    vertical.destroy();
    const horizontal = BarChart.make("#chart").horizontal().dataset({ values: denseBars }).render();
    expect(horizontal.element.querySelector(".orchid-charts-x-hit").getAttribute("fill")).toBe("transparent");
    horizontal.destroy();

    const sparse = LineChart.make("#chart")
      .dataset({
        name: "First",
        values: [
          1,
          0,
        ],
      })
      .dataset({
        name: "Second",
        values: [
          2,
          3,
        ],
      })
      .render();
    expect(sparse.element.querySelectorAll(".orchid-charts-x-hit")).toHaveLength(2);
    sparse.destroy();

    const polar = PolarAreaChart.make("#chart")
      .onSelect(() => {})
      .labels([
        "Only",
      ])
      .dataset({
        values: [
          4,
        ],
      })
      .render();
    const polarSelected = [];
    polar.element.parentElement.addEventListener("data-select", (event) => {
      polarSelected.push(event.detail);
    });
    polar.element
      .querySelector(".orchid-charts-mark")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(polarSelected[0]).toMatchObject({
      type: "polar-area",
      index: 0,
      label: "Only",
      x: 0,
      y: 4,
      value: 4,
      values: [
        4,
      ],
    });
  });
});
