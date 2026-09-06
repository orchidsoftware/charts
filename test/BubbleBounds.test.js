import { beforeEach, describe, expect, it } from "vitest";

import { BubbleChart } from "../src/index.js";
import "../src/styles.css";

function expectContained(chart) {
  const axis = chart.element.querySelector(".orchid-charts-x-axis");
  const left = Number(axis.getAttribute("x1"));
  const right = Number(axis.getAttribute("x2"));
  const bottom = Number(axis.getAttribute("y1"));
  for (const circle of chart.element.querySelectorAll(".orchid-charts-bubble")) {
    const radius = circle.r.baseVal.value;
    const box = {
      x: circle.cx.baseVal.value - radius,
      y: circle.cy.baseVal.value - radius,
      width: 2 * radius,
      height: 2 * radius,
    };
    expect(box.x).toBeGreaterThanOrEqual(left - 0.001);
    expect(box.x + box.width).toBeLessThanOrEqual(right + 0.001);
    expect(box.y).toBeGreaterThanOrEqual(-0.001);
    expect(box.y + box.height).toBeLessThanOrEqual(bottom + 0.001);
  }
}

describe("Bubble bounds", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="chart" style="width: 240px"></div>';
  });

  it("contains full circles at signed extrema and retains their radii after updates", () => {
    const chart = BubbleChart.make("#chart")
      .height(180)
      .dataset([
        { x: -100, y: -80, r: 28 },
        { x: -99, y: 0, r: 0 },
        { x: 100, y: 80, r: 42 },
        { x: 101, y: 10, r: 12 },
      ])
      .render();
    expectContained(chart);
    expect(
      [
        ...chart.element.querySelectorAll(".orchid-charts-bubble"),
      ].map((circle) => Number(circle.getAttribute("r"))),
    ).toEqual([
      28,
      0,
      42,
      12,
    ]);
    chart.update({
      datasets: [
        {
          values: [
            { x: 1, y: 78, r: 23 },
            { x: 2, y: 0, r: 18 },
          ],
        },
      ],
    });
    expectContained(chart);
    chart.destroy();
  });

  it("refits a responsive chart with a right axis and multiple series", async () => {
    const chart = BubbleChart.make("#chart")
      .height(220)
      .yAxis((axis) => axis.position("right"))
      .dataset("First", [
        { x: 0, y: 0.02, r: 26 },
        { x: 1, y: 0.08, r: 18 },
      ])
      .dataset("Second", [
        { x: 0, y: -0.01, r: 12 },
        { x: 1, y: 0.04, r: 40 },
      ])
      .render();
    expectContained(chart);
    document.querySelector("#chart").style.width = "160px";
    await expect.poll(() => chart.element.viewBox.baseVal.width).toBe(160);
    expectContained(chart);
    const decimal = new Intl.NumberFormat().formatToParts(0.1).find((part) => part.type === "decimal").value;
    expect(
      [
        ...chart.element.querySelectorAll(".orchid-charts-value-label"),
      ].map((label) => label.textContent),
    ).toContainEqual(expect.stringContaining(decimal));
    chart.destroy();
  });

  it("fits a frameless single point and retains finite geometry for oversized radii", () => {
    const chart = BubbleChart.make("#chart")
      .height(120)
      .frameless()
      .dataset([
        { x: 0, y: 0, r: 40 },
      ])
      .render();
    const box = chart.element.querySelector(".orchid-charts-bubble").getBBox();
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(120);
    chart.update({
      datasets: [
        {
          values: [
            { x: 1, y: 2, r: 200 },
          ],
        },
      ],
    });
    const circle = chart.element.querySelector(".orchid-charts-bubble");
    expect(circle.getAttribute("r")).toBe("200");
    expect(Number.isFinite(Number(circle.getAttribute("cy")))).toBe(true);
    expect(Number.isFinite(Number(circle.getAttribute("cx")))).toBe(true);
    chart.destroy();
  });

  it("fits circles whose diameters leave less than one pixel of spare height", () => {
    const chart = BubbleChart.make("#chart")
      .height(120)
      .dataset([
        { x: 0, y: -10, r: 41.9 },
        { x: 1, y: 10, r: 41.9 },
      ])
      .render();
    expectContained(chart);
    chart.destroy();
  });
});
