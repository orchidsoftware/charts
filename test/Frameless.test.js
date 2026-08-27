import { beforeEach, describe, expect, it } from "vitest";

import { createChart } from "../src/index.js";

function frameless(type, values, options = {}) {
  return createChart("#chart", {
    type,
    height: 90,
    showAxes: false,
    showGrid: false,
    showLabels: false,
    showLegend: false,
    showDots: false,
    showTooltip: false,
    data: { datasets: [{ values }] },
    ...options,
  });
}

describe("explicit frameless charts", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="chart"><span>old</span></div>';
  });

  it("uses the regular line lifecycle without hidden presets", () => {
    const chart = frameless("line", [4, 4], { ariaLabel: "Data trend" });
    expect(chart.element.getAttribute("aria-label")).toBe("Data trend");
    expect(chart.element.querySelector(".charts2-line").getAttribute("d")).toContain("M2,");
    expect(chart.update({ datasets: [{ values: [7] }] })).toBe(chart);
    expect(chart.element.querySelector(".charts2-line").getAttribute("d")).toMatch(/^M[\d.]+,45$/);
    chart.destroy();
    expect(document.querySelector("svg")).toBeNull();
  });

  it("supports an explicitly filled line", () => {
    const chart = frameless("line", [1, 3, 2], {
      width: 100,
      height: 40,
      colors: ["red"],
      lineOptions: { regionFill: true },
    });
    expect(chart.element.querySelectorAll("path")).toHaveLength(2);
    expect(chart.element.querySelector("linearGradient")).not.toBeNull();
  });

  it("renders dense frameless bars with a safe minimum width", () => {
    const chart = frameless(
      "bar",
      Array.from({ length: 200 }, () => 2),
      { width: 10, strokeWidth: 3 },
    );
    expect(chart.element.querySelectorAll(".charts2-bar")).toHaveLength(200);
    expect(chart.element.querySelector(".charts2-bar").getBBox().width).toBeCloseTo(2);
  });

  it.each([null, "#missing"])("rejects an invalid parent", (parent) => {
    expect(() => createChart(parent, { type: "line", data: { datasets: [{ values: [1] }] } })).toThrow("parent");
  });

  it("rejects removed compatibility routes", () => {
    expect(() => createChart("#chart", { type: "sparkline", values: [1, 2] })).toThrow(
      "Unsupported chart option: values",
    );
    expect(() =>
      createChart("#chart", { type: "line", compact: true, data: { datasets: [{ values: [1, 2] }] } }),
    ).toThrow("Unsupported chart option: compact");
  });
});
