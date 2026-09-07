import { beforeEach, expect, it, vi } from "vitest";

import { LineChart } from "../src/index.js";
import CartesianLayout from "../src/renderers/cartesian/CartesianLayout.js";
import { categoryAxisLabels } from "../src/renderers/cartesian/CategoryAxisLabels.js";
import "../src/styles.css";

beforeEach(() => {
  document.body.innerHTML = '<div id="chart" style="width:640px"></div>';
});

it("retains every line segment and public value beyond the argument-count boundary", () => {
  const values = Array.from({ length: 150_000 }, (_, index) => index % 7);
  values[75_000] = 108;
  values[149_999] = -42;
  const chart = LineChart.make("#chart").dataset(values).smooth(false).render();
  const path = chart.element.querySelector(".orchid-charts-line").getAttribute("d");
  expect(path.match(/L/g)).toHaveLength(values.length - 1);
  expect(path).not.toMatch(/NaN|Infinity/);
  expect(chart.point(75_000).values).toEqual([108]);
  expect(chart.point(149_999).values).toEqual([-42]);
  expect(chart.element.querySelectorAll(".orchid-charts-dense-hit")).toHaveLength(1);
});

it.each([
  { orientation: "vertical", stacked: false },
  { orientation: "horizontal", stacked: false },
  { orientation: "vertical", stacked: true },
])("calculates a large $orientation bar layout with stacked=$stacked", ({ orientation, stacked }) => {
  const points = Array.from({ length: 150_000 }, (_, x) => ({ x, y: x % 2 ? -42 : 108 }));
  const layout = new CartesianLayout({
    labels: points.map(({ x }) => String(x + 1)),
    datasets: [{ name: "Values", points }],
    source: { yMarkers: [], yRegions: [] },
    options: {
      type: "bar",
      width: 640,
      height: 320,
      orientation,
      stacked,
      axes: true,
      grid: true,
      valueLabels: true,
      legend: false,
    },
  });
  expect(layout.categories.count).toBe(150_000);
  expect(layout.values.domain[0]).toBeLessThanOrEqual(-42);
  expect(layout.values.domain[1]).toBeGreaterThanOrEqual(108);
  expect(layout.xAt(-0.5)).toBe(layout.frame.left);
  expect(layout.xAt(149_999.5)).toBe(layout.frame.right);
  const last = layout.barFor(points.at(-1), { category: 149_999, series: 0, base: 0 });
  expect(Object.values(last).every((value) => Number.isFinite(value))).toBe(true);
});

it("bounds axis measurement by available space while keeping the original endpoint indices", () => {
  const labels = Array.from({ length: 150_000 }, (_, index) => String(index + 1));
  const positionAt = vi.fn((index) => (index * 640) / (labels.length - 1));
  const visible = categoryAxisLabels({ labels, positionAt, left: 0, right: 640 });
  expect(visible[0].index).toBe(0);
  expect(visible.at(-1).index).toBe(149_999);
  expect(positionAt.mock.calls.length).toBeLessThan(4096);
  for (const [index, label] of visible.slice(1).entries()) {
    expect(label.start - visible[index].start - visible[index].width).toBeGreaterThanOrEqual(8);
  }
});
