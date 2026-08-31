import { beforeEach, describe, expect, it } from "vitest";

import { DonutChart, HeatmapChart, LineChart, PieChart, TimesheetChart } from "../src/index.js";
import "../src/styles.css";

/**
 * Exercises update, keyboard, resize, and teardown for one mounted chart.
 *
 * @param {object} chart - Mounted public chart lifecycle.
 * @param {object} data - Valid replacement data.
 * @returns {Promise<void>} Browser work has reached the next frame.
 */
async function exerciseLifecycle(chart, data) {
  chart.update(data);
  const mark = chart.element.querySelector(".charts2-mark");
  mark.focus();
  mark.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
  document.querySelector("#chart").style.width = "520px";
  dispatchEvent(new Event("resize"));
  await new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });
  expect(chart.element.isConnected).toBe(true);
  chart.destroy();
  expect(chart.element.isConnected).toBe(false);
}

describe("cross-browser lifecycle compatibility", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="chart" style="width: 640px"></div>';
  });

  it("covers line charts", async () => {
    const data = {
      labels: [
        "A",
        "B",
      ],
      datasets: [
        {
          name: "Series",
          values: [
            1,
            2,
          ],
        },
      ],
    };
    const chart = LineChart.make("#chart").labels(data.labels).dataset(data.datasets[0]).render();

    await exerciseLifecycle(chart, {
      ...data,
      datasets: [
        {
          name: "Series",
          values: [
            2,
            3,
          ],
        },
      ],
    });
  });

  it("covers pie and donut charts", async () => {
    const data = {
      labels: [
        "A",
        "B",
      ],
      datasets: [
        {
          name: "Share",
          values: [
            2,
            3,
          ],
        },
      ],
    };

    const pie = PieChart.make("#chart").labels(data.labels).dataset(data.datasets[0]).render();
    await exerciseLifecycle(pie, data);
    document.body.innerHTML = '<div id="chart" style="width: 640px"></div>';
    const donut = DonutChart.make("#chart").labels(data.labels).dataset(data.datasets[0]).render();
    await exerciseLifecycle(donut, data);
  });

  it("covers heatmaps", async () => {
    const points = { "2026-01-01": 1, "2026-01-02": 2 };
    const chart = HeatmapChart.make("#chart").points(points).render();

    await exerciseLifecycle(chart, { points: { ...points, "2026-01-03": 3 } });
  });

  it("covers timesheets", async () => {
    const tasks = [
      { label: "Build", start: "2026-01-01", end: "2026-01-03" },
    ];
    const chart = TimesheetChart.make("#chart").task(tasks[0]).render();

    await exerciseLifecycle(chart, { tasks });
  });
});
