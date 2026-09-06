import { beforeEach, describe, expect, it, vi } from "vitest";

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

const series = {
  labels: [
    "A",
    "B",
    "C",
  ],
  datasets: [
    {
      name: "One",
      values: [
        2,
        4,
        -1,
      ],
    },
  ],
};
beforeEach(() => {
  document.body.innerHTML = '<div id="chart" style="width: 640px"></div>';
});
describe("Pipeline Contracts", () => {
  it.each([
    [
      "line",
      () =>
        LineChart.make("#chart")
          .labels(series.labels)
          .dataset({
            name: "One",
            values: [
              2,
              4,
              -1,
            ],
          })
          .render(),
    ],
    [
      "bar",
      () =>
        BarChart.make("#chart")
          .labels(series.labels)
          .dataset({
            name: "One",
            values: [
              2,
              4,
              -1,
            ],
          })
          .render(),
    ],
    [
      "scatter",
      () =>
        ScatterChart.make("#chart")
          .labels(series.labels)
          .dataset({
            name: "One",
            values: [
              2,
              4,
              -1,
            ],
          })
          .render(),
    ],
    [
      "mixed",
      () =>
        MixedChart.make("#chart")
          .labels([
            "A",
            "B",
            "C",
          ])
          .dataset({ ...series.datasets[0], chartType: "line" })
          .render(),
    ],
    [
      "bubble",
      () =>
        BubbleChart.make("#chart")
          .dataset({
            values: [
              { x: 1, y: 2, r: 7 },
            ],
          })
          .render(),
    ],
    [
      "radar",
      () =>
        RadarChart.make("#chart")
          .labels([
            "A",
            "B",
            "C",
          ])
          .dataset({
            name: "One",
            values: [
              2,
              4,
              1,
            ],
          })
          .render(),
    ],
    [
      "polar-area",
      () =>
        PolarAreaChart.make("#chart")
          .labels([
            "A",
            "B",
            "C",
          ])
          .dataset({
            values: [
              2,
              4,
              1,
            ],
          })
          .render(),
    ],
    [
      "pie",
      () =>
        PieChart.make("#chart")
          .labels([
            "A",
            "B",
            "C",
          ])
          .dataset({
            values: [
              2,
              4,
              1,
            ],
          })
          .render(),
    ],
    [
      "donut",
      () =>
        DonutChart.make("#chart")
          .labels([
            "A",
            "B",
            "C",
          ])
          .dataset({
            values: [
              2,
              4,
              1,
            ],
          })
          .render(),
    ],
    [
      "percentage",
      () =>
        PercentageChart.make("#chart")
          .labels([
            "A",
            "B",
            "C",
          ])
          .dataset({
            values: [
              2,
              4,
              1,
            ],
          })
          .render(),
    ],
    [
      "heatmap",
      () => HeatmapChart.make("#chart").points({ "2026-01-01": 2 }).render(),
    ],
    [
      "timesheet",
      () =>
        TimesheetChart.make("#chart")
          .task({ label: "Build", start: "2026-01-01", end: "2026-01-02" })
          .render(),
    ],
  ])("mounts %s through its public builder", (_name, build) => {
    const chart = build();
    expect(chart.element.querySelector("desc")).not.toBeNull();
  });
  it("shares selection, serialization, download, update, and destroy lifecycle", () => {
    const chart = LineChart.make("#chart")
      .title("Revenue")
      .labels(series.labels)
      .dataset({
        name: "One",
        values: [
          2,
          4,
          -1,
        ],
      })
      .render();
    expect(chart.point(1)).toEqual({
      index: 1,
      label: "B",
      values: [
        4,
      ],
    });
    expect(
      chart.update({
        labels: [
          "A",
          "D",
          "B",
          "C",
        ],
        datasets: [
          {
            values: [
              2,
              8,
              4,
              -1,
            ],
          },
        ],
      }),
    ).toBe(chart);
    expect(chart.point(1).label).toBe("D");
    expect(chart.update(series)).toBe(chart);
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    expect(chart.toSvg()).toContain("<svg");
    expect(chart.download()).toBe(chart);
    expect(click).toHaveBeenCalledOnce();
    click.mockRestore();
    chart.destroy();
  });
  it("reports selected data consistently for chart families", () => {
    const selected = [];
    const onSelect = vi.fn();
    const chart = BarChart.make("#chart")
      .onSelect(onSelect)
      .labels(series.labels)
      .dataset({
        name: "One",
        values: [
          2,
          4,
          -1,
        ],
      })
      .render();
    chart.element.parentElement.addEventListener("data-select", (event) => {
      selected.push(event.detail);
    });
    chart.element
      .querySelector(".orchid-charts-mark")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(selected[0]).toMatchObject({
      type: "bar",
      index: 0,
      label: "A",
      x: 0,
      values: [
        2,
      ],
    });
    expect(selected[0].points).toEqual([
      { datasetIndex: 0, dataset: "One", label: "A", x: 0, y: 2 },
    ]);
    expect(onSelect).toHaveBeenCalledWith(selected[0]);
    chart.destroy();

    const bubbleSelect = vi.fn();
    const bubble = BubbleChart.make("#chart")
      .onSelect(bubbleSelect)
      .labels([
        "Reach",
      ])
      .dataset({
        name: "Audience",
        values: [
          { x: 7, y: 12, r: 9 },
        ],
      })
      .render();
    bubble.element
      .querySelector(".orchid-charts-point-hit")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(bubbleSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "bubble",
        x: 7,
        values: [
          12,
        ],
        points: [
          { datasetIndex: 0, dataset: "Audience", label: "Reach", x: 7, y: 12, r: 9 },
        ],
      }),
    );
    bubble.destroy();

    const sparseSelect = vi.fn();
    const sparse = LineChart.make("#chart")
      .onSelect(sparseSelect)
      .labels([
        "A",
        "B",
      ])
      .dataset({
        name: "Short",
        values: [
          1,
          0,
        ],
      })
      .dataset({
        name: "Long",
        values: [
          2,
          3,
        ],
      })
      .render();
    sparse.element
      .querySelectorAll(".orchid-charts-x-hit")[1]
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(sparseSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        values: [
          0,
          3,
        ],
      }),
    );
    expect(sparseSelect.mock.calls[0][0].points).toEqual([
      { datasetIndex: 0, dataset: "Short", label: "B", x: 1, y: 0 },
      { datasetIndex: 1, dataset: "Long", label: "B", x: 1, y: 3 },
    ]);
    sparse.destroy();
  });
  it("covers sparse and unlabeled data without diverging from the pipeline", () => {
    const unlabeled = LineChart.make("#chart")
      .dataset({
        values: [
          2,
          3,
        ],
      })
      .render();
    expect(unlabeled.element.querySelector(".orchid-charts-line title").textContent).toContain("1: 2");
    expect(
      unlabeled.element.querySelector(".orchid-charts-label:not(.orchid-charts-value-label)").textContent,
    ).toBe("1");
    unlabeled.destroy();

    const bubble = BubbleChart.make("#chart")
      .dataset({
        values: [
          { x: 4, y: 2, r: 4 },
        ],
      })
      .render();
    expect(bubble.element.querySelector("title").textContent).toContain("4: 2");
    bubble.destroy();
    const polar = PolarAreaChart.make("#chart")
      .dataset({
        values: [
          2,
        ],
      })
      .render();
    expect(polar.element.querySelector(".orchid-charts-mark").dataset.tooltip).toBe("1: 2");
    expect(polar.element.querySelector(".orchid-charts-label").textContent).toBe("1");
    polar.destroy();
    const radar = RadarChart.make("#chart")
      .dataset({
        values: [
          2,
          3,
        ],
      })
      .render();
    expect(radar.element.querySelectorAll(".orchid-charts-label")).toHaveLength(2);
    radar.destroy();
    const scatter = ScatterChart.make("#chart")
      .onSelect(() => {})
      .dataset({
        values: [
          { x: 5, y: 2 },
        ],
      })
      .render();
    expect(scatter.element.querySelector("title").textContent).toBe("5: 2");
    const scatterSelection = [];
    scatter.element.parentElement.addEventListener("data-select", (event) => {
      scatterSelection.push(event.detail);
    });
    scatter.element
      .querySelector(".orchid-charts-mark")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(scatterSelection[0].label).toBe(5);
    scatter.destroy();
    const bars = BarChart.make("#chart")
      .dataset({
        values: [
          2,
        ],
      })
      .render();
    expect(bars.element.querySelector(".orchid-charts-x-hit").dataset.tooltip).toBe("1 — Series 1: 2");
    bars.destroy();
    const mixedDefault = MixedChart.make("#chart")
      .dataset({
        chartType: "line",
        values: [
          1,
          2,
        ],
      })
      .render();
    expect(mixedDefault.element.querySelector(".orchid-charts-line")).not.toBeNull();
    mixedDefault.destroy();
    const multiBubble = BubbleChart.make("#chart")
      .dataset({
        name: "First",
        values: [
          { x: 1, y: 1, r: 5 },
        ],
      })
      .dataset({
        name: "Second",
        values: [
          { x: 2, y: 2, r: 5 },
        ],
      })
      .render();
    expect(multiBubble.element.querySelector(".orchid-charts-bubble title").textContent).toContain("First,");
    multiBubble.destroy();
    const multiScatter = ScatterChart.make("#chart")
      .dataset({
        name: "First",
        values: [
          1,
        ],
      })
      .dataset({
        name: "Second",
        values: [
          2,
        ],
      })
      .render();
    expect(multiScatter.element.querySelector(".orchid-charts-scatter title").textContent).toContain(
      "First,",
    );
  });
  it("covers lifecycle defaults after selection", () => {
    const chart = BarChart.make("#chart")
      .labels(series.labels)
      .dataset({
        name: "One",
        values: [
          2,
          4,
          -1,
        ],
      })
      .render();
    expect(chart.point()).toMatchObject({ index: 0, label: "A" });
    chart.element
      .querySelector(".orchid-charts-mark")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(chart.point()).toMatchObject({ index: 0, label: "A" });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    expect(chart.toSvg()).toContain("<svg");
    expect(chart.download()).toBe(chart);
    click.mockRestore();
  });
  it("formats extreme values, truncates long labels, wraps legends, and reports exact series selection", () => {
    const onSelect = vi.fn();
    const chart = LineChart.make("#chart")
      .width(180)
      .onSelect(onSelect)
      .labels([
        "A label that cannot fit in its category",
        "Short",
      ])
      .dataset({
        name: "A very long first series",
        values: [
          9_800_000,
          0.00012,
        ],
      })
      .dataset({
        name: "Another very long series",
        values: [
          8_400_000,
          0.00009,
        ],
      })
      .dataset({
        name: "Third comparison series",
        values: [
          7_600_000,
          0.00015,
        ],
      })
      .render();
    expect(chart.element.textContent).toContain("9.8M");
    expect(chart.element.querySelector(".orchid-charts-label title").textContent).toContain("cannot fit");
    const legendRows = new Set(
      [
        ...chart.element.querySelectorAll(".orchid-charts-legend"),
      ].map((item) => item.getAttribute("y")),
    );
    expect(legendRows.size).toBeGreaterThan(1);
    const tinyMark = chart.element.querySelector('.orchid-charts-x-hit[data-point-index="1"]');
    expect(tinyMark.dataset.tooltip).toContain("0.00012");
    tinyMark.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        values: [
          0.00012,
          0.00009,
          0.00015,
        ],
      }),
    );

    const compact = LineChart.make("#chart")
      .width(180)
      .labels([
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
      ])
      .dataset({
        values: [
          1,
          2,
          3,
          4,
          5,
          6,
        ],
      })
      .render();
    const compactLabels = [
      ...compact.element.querySelectorAll(".orchid-charts-label:not(.orchid-charts-value-label)"),
    ];
    expect(compactLabels.map((node) => node.textContent)).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
    ]);
    expect(compactLabels.map((node) => node.getAttribute("text-anchor"))).toEqual([
      "start",
      "middle",
      "middle",
      "middle",
      "middle",
      "end",
    ]);
  });
});
