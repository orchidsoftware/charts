import { describe, expect, it, vi } from "vitest";

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

function host() {
  const element = document.createElement("div");
  element.style.width = "500px";
  document.body.replaceChildren(element);
  return element;
}

function select(chart, index) {
  document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  const mark = chart.element.querySelectorAll(".orchid-charts-mark")[index];
  mark.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  return mark;
}

describe("heatmap presentation consistency", () => {
  it.each([
    [
      "default",
      undefined,
    ],
    [
      "custom",
      [
        "#eeeeee",
        "#ff0000",
      ],
    ],
  ])("uses the same %s palette for rendering and selection before and after update", (_name, colors) => {
    const callback = vi.fn();
    const builder = HeatmapChart.make(host())
      .points({ "2026-09-01": 0, "2026-09-02": 10 })
      .onSelect(callback);
    if (colors) {
      builder.colors(colors);
    }
    const chart = builder.render();
    for (const data of [
      null,
      { points: { "2026-09-01": 0, "2026-09-02": 20 } },
    ]) {
      if (data) {
        chart.update(data);
      }
      for (const index of [
        0,
        1,
      ]) {
        const mark = select(chart, index);
        expect(callback.mock.lastCall[0].color).toBe(mark.getAttribute("fill"));
        expect(callback.mock.lastCall[0].value).toBe(chart.point(index).value);
      }
    }
  });
});

const seriesData = {
  labels: [
    "A",
    "B",
  ],
  datasets: [
    {
      name: "Series",
      values: [
        10,
        10,
      ],
    },
  ],
};

it.each([
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
    "polar",
    PolarAreaChart,
  ],
  [
    "radar",
    RadarChart,
  ],
])("preserves formatter punctuation in %s tooltip rows before and after update", (_name, definition) => {
  const parent = host();
  const chart = definition
    .make(parent)
    .labels(seriesData.labels)
    .dataset(seriesData.datasets[0])
    .tooltip((tooltip) => tooltip.formatValue((value) => `Value: ${value}`))
    .render();
  for (const update of [
    false,
    true,
  ]) {
    if (update) {
      chart.update(seriesData);
    }
    select(chart, 0).dispatchEvent(new PointerEvent("pointerenter"));
    expect(parent.querySelector(".orchid-charts-tooltip-row strong").textContent).toMatch(/^Value: 10/);
    expect(parent.querySelector(".orchid-charts-tooltip-row span").textContent).not.toContain("Value:");
  }
});

it.each([
  [
    "scatter",
    ScatterChart,
    {
      values: [
        { x: 1, y: 10 },
        { x: 2, y: 10 },
      ],
    },
  ],
  [
    "bubble",
    BubbleChart,
    {
      values: [
        { x: 1, y: 10, r: 2 },
        { x: 2, y: 10, r: 2 },
      ],
    },
  ],
  [
    "mixed line",
    MixedChart,
    {
      name: "Series",
      chartType: "line",
      values: [
        10,
        10,
      ],
    },
  ],
])("preserves formatter punctuation in independent %s points", (_name, definition, dataset) => {
  const parent = host();
  const chart = definition
    .make(parent)
    .dataset(dataset)
    .tooltip((tooltip) => tooltip.formatValue((value) => `Value: ${value}`))
    .render();
  select(chart, 0).dispatchEvent(new PointerEvent("pointerenter"));
  expect(parent.querySelector(".orchid-charts-tooltip-row strong").textContent).toContain("Value: 10");
});

it("preserves heatmap formatter output after update and formats each value once", () => {
  const parent = host();
  const formatter = vi.fn((value) => `Value: ${value}`);
  const chart = HeatmapChart.make(parent)
    .points({ "2026-09-01": 10 })
    .tooltip((tooltip) => tooltip.formatValue(formatter))
    .render();
  expect(formatter).toHaveBeenCalledTimes(1);
  chart.update({ points: { "2026-09-01": 10 } });
  expect(formatter).toHaveBeenCalledTimes(2);
  select(chart, 0).dispatchEvent(new PointerEvent("pointerenter"));
  expect(parent.querySelector(".orchid-charts-tooltip-row strong").textContent).toBe("Value: 10");
  expect(parent.querySelector(".orchid-charts-tooltip-row span").textContent).toBe("2026-09-01");
});

it("preserves punctuation in a timesheet duration", () => {
  const parent = host();
  const chart = TimesheetChart.make(parent)
    .task({ label: "Build", start: "2026-09-01", end: "2026-09-02" })
    .tooltip((tooltip) => tooltip.formatDuration(() => "Duration: one day"))
    .render();
  select(chart, 0).dispatchEvent(new PointerEvent("pointerenter"));
  expect(parent.querySelector(".orchid-charts-tooltip").textContent).toContain("Duration: one day");
});

