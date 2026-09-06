import { beforeEach, describe, expect, it } from "vitest";

import { BarChart, LineChart } from "../src/index.js";
import "../src/styles.css";

function frameless(builder) {
  return builder.height(90).axes(false).grid(false).valueLabels(false).legend(false).tooltip(false);
}

describe("explicit frameless charts", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="chart"><span>old</span></div>';
  });

  it("uses the regular line lifecycle without hidden presets", () => {
    const chart = frameless(LineChart.make("#chart").dots(false))
      .ariaLabel("Data trend")
      .dataset({
        values: [4, 4],
      })
      .render();
    expect(chart.element.getAttribute("aria-label")).toBe("Data trend");
    expect(chart.element.querySelector(".orchid-charts-line").getAttribute("d")).toContain("M0,");
    expect(
      chart.update({
        datasets: [
          {
            values: [7],
          },
        ],
      }),
    ).toBe(chart);
    expect(chart.element.querySelector(".orchid-charts-line").getAttribute("d")).toMatch(/^M[\d.]+,45$/);
    chart.destroy();
    expect(document.querySelector("svg")).toBeNull();
  });

  it("supports an explicitly filled line", () => {
    const chart = frameless(LineChart.make("#chart").dots(false))
      .width(100)
      .height(40)
      .colors(["red"])
      .area(true)
      .dataset({
        values: [1, 3, 2],
      })
      .render();
    expect(chart.element.querySelectorAll("path")).toHaveLength(2);
    expect(chart.element.querySelector("linearGradient")).toBeNull();
    expect(chart.element.querySelector(".orchid-charts-area").getAttribute("fill")).toBe("red");
    const bounds = chart.element.querySelector(".orchid-charts-area").getBBox();
    expect(bounds.x).toBe(0);
    expect(bounds.width).toBe(100);
    const lineBounds = chart.element.querySelector(".orchid-charts-line").getBBox();
    expect(lineBounds.y).toBe(2);
    expect(lineBounds.height).toBe(36);
  });

  it.each([
    [10, 20],
    [-10, -20],
    [-10, 20],
  ])("uses the full SVG height for frameless bars (%s, %s)", (first, second) => {
    const chart = frameless(BarChart.make("#chart"))
      .dataset({
        values: [first, second],
      })
      .render();
    const bounds = [...chart.element.querySelectorAll(".orchid-charts-bar")].map((bar) => bar.getBBox());

    expect(Math.min(...bounds.map((box) => box.y))).toBe(0);
    expect(Math.max(...bounds.map((box) => box.y + box.height))).toBe(90);
    chart.destroy();
  });

  it("renders dense frameless bars with a safe minimum width", () => {
    const chart = frameless(BarChart.make("#chart"))
      .width(10)
      .dataset({ values: Array.from({ length: 200 }, () => 2) })
      .render();
    expect(chart.element.querySelectorAll(".orchid-charts-bar")).toHaveLength(200);
    expect(chart.element.querySelector(".orchid-charts-bar").getBBox().width).toBeCloseTo(2);
  });

  it.each([null, "#missing"])("rejects an invalid parent: %j", (parent) => {
    expect(() =>
      LineChart.make(parent)
        .dataset({
          values: [1],
        })
        .render(),
    ).toThrow("parent");
  });
});
