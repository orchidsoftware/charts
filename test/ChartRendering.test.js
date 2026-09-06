import { beforeEach, describe, expect, it } from "vitest";

import { BarChart, BubbleChart, LineChart, PolarAreaChart, RadarChart } from "../src/index.js";
import "../src/styles.css";

const tooltipFor = (chart) => chart.element.parentElement.querySelector(".orchid-charts-tooltip");
const widthOf = (chart) => chart.element.viewBox.baseVal.width;

describe("ChartRendering", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="chart"><span>old</span></div>';
  });
  it("renders a labelled gradient line with native hover titles", () => {
    const chart = LineChart.make("#chart")
      .gradient(true)
      .labels(["Mon", "Tue", "Wed"])
      .dataset({
        name: "Revenue",
        values: [1, 4, 2],
      })
      .render();
    expect(chart.element.querySelectorAll("linearGradient stop")).toHaveLength(2);
    expect(chart.element.querySelector(".orchid-charts-area").getAttribute("fill")).toContain(
      "orchid-charts-gradient-",
    );
    expect(chart.element.querySelectorAll(".orchid-charts-grid-horizontal")).toHaveLength(5);
    expect(chart.element.querySelectorAll(".orchid-charts-grid-vertical")).toHaveLength(0);
    expect(
      [...chart.element.querySelectorAll(".orchid-charts-grid")].map((line) => line.dataset.tick),
    ).toEqual(
      [...chart.element.querySelectorAll(".orchid-charts-value-label")].map((label) => label.textContent),
    );
    expect(chart.element.querySelectorAll(".orchid-charts-point title")).toHaveLength(3);
    expect(chart.element.querySelector(".orchid-charts-point title").textContent).toBe("Mon: 1");
    expect(chart.element.querySelector(".orchid-charts-point").getAttribute("fill")).toBe(
      "var(--orchid-charts-point-fill)",
    );
    expect(chart.element.querySelector(".orchid-charts-point").getAttribute("stroke")).toBe("#007AFF");
    expect(chart.element.querySelector(".orchid-charts-point").getAttribute("r")).toBe("3");
    expect(getComputedStyle(chart.element.querySelector(".orchid-charts-point")).strokeWidth).toBe("2px");
    const halo = chart.element.querySelector(".orchid-charts-point-halo");
    expect(halo.getAttribute("cx")).toBe(
      chart.element.querySelector(".orchid-charts-point").getAttribute("cx"),
    );
    expect(halo.getAttribute("cy")).toBe(
      chart.element.querySelector(".orchid-charts-point").getAttribute("cy"),
    );
    expect(getComputedStyle(halo).strokeWidth).toBe("3px");
    expect(halo.querySelector("title")).toBeNull();
    expect(
      [...chart.element.querySelectorAll(".orchid-charts-label:not(.orchid-charts-value-label)")].map(
        (node) => node.textContent,
      ),
    ).toEqual(["Mon", "Tue", "Wed"]);
  });

  it("renders vertical grouped bars for positive and negative values", () => {
    const chart = BarChart.make(document.querySelector("#chart"))
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
    const bars = [...chart.element.querySelectorAll(".orchid-charts-bar.orchid-charts-visual-mark")];
    expect(bars).toHaveLength(6);
    expect(bars[0].getBBox().height).toBeGreaterThan(0);
    expect(bars[1].getBBox().height).toBeGreaterThan(0);

    const firstBand = chart.element.querySelector(".orchid-charts-x-hit[data-point-index='0']");
    const bandStart = Number(firstBand.getAttribute("x"));
    const bandEnd = bandStart + Number(firstBand.getAttribute("width"));
    const firstCategoryBars = bars.filter((bar) => bar.dataset.pointIndex === "0");
    expect(firstCategoryBars).toHaveLength(2);
    expect(firstCategoryBars.every((bar) => bar.getBBox().x >= bandStart)).toBe(true);
    expect(firstCategoryBars.every((bar) => bar.getBBox().x + bar.getBBox().width <= bandEnd)).toBe(true);
  });

  it("lays out horizontal bar groups and shared hover feedback", () => {
    const chart = BarChart.make("#chart")
      .horizontal()
      .labels(["One", "Two", "Three"])
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
    const bars = chart.element.querySelectorAll(".orchid-charts-bar.orchid-charts-visual-mark");
    expect(bars).toHaveLength(6);
    expect(bars[0].getBBox().width).toBeGreaterThan(0);
    expect(bars[1].getBBox().width).toBeGreaterThan(0);
    expect(Math.max(...[...bars].map((bar) => bar.getBBox().y + bar.getBBox().height))).toBeLessThanOrEqual(
      292,
    );
    const labels = [
      ...chart.element.querySelectorAll(".orchid-charts-label:not(.orchid-charts-value-label)"),
    ];
    expect(labels.map((label) => label.textContent)).toEqual(["One", "Two", "Three"]);
    expect(labels.every((label) => label.getAttribute("text-anchor") === "end")).toBe(true);
    const axisX = Number(chart.element.querySelector(".orchid-charts-axis").getAttribute("x1"));
    expect(axisX).toBeLessThan(45);
    expect(labels.every((label) => Number(label.getAttribute("x")) === axisX - 4)).toBe(true);
    expect(chart.element.classList.contains("orchid-charts-horizontal-bar")).toBe(true);
    expect(chart.element.querySelectorAll(".orchid-charts-grid-horizontal")).toHaveLength(0);
    expect(chart.element.querySelectorAll(".orchid-charts-grid-vertical")).toHaveLength(6);
    chart.element
      .querySelector(".orchid-charts-x-hit")
      .dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 90, clientY: 40 }));
    expect(tooltipFor(chart).hidden).toBe(false);
    expect(tooltipFor(chart).querySelector(".orchid-charts-tooltip-heading").textContent).toBe("One");
    expect(
      [...tooltipFor(chart).querySelectorAll(".orchid-charts-tooltip-row strong")].map(
        (node) => node.textContent,
      ),
    ).toEqual(["2", "1"]);
    const tooltipSwatches = [...tooltipFor(chart).querySelectorAll(".orchid-charts-series-swatch")];
    expect(tooltipSwatches).toHaveLength(2);
    expect(
      tooltipSwatches.every(
        (swatch) =>
          getComputedStyle(swatch).width === "8px" && getComputedStyle(swatch).borderRadius === "50%",
      ),
    ).toBe(true);
    expect(tooltipSwatches.every((swatch) => swatch.getAttribute("aria-hidden") === "true")).toBe(true);
    expect(Number(tooltipFor(chart).style.left.replace("px", ""))).toBeGreaterThan(0);
    chart.element.dispatchEvent(new MouseEvent("mouseleave"));
    expect(tooltipFor(chart).hidden).toBe(true);
    chart.destroy();
  });

  it("resizes unlabeled horizontal bars without opening an empty tooltip", () => {
    document.querySelector("#chart").style.width = "500px";
    const unlabelled = BarChart.make("#chart")
      .horizontal()
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
    expect(unlabelled.element.querySelector(".orchid-charts-bar title").textContent).toBe("Alpha, 1: 2");
    expect(widthOf(unlabelled)).toBe(500);
    document.querySelector("#chart").style.width = "560px";
    dispatchEvent(new Event("resize"));
    expect(widthOf(unlabelled)).toBe(560);
    unlabelled.element.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
    expect(tooltipFor(unlabelled).hidden).toBe(true);
    unlabelled.destroy();
  });

  it("renders bubbles using point radii", () => {
    const chart = BubbleChart.make("#chart")
      .dataset({
        values: [
          { x: 2, y: 4, r: 9 },
          { x: 3, y: 2, r: 5 },
        ],
      })
      .render();
    const bubbles = chart.element.querySelectorAll(".orchid-charts-bubble.orchid-charts-visual-mark");
    expect(bubbles[0].getAttribute("r")).toBe("9");
    expect(bubbles[1].getAttribute("r")).toBe("5");
    expect(bubbles[0].getAttribute("opacity")).toBe("0.65");
    expect(chart.element.querySelectorAll(".orchid-charts-grid-vertical")).toHaveLength(0);
  });

  it("reserves a separate legend row beneath the radar frame", () => {
    const chart = RadarChart.make("#chart")
      .width(240)
      .height(320)
      .labels(["Speed", "DX", "A11y", "Quality", "Size", "Stability"])
      .dataset({
        name: "Current",
        color: "#007aff",
        values: [2, 0, 4, 2, 3, 1],
      })
      .dataset({
        name: "Previous",
        color: "#34c759",
        values: [1, 2, 3, 4, 2, 3],
      })
      .dataset({
        name: "Target",
        color: "#af52de",
        values: [4, 4, 4, 4, 4, 4],
      })
      .render();
    expect(chart.element.querySelectorAll("line.orchid-charts-grid")).toHaveLength(6);
    expect(chart.element.querySelectorAll(".orchid-charts-radar")).toHaveLength(3);
    expect(chart.element.textContent).toContain("A11y");
    const legendBox = chart.element.querySelector(".orchid-charts-legend-group").getBBox();
    const frameBox = chart.element.querySelector(".orchid-charts-radar-frame").getBBox();
    expect(frameBox.y + frameBox.height).toBeLessThan(legendBox.y);
    const legendLabels = [...chart.element.querySelectorAll(".orchid-charts-legend")];
    const legendSwatches = [...chart.element.querySelectorAll(".orchid-charts-legend-swatch")];
    expect(
      legendSwatches.every((swatch) => swatch.tagName === "circle" && swatch.getAttribute("r") === "4"),
    ).toBe(true);
    expect(legendSwatches.every((swatch) => swatch.getAttribute("aria-hidden") === "true")).toBe(true);
    expect(
      legendLabels.map(
        (label) =>
          Number(label.getAttribute("x")) -
          (Number(legendSwatches[legendLabels.indexOf(label)].getAttribute("cx")) - 4),
      ),
    ).toEqual([16, 16, 16]);
    expect(new Set(legendLabels.map((label) => label.getAttribute("y")))).toEqual(new Set(["317"]));
    expect(
      legendSwatches[1].getBBox().x - (legendLabels[0].getBBox().x + legendLabels[0].getBBox().width),
    ).toBeGreaterThanOrEqual(14);
  });

  it("inspects every radar dataset including zero values in a structured tooltip", () => {
    const chart = RadarChart.make("#chart")
      .width(240)
      .height(320)
      .labels(["Speed", "DX", "A11y", "Quality", "Size", "Stability"])
      .dataset({
        name: "Current",
        color: "#007aff",
        values: [2, 0, 4, 2, 3, 1],
      })
      .dataset({
        name: "Previous",
        color: "#34c759",
        values: [1, 2, 3, 4, 2, 3],
      })
      .dataset({
        name: "Target",
        color: "#af52de",
        values: [4, 4, 4, 4, 4, 4],
      })
      .render();
    const polygons = [...chart.element.querySelectorAll(".orchid-charts-radar")];
    expect(polygons.every((polygon) => polygon.getAttribute("stroke-linejoin") === "round")).toBe(true);
    expect(polygons.every((polygon) => polygon.getAttribute("stroke-linecap") === "round")).toBe(true);
    const axes = chart.element.querySelectorAll(".orchid-charts-radar-axis");
    expect(axes).toHaveLength(6);
    axes[0].focus();
    expect(tooltipFor(chart).querySelector(".orchid-charts-tooltip-heading").textContent).toBe("Speed");
    expect(
      [...tooltipFor(chart).querySelectorAll(".orchid-charts-tooltip-row span")].map(
        (node) => node.textContent,
      ),
    ).toEqual(["Current", "Previous", "Target"]);
    expect(tooltipFor(chart).querySelectorAll(".orchid-charts-tooltip-row")).toHaveLength(3);
    expect(
      [...tooltipFor(chart).querySelectorAll(".orchid-charts-tooltip-row strong")].map(
        (node) => node.textContent,
      ),
    ).toEqual(["2", "1", "4"]);
    axes[1].focus();
    expect(tooltipFor(chart).querySelector(".orchid-charts-tooltip-heading").textContent).toBe("DX");
    expect(tooltipFor(chart).querySelector(".orchid-charts-tooltip-row strong").textContent).toBe("0");
    expect(tooltipFor(chart).getBoundingClientRect().width).toBeLessThanOrEqual(240);
    expect(polygons.every((polygon) => polygon.querySelector(":scope > title") === null)).toBe(true);
  });

  it("renders polar-area slices including a full-circle slice", () => {
    const chart = PolarAreaChart.make("#chart")
      .labels(["A", "B", "C", "D"])
      .dataset({
        values: [2, 4, 2, 1],
      })
      .render();
    expect(chart.element.querySelectorAll(".orchid-charts-polar-area")).toHaveLength(4);
    expect(chart.element.textContent).toContain("D");
    const single = PolarAreaChart.make("#chart")
      .labels(["Only"])
      .dataset({
        values: [1],
      })
      .render();
    expect(single.element.querySelector("circle.orchid-charts-polar-area")).not.toBeNull();
  });

  it("keeps polar-area labels inside a narrow SVG", () => {
    const chart = PolarAreaChart.make("#chart")
      .width(220)
      .height(280)
      .labels(["Social", "Entertainment", "Productivity", "Creativity", "Reading", "Other"])
      .dataset({
        values: [74, 68, 52, 41, 24, 18],
      })
      .render();
    const labels = [...chart.element.querySelectorAll(".orchid-charts-polar-label")];
    expect(labels).toHaveLength(6);
    for (const label of labels) {
      const bounds = label.getBBox();
      expect(bounds.x).toBeGreaterThanOrEqual(12);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(widthOf(chart) - 12);
    }
    expect(labels.some((label) => label.querySelector("title"))).toBe(true);
  });
});
