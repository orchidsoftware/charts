import { beforeEach, describe, expect, it } from "vitest";

import createChart from "./support/MountChart.js";

function frameless(type, values, options = {}) {
  const presentation = {
    type,
    height: 90,
    axes: false,
    grid: false,
    valueLabels: false,
    legend: false,
    tooltip: false,
    data: {
      datasets: [
        { values },
      ],
    },
    ...options,
  };

  if (type === "line") {
    presentation.dots = false;
  }

  return createChart("#chart", presentation);
}

describe("explicit frameless charts", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="chart"><span>old</span></div>';
  });

  it("uses the regular line lifecycle without hidden presets", () => {
    const chart = frameless(
      "line",
      [
        4,
        4,
      ],
      { ariaLabel: "Data trend" },
    );
    expect(chart.element.getAttribute("aria-label")).toBe("Data trend");
    expect(chart.element.querySelector(".charts2-line").getAttribute("d")).toContain("M0,");
    expect(
      chart.update({
        datasets: [
          {
            values: [
              7,
            ],
          },
        ],
      }),
    ).toBe(chart);
    expect(chart.element.querySelector(".charts2-line").getAttribute("d")).toMatch(/^M[\d.]+,45$/);
    chart.destroy();
    expect(document.querySelector("svg")).toBeNull();
  });

  it("supports an explicitly filled line", () => {
    const chart = frameless(
      "line",
      [
        1,
        3,
        2,
      ],
      {
        width: 100,
        height: 40,
        colors: [
          "red",
        ],
        area: true,
      },
    );
    expect(chart.element.querySelectorAll("path")).toHaveLength(2);
    expect(chart.element.querySelector("linearGradient")).toBeNull();
    expect(chart.element.querySelector(".charts2-area").getAttribute("fill")).toBe("red");
    const bounds = chart.element.querySelector(".charts2-area").getBBox();
    expect(bounds.x).toBe(0);
    expect(bounds.width).toBe(100);
  });

  it("renders dense frameless bars with a safe minimum width", () => {
    const chart = frameless(
      "bar",
      Array.from({ length: 200 }, () => 2),
      { width: 10 },
    );
    expect(chart.element.querySelectorAll(".charts2-bar")).toHaveLength(200);
    expect(chart.element.querySelector(".charts2-bar").getBBox().width).toBeCloseTo(2);
  });

  it.each([
    null,
    "#missing",
  ])("rejects an invalid parent", (parent) => {
    expect(() =>
      createChart(parent, {
        type: "line",
        data: {
          datasets: [
            {
              values: [
                1,
              ],
            },
          ],
        },
      }),
    ).toThrow("parent");
  });

  it("rejects removed compatibility routes", () => {
    expect(() =>
      createChart("#chart", {
        type: "sparkline",
        values: [
          1,
          2,
        ],
      }),
    ).toThrow("Unsupported chart option: values");
    expect(() =>
      createChart("#chart", {
        type: "line",
        compact: true,
        data: {
          datasets: [
            {
              values: [
                1,
                2,
              ],
            },
          ],
        },
      }),
    ).toThrow("Unsupported chart option: compact");
  });
});
