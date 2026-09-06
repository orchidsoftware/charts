import { expect, it, vi } from "vitest";

import {
  PieChart,
  DonutChart,
  PercentageChart,
  PolarAreaChart,
  RadarChart,
  LineChart,
  MixedChart,
  ScatterChart,
  BubbleChart,
} from "../src/index.js";
import "../src/styles.css";

function host() {
  const parent = document.createElement("div");
  parent.style.width = "600px";
  document.body.replaceChildren(parent);
  return parent;
}

it.each([
  PieChart,
  DonutChart,
])("resolves a selected sector after omitted zero values and update", (definition) => {
  const callback = vi.fn();
  const chart = definition
    .make(host())
    .labels([
      "Zero",
      "Visible",
    ])
    .dataset([
      0,
      2,
    ])
    .onSelect(callback)
    .render();
  chart.element
    .querySelector(".orchid-charts-mark")
    .dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(chart.point()).toEqual({
    index: 1,
    label: "Visible",
    values: [
      2,
    ],
  });
  expect(chart.point(0).label).toBe("Zero");
  expect(callback.mock.lastCall[0].label).toBe(chart.point().label);
  chart.update({
    labels: [
      "Visible",
      "Zero",
    ],
    datasets: [
      {
        values: [
          3,
          0,
        ],
      },
    ],
  });
  expect(chart.point()).toEqual({
    index: 0,
    label: "Visible",
    values: [
      3,
    ],
  });
});

it("reads the same radar measure through selection and explicit indices", () => {
  const chart = RadarChart.make(host())
    .labels([
      "A",
      "B",
      "C",
    ])
    .dataset(
      "First",
      [
        1,
        2,
        3,
      ],
    )
    .dataset(
      "Second",
      [
        4,
        5,
        6,
      ],
    )
    .onSelect(vi.fn())
    .render();
  chart.element
    .querySelectorAll(".orchid-charts-mark")[1]
    .dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(chart.point()).toEqual({
    index: 1,
    label: "B",
    values: [
      2,
      5,
    ],
  });
  expect(chart.point(1)).toEqual({
    index: 1,
    label: "B",
    values: [
      2,
      5,
    ],
  });
});

it("resolves mixed marks by dataset address despite visual layer order", () => {
  const chart = MixedChart.make(host())
    .labels([
      "A",
      "B",
    ])
    .line(
      "First",
      [
        1,
        2,
      ],
    )
    .bar(
      "Second",
      [
        3,
        4,
      ],
    )
    .onSelect(vi.fn())
    .render();
  chart.element
    .querySelector('.orchid-charts-bar[data-point-index="1"]')
    .dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(chart.point()).toMatchObject({ index: 3, datasetIndex: 1, pointIndex: 1, y: 4 });
});

it.each([
  LineChart,
  PieChart,
  DonutChart,
  PercentageChart,
  PolarAreaChart,
  RadarChart,
  ScatterChart,
  BubbleChart,
  MixedChart,
])("keeps dataset formatter precedence and context on render and update", (definition) => {
  const callback = vi.fn((value) => `dataset:${value}`);
  const values =
    definition === BubbleChart
      ? [
          { x: 0, y: 2, r: 3 },
          { x: 1, y: 4, r: 5 },
        ]
      : [
          2,
          4,
        ];
  const dataset = {
    name: "Series",
    values,
    formatValue: callback,
    ...(definition === MixedChart && { chartType: "line" }),
  };
  const chart = definition
    .make(host())
    .labels([
      "A",
      "B",
    ])
    .dataset(dataset)
    .formatValue(() => "chart")
    .tooltip((t) => t.formatValue(() => "tooltip"))
    .render();
  for (const updated of [
    false,
    true,
  ]) {
    if (updated) {
      chart.update({
        labels: [
          "A",
          "B",
        ],
        datasets: [
          dataset,
        ],
      });
    }
    const mark = chart.element.querySelector(".orchid-charts-mark");
    mark.dispatchEvent(new PointerEvent("pointerenter"));
    expect(document.querySelector(".orchid-charts-tooltip strong").textContent).toContain("dataset:2");
    expect(
      callback.mock.calls.some(
        ([
          ,
          context,
        ]) =>
          context.target === "tooltip" &&
          context.index === 0 &&
          context.datasetIndex === 0 &&
          context.label === "A" &&
          context.point.y === 2,
      ),
    ).toBe(true);
  }
});

