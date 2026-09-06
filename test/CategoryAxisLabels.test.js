import { beforeEach, expect, it } from "vitest";

import { BarChart, LineChart, MixedChart } from "../src/index.js";
import { categoryAxisLabels } from "../src/renderers/cartesian/CategoryAxisLabels.js";
import "../src/styles.css";

beforeEach(() => {
  document.body.innerHTML = '<div id="chart" style="width: 320px"></div>';
});

function axisLabels(chart) {
  const baseline = Number(chart.element.querySelector(".orchid-charts-x-axis").getAttribute("y1"));

  return [
    ...chart.element.querySelectorAll("text.orchid-charts-label:not(.orchid-charts-value-label)"),
  ].filter((label) => Number(label.getAttribute("y")) > baseline);
}

function expectReadable(chart, expected) {
  const labels = axisLabels(chart);
  const width = chart.element.viewBox.baseVal.width;

  expect(labels.length).toBeGreaterThanOrEqual(2);
  expect(labels.length).toBeLessThan(expected.length);
  expect(labels[0].textContent).toBe(expected[0]);
  expect(labels.at(-1).textContent).toBe(expected.at(-1));

  const indexes = labels.map((label) => expected.indexOf(label.textContent));
  const intervals = indexes.slice(1).map((index, offset) => index - indexes[offset]);
  expect(Math.max(...intervals) - Math.min(...intervals)).toBeLessThanOrEqual(1);

  for (const [index, label] of labels.entries()) {
    const box = label.getBBox();
    expect(expected).toContain(label.textContent);
    expect(label.querySelector("title")).toBeNull();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    if (index > 0) {
      const previous = labels[index - 1].getBBox();
      expect(box.x - previous.x - previous.width).toBeGreaterThanOrEqual(7);
    }
  }

  return labels.length;
}

it.each([
  { name: "line", ChartType: LineChart },
  { name: "bar", ChartType: BarChart },
  { name: "mixed", ChartType: MixedChart },
])("keeps dense dates complete and resamples on resize ($name)", async ({ ChartType }) => {
  const labels = Array.from(
    { length: 90 },
    (_, index) =>
      `${String((index % 30) + 1).padStart(2, "0")}.${String(Math.floor(index / 30) + 6).padStart(2, "0")}.2026`,
  );
  const chart = ChartType.make("#chart")
    .labels(labels)
    .dataset({
      ...(ChartType === MixedChart && { chartType: "bar" }),
      values: labels.map((_, index) => index % 4),
    })
    .render();
  const compactCount = expectReadable(chart, labels);
  const markCount = chart.element.querySelectorAll(".orchid-charts-mark").length;

  document.querySelector("#chart").style.width = "1000px";
  await expect.poll(() => chart.element.viewBox.baseVal.width).toBe(1000);
  expect(expectReadable(chart, labels)).toBeGreaterThan(compactCount);
  expect(chart.element.querySelectorAll(".orchid-charts-mark")).toHaveLength(markCount);

  document.querySelector("#chart").style.width = "240px";
  await expect.poll(() => chart.element.viewBox.baseVal.width).toBe(240);
  expectReadable(chart, labels);
  chart.destroy();
});

it("uses formatted widths and preserves all short labels when they fit", () => {
  const chart = LineChart.make("#chart")
    .labels(["A", "B", "C", "D", "E", "F"])
    .dataset({
      values: [1, 2, 3, 4, 5, 6],
    })
    .render();
  expect(axisLabels(chart)).toHaveLength(6);
  chart.destroy();

  const formatted = LineChart.make("#chart")
    .labels(["A", "B", "C", "D", "E", "F"])
    .formatLabel((label) => [`Пункт ${label}`, "сент."])
    .dataset({
      values: [1, 2, 3, 4, 5, 6],
    })
    .render();
  expectReadable(
    formatted,
    ["A", "B", "C", "D", "E", "F"].map((label) => `Пункт ${label} сент.`),
  );
  formatted.destroy();
});

it("handles empty, single, and individually oversized labels", () => {
  const geometry = { left: 0, right: 100, positionAt: (index) => index * 100 };
  expect(categoryAxisLabels({ ...geometry, labels: [] })).toEqual([]);
  expect(
    categoryAxisLabels({
      ...geometry,
      labels: ["A"],
    }),
  ).toHaveLength(1);
  const selected = categoryAxisLabels({
    ...geometry,
    labels: ["Очень длинное название категории", "B"],
  });
  expect(selected).toHaveLength(1);
  expect(selected[0].width).toBe(100);
});
