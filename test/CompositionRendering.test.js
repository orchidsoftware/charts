import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DonutChart,
  HeatmapChart,
  LineChart,
  PercentageChart,
  PieChart,
  PolarAreaChart,
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
describe("Composition Rendering", () => {
  it("renders all aggregation variants, pruning, legend control, and validation", () => {
    const many = {
      labels: [
        "A",
        "B",
        "C",
        "D",
      ],
      datasets: [
        {
          values: [
            40,
            30,
            20,
            10,
          ],
        },
      ],
    };
    const pie = PieChart.make("#chart")
      .maxSlices(3)
      .legend(false)
      .startAngle(30)
      .labels(many.labels)
      .dataset({
        values: [
          40,
          30,
          20,
          10,
        ],
      })
      .render();
    expect(pie.element.querySelectorAll(".orchid-charts-pie-slice")).toHaveLength(3);
    expect(pie.element.querySelector(".orchid-charts-legend")).toBeNull();
    pie.destroy();
    const donut = DonutChart.make("#chart")
      .labels(many.labels)
      .dataset({
        values: [
          40,
          30,
          20,
          10,
        ],
      })
      .render();
    expect(donut.element.querySelectorAll(".orchid-charts-donut-slice")).toHaveLength(4);
    expect(donut.element.querySelector(".orchid-charts-direct-value").textContent).toBe("100");
    donut.destroy();
    const single = DonutChart.make("#chart")
      .labels([
        "All",
      ])
      .dataset({
        values: [
          100,
        ],
      })
      .render();
    expect(single.element.querySelector("circle.orchid-charts-donut-slice")).not.toBeNull();
    single.destroy();
    const percentage = PercentageChart.make("#chart")
      .labels(many.labels)
      .dataset({
        values: [
          40,
          30,
          20,
          10,
        ],
      })
      .render();
    expect(percentage.element.querySelectorAll(".orchid-charts-percentage-segment")).toHaveLength(4);
    expect(percentage.element.querySelector("clipPath rect").getAttribute("rx")).toBe("6");
    expect(percentage.element.querySelectorAll(".orchid-charts-percentage-segment[clip-path]")).toHaveLength(
      4,
    );
    percentage.destroy();
    const squarePercentage = PercentageChart.make("#chart")
      .radius(0)
      .labels(many.labels)
      .dataset({
        values: [
          40,
          30,
          20,
          10,
        ],
      })
      .render();
    expect(squarePercentage.element.querySelector("clipPath")).toBeNull();
    expect(() =>
      PieChart.make("#chart")
        .labels([
          "None",
        ])
        .dataset({
          values: [
            0,
          ],
        })
        .render(),
    ).toThrow("positive value");
  });
  it("rounds radial sector boundaries according to their data geometry", () => {
    const data = {
      labels: [
        "A",
        "B",
        "C",
      ],
      datasets: [
        {
          values: [
            50,
            30,
            20,
          ],
        },
      ],
    };
    const pie = PieChart.make("#chart")
      .legend(false)
      .labels(data.labels)
      .dataset({
        values: [
          50,
          30,
          20,
        ],
      })
      .render();
    expect(pie.element.querySelector(".orchid-charts-pie-slice").getAttribute("d").match(/Q/g)).toHaveLength(
      2,
    );
    pie.destroy();

    const donut = DonutChart.make("#chart")
      .legend(false)
      .labels(data.labels)
      .dataset({
        values: [
          50,
          30,
          20,
        ],
      })
      .render();
    expect(
      donut.element.querySelector(".orchid-charts-donut-slice").getAttribute("d").match(/Q/g),
    ).toHaveLength(4);
    donut.destroy();

    const polar = PolarAreaChart.make("#chart")
      .legend(false)
      .labels(data.labels)
      .dataset({
        values: [
          50,
          30,
          20,
        ],
      })
      .render();
    expect(
      polar.element.querySelector(".orchid-charts-polar-area").getAttribute("d").match(/Q/g),
    ).toHaveLength(2);
    polar.destroy();

    const sharp = DonutChart.make("#chart")
      .legend(false)
      .cornerRadius(0)
      .labels(data.labels)
      .dataset({
        values: [
          50,
          30,
          20,
        ],
      })
      .render();
    expect(sharp.element.querySelector(".orchid-charts-donut-slice").getAttribute("d")).not.toContain("Q");
  });
  it("uses radius-aware pad geometry without distorting sector proportions", () => {
    const radialData = {
      labels: [
        "A",
        "B",
      ],
      datasets: [
        {
          values: [
            60,
            40,
          ],
        },
      ],
    };
    const startX = (chart, selector, isRing = false) => {
      const path = chart.element.querySelector(selector).getAttribute("d");
      const command = isRing ? "M" : "L";
      return Number(path.slice(path.indexOf(command) + 1).split(",", 1)[0]);
    };

    for (const [
      ,
      selector,
      ring,
      Definition,
    ] of [
      [
        "pie",
        ".orchid-charts-pie-slice",
        false,
        PieChart,
      ],
      [
        "donut",
        ".orchid-charts-donut-slice",
        true,
        DonutChart,
      ],
      [
        "polar-area",
        ".orchid-charts-polar-area",
        false,
        PolarAreaChart,
      ],
    ]) {
      const contiguous = Definition.make("#chart")
        .width(240)
        .height(240)
        .legend(false)
        .padAngle(0)
        .cornerRadius(0)
        .labels(radialData.labels)
        .dataset({
          values: [
            60,
            40,
          ],
        })
        .render();
      const separated = Definition.make("#chart")
        .width(240)
        .height(240)
        .legend(false)
        .cornerRadius(0)
        .labels(radialData.labels)
        .dataset({
          values: [
            60,
            40,
          ],
        })
        .render();
      expect(startX(contiguous, selector, ring)).toBeCloseTo(120);
      expect(startX(separated, selector, ring)).toBeGreaterThan(startX(contiguous, selector, ring));
      contiguous.destroy();
      separated.destroy();
    }

    const custom = PieChart.make("#chart")
      .width(240)
      .height(240)
      .legend(false)
      .padAngle(12)
      .cornerRadius(0)
      .labels(radialData.labels)
      .dataset({
        values: [
          60,
          40,
        ],
      })
      .render();
    const standard = PieChart.make("#chart")
      .width(240)
      .height(240)
      .legend(false)
      .cornerRadius(0)
      .labels(radialData.labels)
      .dataset({
        values: [
          60,
          40,
        ],
      })
      .render();
    expect(startX(custom, ".orchid-charts-pie-slice")).toBeGreaterThan(
      startX(standard, ".orchid-charts-pie-slice"),
    );

    const tiny = PieChart.make("#chart")
      .padAngle(359)
      .labels([
        "Tiny",
        "Rest",
      ])
      .dataset({
        values: [
          0.000001,
          1,
        ],
      })
      .render();
    expect(
      [
        ...tiny.element.querySelectorAll(".orchid-charts-pie-slice"),
      ].every((slice) => !slice.getAttribute("d").includes("NaN")),
    ).toBe(true);
    const zero = PieChart.make("#chart")
      .labels([
        "None",
        "All",
      ])
      .dataset({
        values: [
          0,
          1,
        ],
      })
      .render();
    expect(zero.element.querySelectorAll(".orchid-charts-pie-slice")).toHaveLength(1);
    expect(zero.element.querySelector("circle.orchid-charts-pie-slice")).not.toBeNull();

    const donut = DonutChart.make("#chart")
      .width(240)
      .height(240)
      .legend(false)
      .padAngle(12)
      .cornerRadius(0)
      .labels(radialData.labels)
      .dataset({
        values: [
          60,
          40,
        ],
      })
      .render();
    const numbers = donut.element
      .querySelector(".orchid-charts-donut-slice")
      .getAttribute("d")
      .split(/[A-Za-z, ]+/)
      .filter(Boolean)
      .map(Number);
    const outerStartAngle = Math.atan2(numbers[1] - 120, numbers[0] - 120);
    const innerStartAngle = Math.atan2(numbers[17] - 120, numbers[16] - 120);
    expect(innerStartAngle).not.toBeCloseTo(outerStartAngle);
  });
  it("fills aggregation height and reserves wrapped legends systematically", () => {
    const data = {
      labels: [
        "Done",
        "In progress",
        "Waiting",
        "Open",
      ],
      datasets: [
        {
          values: [
            40,
            30,
            20,
            10,
          ],
        },
      ],
    };
    const percentage = PercentageChart.make("#chart")
      .height(280)
      .labels(data.labels)
      .dataset({
        values: [
          40,
          30,
          20,
          10,
        ],
      })
      .render();
    const segment = percentage.element.querySelector(".orchid-charts-percentage-segment");
    const legendLabels = [
      ...percentage.element.querySelectorAll(".orchid-charts-legend"),
    ];
    expect(Number(segment.getAttribute("height"))).toBe(257);
    expect(Number(segment.getAttribute("y"))).toBe(0);
    expect(Number(segment.getAttribute("y")) + Number(segment.getAttribute("height"))).toBe(
      Number(legendLabels[0].getAttribute("y")) - 20,
    );
    expect(Number(legendLabels.at(-1).getAttribute("y"))).toBe(277);
    percentage.destroy();

    const hiddenLegend = PercentageChart.make("#chart")
      .height(280)
      .legend(false)
      .labels(data.labels)
      .dataset({
        values: [
          40,
          30,
          20,
          10,
        ],
      })
      .render();
    expect(
      Number(hiddenLegend.element.querySelector(".orchid-charts-percentage-segment").getAttribute("height")),
    ).toBe(280);
    expect(hiddenLegend.element.querySelector(".orchid-charts-percentage-segment")).toHaveAttribute("y", "0");
    expect(hiddenLegend.element.querySelector(".orchid-charts-legend-group")).toBeNull();
    hiddenLegend.destroy();

    const wrappedData = {
      labels: [
        "Completed after review",
        "In progress with owner",
        "Waiting for approval",
        "Open without assignee",
      ],
      datasets: [
        {
          values: [
            40,
            30,
            20,
            10,
          ],
        },
      ],
    };
    const wrapped = PercentageChart.make("#chart")
      .width(180)
      .height(280)
      .labels(wrappedData.labels)
      .dataset({
        values: [
          40,
          30,
          20,
          10,
        ],
      })
      .render();
    const wrappedLegendY = [
      ...wrapped.element.querySelectorAll(".orchid-charts-legend"),
    ].map((label) => Number(label.getAttribute("y")));
    const wrappedSegment = wrapped.element.querySelector(".orchid-charts-percentage-segment");
    expect(wrappedLegendY).toEqual([
      217,
      237,
      257,
      277,
    ]);
    expect(Number(wrappedSegment.getAttribute("y")) + Number(wrappedSegment.getAttribute("height"))).toBe(
      wrappedLegendY[0] - 20,
    );
    wrapped.destroy();

    for (const [
      type,
      Definition,
    ] of [
      [
        "pie",
        PieChart,
      ],
      [
        "donut",
        DonutChart,
      ],
    ]) {
      const radial = Definition.make("#chart")
        .height(280)
        .labels(data.labels)
        .dataset({
          values: [
            40,
            30,
            20,
            10,
          ],
        })
        .render();
      const slices = [
        ...radial.element.querySelectorAll(`.orchid-charts-${type}-slice`),
      ].map((slice) => slice.getBBox());
      const top = Math.min(...slices.map((bounds) => bounds.y));
      const bottom = Math.max(...slices.map((bounds) => bounds.y + bounds.height));
      expect(bottom - top).toBeGreaterThan(190);
      expect(top).toBeGreaterThanOrEqual(0);
      expect(bottom).toBeCloseTo(257, 3);
      radial.destroy();
    }
  });
  it("covers sparse aggregation, explicit frameless routing, empty heatmaps, and download names", () => {
    expect(() =>
      PieChart.make("#chart")
        .labels([
          "A",
          "B",
        ])
        .dataset({
          values: [
            2,
          ],
        })
        .render(),
    ).toThrow("match every dataset");
    const frameless = LineChart.make("#chart")
      .axes(false)
      .grid(false)
      .valueLabels(false)
      .legend(false)
      .area(true)
      .dataset({
        values: [
          2,
          5,
        ],
      })
      .render();
    expect(frameless.element.querySelector(".orchid-charts-area")).not.toBeNull();
    frameless.destroy();
    expect(() => HeatmapChart.make("#chart").points({}).render()).toThrow("at least one entry");
    const heatmap = HeatmapChart.make("#chart").points({ "2026-01-01": 0 }).render();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    expect(heatmap.toSvg()).toContain("<svg");
    expect(heatmap.download("Heatmap.svg")).toBe(heatmap);
    click.mockRestore();
    heatmap.destroy();
    const gradient = LineChart.make("#chart")
      .gradient(true)
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
    expect(gradient.element.querySelector("linearGradient")).not.toBeNull();
  });
});