it.each([
  [
    0,
    "#E5E5EA",
  ],
  [
    10,
    "#1B6B47",
  ],
])("uses an endpoint color for a uniform heatmap of %s", (value, expected) => {
  const callback = vi.fn();
  const chart = HeatmapChart.make(host()).points({ "2026-09-01": value }).onSelect(callback).render();
  expect(select(chart, 0).getAttribute("fill")).toBe(expected);
  expect(callback.mock.lastCall[0].color).toBe(expected);
});

it("keeps selection and visual feedback independent from diagnostic DOM attributes", () => {
  const parent = host();
  const callback = vi.fn();
  const chart = ScatterChart.make(parent)
    .dataset([
      { x: 1, y: 10 },
      { x: 2, y: 20 },
    ])
    .onSelect(callback)
    .render();
  const visual = chart.element.querySelector(".orchid-charts-visual-mark");
  const mark = chart.element.querySelector(".orchid-charts-mark");
  visual.classList.remove("orchid-charts-visual-mark");
  visual.dataset.pointIndex = "999";
  mark.dataset.pointIndex = "999";
  mark.dataset.datasetIndex = "999";
  mark.dataset.tooltipItems = "invalid JSON";
  mark.dispatchEvent(new PointerEvent("pointerenter"));
  expect(visual.classList.contains("is-hovered")).toBe(true);
  mark.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(callback.mock.lastCall[0]).toMatchObject({ x: 1, y: 10, datasetIndex: 0 });
  expect(parent.querySelector(".orchid-charts-tooltip strong").textContent).toBe("10");
});

it("stops detached mark reactions after update and destroy", () => {
  const callback = vi.fn();
  const chart = LineChart.make(host())
    .dataset([
      1,
      2,
    ])
    .onSelect(callback)
    .render();
  const oldMark = chart.element.querySelector(".orchid-charts-mark");
  chart.update({
    datasets: [
      {
        values: [
          3,
          4,
        ],
      },
    ],
  });
  oldMark.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(callback).not.toHaveBeenCalled();
  const current = chart.element.querySelector(".orchid-charts-mark");
  current.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(callback).toHaveBeenCalledOnce();
  chart.destroy();
  current.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
  document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  expect(callback).toHaveBeenCalledOnce();
});

it("reads the current keyboard point without requiring selection", () => {
  const chart = LineChart.make(host())
    .dataset([
      1,
      2,
    ])
    .render();
  const marks = chart.element.querySelectorAll(".orchid-charts-mark");
  marks[1].focus();
  expect(chart.point().values).toEqual([
    2,
  ]);
});

it("reads the first point when interaction is disabled", () => {
  const chart = LineChart.make(host())
    .dataset([
      1,
      2,
    ])
    .tooltip(false)
    .render();
  expect(chart.point().values).toEqual([
    1,
  ]);
});

it("mounts a hidden host at a usable fallback width", () => {
  const parent = host();
  parent.style.display = "none";
  const chart = LineChart.make(parent)
    .dataset([
      1,
      2,
    ])
    .render();
  expect(chart.element.viewBox.baseVal.width).toBe(640);
  parent.style.display = "block";
  dispatchEvent(new Event("resize"));
  expect(chart.element.viewBox.baseVal.width).toBe(500);
});

it("rejects malformed dataset values through the public render boundary", () => {
  expect(() => LineChart.make(host()).dataset({ values: "invalid" }).render()).toThrow("non-empty array");
});

it("keeps point() on the selected datum while keyboard focus previews another", () => {
  const chart = LineChart.make(host())
    .dataset([
      10,
      20,
    ])
    .onSelect(vi.fn())
    .render();
  const marks = chart.element.querySelectorAll(".orchid-charts-mark");
  marks[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));
  marks[0].focus();
  expect(chart.point().values).toEqual([
    20,
  ]);
  marks[1].dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  expect(chart.element.querySelector('[aria-pressed="true"]')).toBeNull();
  expect(chart.point().values).toEqual([
    10,
  ]);
});

it("keeps selected tooltips visible when the pointer leaves the chart", () => {
  const parent = host();
  const chart = LineChart.make(parent)
    .dataset([
      10,
      20,
    ])
    .onSelect(vi.fn())
    .render();
  const mark = chart.element.querySelector(".orchid-charts-mark");
  mark.focus();
  mark.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  chart.element.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
  chart.element.dispatchEvent(new MouseEvent("mouseleave"));
  expect(parent.querySelector(".orchid-charts-tooltip").hidden).toBe(false);
  expect(mark.getAttribute("aria-pressed")).toBe("true");
  document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  expect(parent.querySelector(".orchid-charts-tooltip").hidden).toBe(true);
});
