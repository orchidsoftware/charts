import { beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";

import {
  BarChart,
  BubbleChart,
  DonutChart,
  HeatmapChart,
  LineChart,
  MixedChart,
  PercentageChart,
  PieChart,
  PolarAreaChart,
  RadarChart,
  ScatterChart,
  TimesheetChart,
} from "../src/index.js";
import "../src/styles.css";

const labels = [
  "A",
  "B",
];
const series = {
  name: "Series",
  values: [
    1,
    2,
  ],
};
const updated = {
  labels,
  datasets: [
    {
      name: "Series",
      values: [
        3,
        4,
      ],
    },
  ],
};
const numericCases = [
  [
    "line",
    LineChart,
  ],
  [
    "bar",
    BarChart,
  ],
  [
    "pie",
    PieChart,
  ],
  [
    "donut",
    DonutChart,
  ],
  [
    "percentage",
    PercentageChart,
  ],
  [
    "polar-area",
    PolarAreaChart,
  ],
].map(
  ([
    name,
    definition,
  ]) => [
    name,
    () => ({
      builder: definition.make("#chart").labels(labels).dataset(series),
      data: updated,
      point: {
        values: [
          3,
        ],
      },
      selection: { value: 4 },
    }),
  ],
);

const cases = [
  ...numericCases,
  [
    "mixed",
    () => ({
      builder: MixedChart.make("#chart").labels(labels).line(
        "Series",
        [
          1,
          2,
        ],
      ),
      data: {
        labels,
        datasets: [
          {
            name: "Series",
            chartType: "line",
            values: [
              3,
              4,
            ],
          },
        ],
      },
      point: { y: 3 },
      selection: { value: 4 },
    }),
  ],
  [
    "scatter",
    () => ({
      builder: ScatterChart.make("#chart").dataset({
        name: "Series",
        values: [
          { x: 1, y: 1 },
          { x: 2, y: 2 },
        ],
      }),
      data: {
        datasets: [
          {
            name: "Series",
            values: [
              { x: 1, y: 3 },
              { x: 2, y: 4 },
            ],
          },
        ],
      },
      point: { y: 3 },
      selection: { value: 4 },
    }),
  ],
  [
    "bubble",
    () => ({
      builder: BubbleChart.make("#chart").dataset({
        name: "Series",
        values: [
          { x: 1, y: 1, r: 4 },
          { x: 2, y: 2, r: 6 },
        ],
      }),
      data: {
        datasets: [
          {
            name: "Series",
            values: [
              { x: 1, y: 3, r: 4 },
              { x: 2, y: 4, r: 6 },
            ],
          },
        ],
      },
      point: { y: 3, r: 4 },
      selection: { value: 4 },
    }),
  ],
  [
    "radar",
    () => ({
      builder: RadarChart.make("#chart")
        .labels(labels)
        .dataset(series)
        .dataset({
          name: "Other",
          values: [
            2,
            3,
          ],
        }),
      data: {
        labels,
        datasets: [
          ...updated.datasets,
          {
            name: "Other",
            values: [
              5,
              6,
            ],
          },
        ],
      },
      point: {
        values: [
          3,
          5,
        ],
      },
      selection: {
        label: labels[1],
        values: [
          4,
          6,
        ],
      },
    }),
  ],
  [
    "heatmap",
    () => ({
      builder: HeatmapChart.make("#chart").points({ "2026-01-01": 1, "2026-01-02": 2 }),
      data: { points: { "2026-01-01": 3, "2026-01-02": 4 } },
      point: { value: 3 },
      selection: { key: "2026-01-02", value: 4 },
    }),
  ],
  [
    "timesheet",
    () => ({
      builder: TimesheetChart.make("#chart")
        .task({ label: "Build", start: "2026-01-01", end: "2026-01-03" })
        .task({ label: "Ship", start: "2026-01-03", end: "2026-01-04" }),
      data: {
        tasks: [
          { label: "Build", start: "2026-01-02", end: "2026-01-04" },
          { label: "Ship", start: "2026-01-04", end: "2026-01-05" },
        ],
      },
      point: { label: "Build", start: new Date("2026-01-02") },
      selection: { label: "Ship" },
    }),
  ],
];

beforeEach(() => {
  document.body.innerHTML = '<div id="chart" style="width:640px"></div>';
});

describe("cross-browser public lifecycle", () => {
  it.each(cases)(
    "updates, navigates, selects, resizes and destroys %s using browser input",
    async (name, fixture) => {
      const { builder, data, point, selection } = fixture();
      const onSelect = vi.fn();
      const chart = builder.onSelect(onSelect).render();
      chart.update(data);
      expect(chart.point(0)).toMatchObject(point);
      const marks = chart.element.querySelectorAll(".orchid-charts-mark");
      await (name === "radar" ? userEvent.tab() : page.elementLocator(marks[0]).click());
      expect(document.activeElement).toBe(marks[0]);
      await userEvent.keyboard("{ArrowRight}");
      expect(document.activeElement).toBe(marks[1]);
      expect(marks[1].getAttribute("tabindex")).toBe("0");
      await userEvent.keyboard("{Enter}");
      expect(onSelect.mock.lastCall[0]).toMatchObject(selection);
      expect(marks[1].getAttribute("aria-pressed")).toBe("true");
      expect(document.querySelector(".orchid-charts-tooltip").hidden).toBe(false);
      const notifications = onSelect.mock.calls.length;
      document.querySelector("#chart").style.width = "520px";
      await expect.poll(() => chart.element.viewBox.baseVal.width, { timeout: 5000 }).toBe(520);
      expect(onSelect).toHaveBeenCalledTimes(notifications);
      expect(chart.element.querySelector(".is-active")).not.toBeNull();
      chart.destroy();
      expect(chart.element.isConnected).toBe(false);
      expect(document.querySelector(".orchid-charts-tooltip")).toBeNull();
    },
  );
});
