import { beforeEach, describe, expect, it, vi } from "vitest";

import { BarChart, LineChart, MixedChart } from "../src/index.js";
import "../src/styles.css";

const tooltipFor = (chart) => chart.element.parentElement.querySelector(".orchid-charts-tooltip");
const widthOf = (chart) => chart.element.viewBox.baseVal.width;

const data = {
  datasets: [
    {
      name: "Alpha",
      color: "#123456",
      values: [2, -1, 4],
    },
    {
      name: "Beta",
      values: [1, 3, 2],
    },
  ],
};

describe("ChartLabels", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="chart"><span>old</span></div>';
  });
  it("groups compact color dots beside their labels without adding interaction targets", () => {
    const chart = LineChart.make("#chart")
      .dataset({
        name: "Alpha",
        color: "#123456",
        values: [2, -1, 4],
      })
      .dataset({
        name: "Beta",
        values: [1, 3, 2],
      })
      .render();
    const samples = [...chart.element.querySelectorAll(".orchid-charts-legend-swatch")];
    const labels = [...chart.element.querySelectorAll(".orchid-charts-legend")];
    expect(samples.map((sample) => sample.tagName)).toEqual(["circle", "circle"]);
    for (const [index, sample] of samples.entries()) {
      expect(sample.getAttribute("fill")).toBe(
        chart.element.querySelectorAll(".orchid-charts-line")[index].getAttribute("stroke"),
      );
      expect(labels[index].getBBox().x - (sample.getBBox().x + sample.getBBox().width)).toBe(8);
      expect(sample.getBBox().y).toBeLessThan(labels[index].getBBox().y + labels[index].getBBox().height);
      expect(sample.getBBox().width).toBe(8);
      expect(sample.getAttribute("aria-hidden")).toBe("true");
      expect(sample.hasAttribute("tabindex")).toBe(false);
    }
    const legendTop = chart.element.querySelector(".orchid-charts-legend-group").getBBox().y;
    for (const label of chart.element.querySelectorAll(".orchid-charts-label")) {
      expect(label.getBBox().y + label.getBBox().height).toBeLessThan(legendTop);
    }
    chart.destroy();
  });

  it("uses the same color dots for every series in a mixed legend", () => {
    const builder = MixedChart.make("#chart");
    for (const [index, chartType] of ["bar", "line", "scatter", "line"].entries()) {
      builder.dataset({
        chartType,
        name: `Series ${index}`,
        values: [1, 2, 3],
      });
    }
    const chart = builder.render();
    const samples = [...chart.element.querySelectorAll(".orchid-charts-legend-swatch")];
    expect(samples.map((sample) => sample.tagName)).toEqual(["circle", "circle", "circle", "circle"]);
    chart.destroy();
  });

  it("reclaims plot height when updating from multiple series to one", () => {
    const chart = LineChart.make("#chart")
      .width(400)
      .dataset({
        name: "Alpha",
        color: "#123456",
        values: [2, -1, 4],
      })
      .dataset({
        name: "Beta",
        values: [1, 3, 2],
      })
      .render();
    const plotTop = () =>
      Number(chart.element.querySelector(".orchid-charts-grid-horizontal").getAttribute("y1"));
    const originalBottom = Number(chart.element.querySelector(".orchid-charts-x-axis").getAttribute("y1"));
    expect(plotTop()).toBe(8);
    expect(chart.element.querySelector(".orchid-charts-legend-group")).not.toBeNull();

    chart.update({
      datasets: [data.datasets[0]],
    });
    expect(chart.element.querySelector(".orchid-charts-legend-group")).toBeNull();
    expect(Number(chart.element.querySelector(".orchid-charts-x-axis").getAttribute("y1"))).toBeGreaterThan(
      originalBottom,
    );
    expect(plotTop()).toBe(8);
    for (const label of chart.element.querySelectorAll(".orchid-charts-value-label")) {
      expect(label.getBBox().y).toBeGreaterThanOrEqual(0);
    }

    chart.update(data);
    expect(plotTop()).toBe(8);
    chart.destroy();
  });

  it("omits the legend when explicitly hidden", () => {
    const hidden = LineChart.make("#chart")
      .legend(false)
      .dataset({
        name: "Alpha",
        color: "#123456",
        values: [2, -1, 4],
      })
      .dataset({
        name: "Beta",
        values: [1, 3, 2],
      })
      .render();
    expect(hidden.element.querySelector(".orchid-charts-legend-group")).toBeNull();
    expect(Number(hidden.element.querySelector(".orchid-charts-grid-horizontal").getAttribute("y1"))).toBe(8);
    hidden.destroy();
  });

  it("reclaims all top padding when legend and value labels are hidden", () => {
    const bare = LineChart.make("#chart")
      .legend(false)
      .valueLabels(false)
      .dataset({
        name: "Alpha",
        color: "#123456",
        values: [2, -1, 4],
      })
      .dataset({
        name: "Beta",
        values: [1, 3, 2],
      })
      .render();
    expect(Number(bare.element.querySelector(".orchid-charts-grid-horizontal").getAttribute("y1"))).toBe(0);
  });

  it("keeps first and last x labels inside the SVG without wrapping", () => {
    const labels = [
      "Initial calibration window",
      "After first adjustment",
      "Post-validation measurement",
      "Final stabilized sample",
    ];
    const chart = LineChart.make("#chart")
      .width(900)
      .labels(labels)
      .dataset({
        values: [1, 2, 1.5, 3],
      })
      .render();
    const nodes = [...chart.element.querySelectorAll(".orchid-charts-label:not(.orchid-charts-value-label)")];
    const boxes = nodes.map((node) => node.getBBox());
    expect(nodes.map((node) => node.textContent)).toEqual(labels);
    expect(nodes.map((node) => node.getAttribute("text-anchor"))).toEqual([
      "start",
      "middle",
      "middle",
      "end",
    ]);
    expect(nodes.every((node) => node.querySelector("tspan") === null)).toBe(true);
    expect(boxes[0].x).toBeGreaterThanOrEqual(0);
    // Chromium's Linux font metrics can extend the visual bounding box by a
    // fraction of a pixel even though the label is anchored at the plot edge.
    expect(boxes.at(-1).x + boxes.at(-1).width).toBeLessThanOrEqual(900.5);
    const precedingBoxes = boxes.slice(0, -1);
    for (const [index, box] of precedingBoxes.entries()) {
      expect(box.x + box.width).toBeLessThanOrEqual(boxes[index + 1].x);
    }
    chart.destroy();

    const narrow = LineChart.make("#chart")
      .width(240)
      .labels([labels[0], labels.at(-1)])
      .dataset({
        values: [1, 2],
      })
      .render();
    const narrowNodes = [
      ...narrow.element.querySelectorAll(".orchid-charts-label:not(.orchid-charts-value-label)"),
    ];
    const narrowBoxes = narrowNodes.map((node) => node.getBBox());
    expect(narrowNodes.map((node) => node.textContent)).toEqual([labels[0]]);
    expect(narrowNodes.every((node) => node.querySelector("tspan") === null)).toBe(true);
    expect(narrowBoxes[0].x).toBeGreaterThanOrEqual(0);
    expect(narrowBoxes[0].x + narrowBoxes[0].width).toBeLessThanOrEqual(widthOf(narrow) + 0.5);
  });

  it("places the Y-axis and its labels on the right without overflow", () => {
    const line = LineChart.make("#chart")
      .width(220)
      .yAxis((axis) => axis.position("right"))
      .labels(["A", "B", "C"])
      .dataset({
        values: [0.00009, 0.00014, 0.00021],
      })
      .render();
    const valueLabels = [...line.element.querySelectorAll(".orchid-charts-value-label")];
    const plotRight = Number(line.element.querySelector(".orchid-charts-grid-horizontal").getAttribute("x2"));
    expect(valueLabels.every((label) => label.getAttribute("text-anchor") === "start")).toBe(true);
    expect(valueLabels.every((label) => Number(label.getAttribute("x")) === plotRight + 5)).toBe(true);
    expect(
      Math.max(...valueLabels.map((label) => label.getBBox().x + label.getBBox().width)),
    ).toBeLessThanOrEqual(220);
    expect(Number(line.element.querySelector(".orchid-charts-grid-horizontal").getAttribute("x1"))).toBe(0);
    const lastHit = [...line.element.querySelectorAll(".orchid-charts-x-hit")].at(-1);
    expect(Number(lastHit.getAttribute("x")) + Number(lastHit.getAttribute("width"))).toBe(plotRight);
    line.destroy();

    const horizontal = BarChart.make("#chart")
      .width(240)
      .horizontal()
      .yAxis((axis) => axis.position("right"))
      .labels(["North America", "Europe", "Asia-Pacific"])
      .dataset({
        values: [42, 36, 54],
      })
      .render();
    const categoryLabels = [
      ...horizontal.element.querySelectorAll(".orchid-charts-label:not(.orchid-charts-value-label)"),
    ];
    const axisX = Number(horizontal.element.querySelector(".orchid-charts-y-axis").getAttribute("x1"));
    expect(categoryLabels.every((label) => label.getAttribute("text-anchor") === "start")).toBe(true);
    expect(categoryLabels.every((label) => Number(label.getAttribute("x")) === axisX + 4)).toBe(true);
    expect(
      Math.max(...categoryLabels.map((label) => label.getBBox().x + label.getBBox().width)),
    ).toBeLessThanOrEqual(240);
  });

  it("uses an explicit label formatter without changing source data or interaction labels", () => {
    const sourceLabels = ["North America", "Europe", "Asia-Pacific"];
    const formatLabel = vi.fn((label) => `Region: ${label}`);
    const chart = BarChart.make("#chart")
      .horizontal()
      .width(640)
      .formatLabel(formatLabel)
      .labels(sourceLabels)
      .dataset({
        values: [9_800_000, 12_750_000, 6_450_000],
      })
      .render();
    const labels = [...chart.element.querySelectorAll(".orchid-charts-multiline-label")];
    expect(labels.map((label) => label.textContent)).toEqual(sourceLabels.map((label) => `Region: ${label}`));
    expect(labels.map((label) => label.getAttribute("aria-label"))).toEqual(sourceLabels);
    expect(chart.point(0).label).toBe(sourceLabels[0]);
    chart.element
      .querySelector(".orchid-charts-x-hit")
      .dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
    expect(tooltipFor(chart).querySelector(".orchid-charts-tooltip-heading").textContent).toBe(
      `Region: ${sourceLabels[0]}`,
    );
    chart.destroy();
  });

  it("preserves explicit formatter lines on horizontal category axes", () => {
    const chart = BarChart.make("#chart")
      .horizontal()
      .formatLabel(() => ["Партнёрские интеграции", "проверка доступности", "и локализации"])
      .labels(["Партнёрские интеграции с проверкой"])
      .dataset({
        values: [61],
      })
      .render();
    const label = chart.element.querySelector(".orchid-charts-multiline-label");

    expect([...label.querySelectorAll("tspan")].map((line) => line.textContent)).toEqual([
      "Партнёрские интеграции",
      "проверка доступности",
      "и локализации",
    ]);
    expect(label.getAttribute("aria-label")).toBe("Партнёрские интеграции с проверкой");
  });

  it("balances ordinary long horizontal labels without browser-dependent SVG wrapping", () => {
    const chart = BarChart.make("#chart")
      .horizontal()
      .width(320)
      .labels(["Partner integrations with availability and localization review"])
      .dataset({
        values: [61],
      })
      .render();
    const lines = [...chart.element.querySelectorAll(".orchid-charts-multiline-label tspan")];

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.length).toBeLessThanOrEqual(3);
    expect(lines.every((line) => !line.textContent.includes("…"))).toBe(true);
  });

  it.each([null, [], ["Valid", 1]])("rejects invalid formatted labels: %j", (formatted) => {
    expect(() =>
      BarChart.make("#chart")
        .horizontal()
        .formatLabel(() => formatted)
        .labels(["A"])
        .dataset({
          values: [1],
        })
        .render(),
    ).toThrow("Label formatter");
  });
});
