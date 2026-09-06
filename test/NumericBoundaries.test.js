import { beforeEach, expect, it, vi } from "vitest";

import { BarChart, LineChart, PieChart } from "../src/index.js";
import { extent, niceValueScale } from "../src/support/geometry/Scale.js";
import "../src/styles.css";

beforeEach(() => {
  document.body.innerHTML = '<div id="chart" style="width:600px"></div>';
});

it("renders a large constant domain with finite geometry", () => {
  const chart = LineChart.make("#chart").dataset([1e18, 1e18]).frameless().render();
  const path = chart.element.querySelector(".orchid-charts-line").getAttribute("d");
  expect(path).not.toMatch(/NaN|Infinity/);
  expect(extent([Number.MAX_VALUE, Number.MAX_VALUE])[1]).toBe(Number.MAX_VALUE);
  expect(extent([-Number.MAX_VALUE, -Number.MAX_VALUE])[0]).toBe(-Number.MAX_VALUE);
});

it.each([
  [-1e308, 1e308],
  [0, 1e-323],
])("rejects an unrepresentable axis without replacing good data (%j)", (...values) => {
  const chart = LineChart.make("#chart").dataset([1, 2]).render();
  const before = chart.toSvg();
  expect(() => chart.update({ datasets: [{ values }] })).toThrow(RangeError);
  expect(chart.toSvg()).toBe(before);
  expect(chart.point(1).values).toEqual([2]);
});

it("rejects overflowing composition totals and rounded domains", () => {
  const chart = PieChart.make("#chart").dataset([1, 2]).render();
  const before = chart.toSvg();
  expect(() => chart.update({ datasets: [{ values: [1e308, 1e308] }] })).toThrow("total must be finite");
  expect(chart.toSvg()).toBe(before);
  expect(() => niceValueScale([1e308, Number.MAX_VALUE], true)).toThrow("domain must be finite");
});

it("bounds text measurement for a long category while retaining its accessible label", () => {
  const label = Array.from({ length: 400 }, () => "word").join(" ");
  const measurement = vi.spyOn(CanvasRenderingContext2D.prototype, "measureText");
  const chart = BarChart.make("#chart").labels([label]).dataset([42]).horizontal().render();
  expect(measurement.mock.calls.length).toBeLessThan(500);
  const text = chart.element.querySelector(".orchid-charts-multiline-label");
  expect(text.getAttribute("aria-label")).toBe(label);
  expect(text.querySelectorAll("tspan").length).toBeLessThanOrEqual(3);
  expect(text.textContent).toContain("…");
});

it("identifies the invalid dataset and position", () => {
  expect(() =>
    LineChart.make("#chart").dataset("Actual", [1, 2]).dataset("Forecast", [2, NaN]).render(),
  ).toThrow("Forecast: Dataset value 2 must be finite (a number)");
});