it("owns update labels, points and annotation arrays across resize", () => {
  const parent = host();
  const callback = vi.fn();
  const chart = LineChart.make(parent)
    .labels([
      "Initial",
    ])
    .dataset([
      1,
    ])
    .onSelect(callback)
    .render();
  const data = {
    labels: [
      "Before",
    ],
    datasets: [
      {
        values: [
          2,
        ],
      },
    ],
    markers: [
      {
        label: "Target",
        value: 3,
        dash: [
          4,
          3,
        ],
      },
    ],
  };
  chart.update(data);
  const before = chart.element.getHTML();
  data.labels[0] = "After";
  data.datasets[0].values[0] = 100;
  data.markers[0].dash[0] = 99;
  expect(chart.point(0)).toEqual({
    index: 0,
    label: "Before",
    values: [
      2,
    ],
  });
  expect(chart.element.getHTML()).toBe(before);
  parent.style.width = "700px";
  dispatchEvent(new Event("resize"));
  expect(chart.element.textContent).not.toContain("After");
  expect(chart.element.querySelector('[stroke-dasharray="4 3"], [stroke-dasharray="4,3"]')).not.toBeNull();
  chart.element
    .querySelector(".orchid-charts-mark")
    .dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(callback.mock.lastCall[0]).toMatchObject({ label: "Before", value: 2 });
});

it.each([
  0,
  1,
  9,
])("applies radar strokeWidth %s to actual SVG presentation", (width) => {
  const chart = RadarChart.make(host())
    .labels([
      "A",
      "B",
      "C",
    ])
    .dataset([
      1,
      2,
      3,
    ])
    .strokeWidth(width)
    .render();
  expect(getComputedStyle(chart.element.querySelector(".orchid-charts-radar")).strokeWidth).toBe(
    `${width}px`,
  );
});

it("uses actual axis formatter labels for both measurement and drawing", () => {
  const formatter = vi.fn((value) => `Revenue amount: ${value} USD`);
  const chart = LineChart.make(host())
    .dataset([
      10,
      20,
    ])
    .yAxis((axis) => axis.formatValue(formatter))
    .render();
  const labels = chart.element.querySelectorAll(".orchid-charts-value-label");
  expect(formatter).toHaveBeenCalledTimes(labels.length);
  for (const label of labels) {
    expect(label.textContent).toMatch(/^Revenue amount:/u);
    expect(label.getBBox().x).toBeGreaterThanOrEqual(-1);
  }
});

it("applies chart and dataset line widths to computed style", () => {
  const chart = LineChart.make(host())
    .strokeWidth(7)
    .dataset(
      "A",
      [
        1,
        2,
      ],
    )
    .dataset(
      "B",
      [
        2,
        3,
      ],
      (s) => s.strokeWidth(4),
    )
    .render();
  expect(
    [
      ...chart.element.querySelectorAll(".orchid-charts-line"),
    ].map((line) => getComputedStyle(line).strokeWidth),
  ).toEqual([
    "7px",
    "4px",
  ]);
});

it("reads a dense line at the inspected category across all datasets", () => {
  const values = Array.from({ length: 65 }, (_, index) => index + 1);
  const callback = vi.fn();
  const chart = LineChart.make(host())
    .dataset("First", values)
    .dataset(
      "Second",
      values.map((value) => value * 2),
    )
    .onSelect(callback)
    .render();
  const mark = chart.element.querySelector(".orchid-charts-dense-hit");
  mark.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
  mark.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  expect(chart.point().index).toBe(64);
  expect(chart.point().values).toEqual([
    65,
    130,
  ]);
  expect(callback.mock.lastCall[0].values).toEqual(chart.point().values);
  chart.update({
    datasets: [
      { name: "First", values },
      { name: "Second", values },
    ],
  });
  expect(chart.point().index).toBe(64);
  expect(chart.point().values).toEqual([
    65,
    65,
  ]);
});

it("preserves gradient snapshots after caller mutation and resize", () => {
  const parent = host();
  const chart = LineChart.make(parent)
    .dataset([
      1,
      2,
    ])
    .render();
  const gradient = { fromOpacity: 0.7, toOpacity: 0.1 };
  chart.update({
    datasets: [
      {
        values: [
          1,
          2,
        ],
        gradient,
      },
    ],
  });
  gradient.fromOpacity = 0.2;
  parent.style.width = "700px";
  dispatchEvent(new Event("resize"));
  expect(chart.element.querySelector("stop").getAttribute("stop-opacity")).toBe("0.7");
});

it("applies radar dataset opacity to the visible polygon", () => {
  const chart = RadarChart.make(host())
    .dataset(
      [
        1,
        2,
        3,
      ],
      (s) => s.opacity(0.6),
    )
    .render();
  expect(getComputedStyle(chart.element.querySelector(".orchid-charts-radar")).opacity).toBe("0.6");
});
