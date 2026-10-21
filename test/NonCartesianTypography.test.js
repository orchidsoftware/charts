import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { HeatmapChart, PolarAreaChart, RadarChart, TimesheetChart } from "../src/index.js";
import "../src/styles.css";

const charts = [];
const boundsIn = (element, height) => {
  const bounds = element.getBBox();
  expect(bounds.y).toBeGreaterThanOrEqual(-0.1);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(height + 0.1);
};

beforeEach(() => {
  document.body.innerHTML = '<div id="chart" style="width: 320px"></div>';
});

afterEach(() => {
  for (const chart of charts.splice(0)) {
    chart.destroy();
  }
});

describe("Non-Cartesian CSS typography", () => {
  it("fits separately styled heatmap legend roles without clipping or overlapping swatches", () => {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<style>
      #chart .orchid-charts-heat-legend .orchid-charts-heat-legend-less { font: 700 28px/1.4 monospace; letter-spacing: 2px; }
      #chart .orchid-charts-heat-legend .orchid-charts-heat-legend-more { font: italic 24px/1.6 serif; }
    </style>`,
    );
    const chart = HeatmapChart.make("#chart").points({ "2026-09-01": 2, "2026-09-04": 3 }).render();
    charts.push(chart);
    const less = chart.element.querySelector(".orchid-charts-heat-legend-less").getBBox();
    const more = chart.element.querySelector(".orchid-charts-heat-legend-more").getBBox();
    const swatches = [...chart.element.querySelectorAll(".orchid-charts-heat-legend-swatch")];
    const first = swatches[0].getBBox();
    const last = swatches.at(-1).getBBox();
    expect(less.x + less.width).toBeLessThan(first.x);
    expect(last.x + last.width).toBeLessThan(more.x);
    expect(more.x + more.width).toBeLessThanOrEqual(chart.element.viewBox.baseVal.width);
    boundsIn(chart.element.querySelector(".orchid-charts-heat-legend"), chart.element.viewBox.baseVal.height);
  });

  it("measures task labels, centers their glyphs, and expands rows for larger fonts", () => {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<style>
      #chart .orchid-charts-timesheet-task-label { font: 700 28px/1.3 monospace; letter-spacing: 2px; }
      #chart .orchid-charts-timesheet-tick { font: italic 24px/1.5 serif; }
    </style>`,
    );
    const chart = TimesheetChart.make("#chart")
      .height(80)
      .task({ label: "Planning", start: "2026-09-01", end: "2026-09-03" })
      .task({ label: "Build", start: "2026-09-02", end: "2026-09-04" })
      .task({ label: "Review", start: "2026-09-03", end: "2026-09-05" })
      .render();
    charts.push(chart);
    const tasks = [...chart.element.querySelectorAll(".orchid-charts-timesheet-task-label")];
    const bars = [...chart.element.querySelectorAll(".orchid-charts-timesheet-bar")];
    for (const [index, task] of tasks.entries()) {
      const bounds = task.getBBox();
      const bar = bars[index].getBBox();
      expect(bounds.y + bounds.height / 2).toBeCloseTo(bar.y + bar.height / 2, 1);
      expect(bounds.x).toBeGreaterThanOrEqual(-0.1);
    }
    for (let index = 1; index < tasks.length; index += 1) {
      const previous = tasks[index - 1].getBBox();
      expect(previous.y + previous.height).toBeLessThan(tasks[index].getBBox().y);
    }
    const height = chart.element.viewBox.baseVal.height;
    expect(height).toBeGreaterThan(80);
    for (const tick of chart.element.querySelectorAll(".orchid-charts-timesheet-tick")) {
      boundsIn(tick, height);
    }
  });

  it.each([RadarChart, PolarAreaChart])("bounds radial labels with their actual CSS font", (Chart) => {
    document.body.insertAdjacentHTML(
      "beforeend",
      "<style>#chart .orchid-charts-label { font: italic 30px/1.4 serif; letter-spacing: 3px; }</style>",
    );
    const chart = Chart.make("#chart")
      .width(320)
      .height(200)
      .legend(false)
      .labels(["Northward", "Eastward", "Southward", "Westward"])
      .dataset({ name: "Direction", values: [2, 4, 3, 5] })
      .render();
    charts.push(chart);
    for (const label of chart.element.querySelectorAll(".orchid-charts-label")) {
      const bounds = label.getBBox();
      boundsIn(label, 200);
      expect(bounds.x).toBeGreaterThanOrEqual(-0.1);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(320.1);
    }
  });
});
