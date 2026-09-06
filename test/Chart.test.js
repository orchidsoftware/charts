import { beforeEach, describe, expect, it } from "vitest";

import {
  BarChart,
  BubbleChart,
  DonutChart,
  LineChart,
  PieChart,
  PolarAreaChart,
  RadarChart,
  TimesheetChart,
} from "../src/index.js";
import "../src/styles.css";

const widthOf = (chart) => chart.element.viewBox.baseVal.width;

describe("Chart", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="chart"><span>old</span></div>';
  });
  it("renders and updates a line chart through the friendly factory", () => {
    const chart = LineChart.make("#chart")
      .width(400)
      .height(200)
      .ariaLabel("Growth")
      .dataset({
        name: "Alpha",
        color: "#123456",
        values: [2, -1, 4],
      })
      .dataset({
        name: "Beta",
        values: [1, 3, 2],
      })
      .render();
    expect(chart.element.getAttribute("aria-label")).toBe("Growth");
    expect(chart.element.getAttribute("height")).toBe("200");
    expect(chart.element.querySelectorAll(".orchid-charts-line")).toHaveLength(2);
    const firstGrid = chart.element.querySelector(".orchid-charts-grid-horizontal");
    expect(chart.element.querySelector(".orchid-charts-line").getAttribute("d")).toContain(
      `M${firstGrid.getAttribute("x1")},`,
    );
    expect(
      chart.update({
        datasets: [
          {
            values: [5, 5],
          },
        ],
      }),
    ).toBe(chart);
    expect(chart.element.querySelectorAll(".orchid-charts-line")).toHaveLength(1);
    chart.update({
      datasets: [
        {
          values: [8],
        },
      ],
    });
    const grid = chart.element.querySelector(".orchid-charts-grid-horizontal");
    const center = (Number(grid.getAttribute("x1")) + Number(grid.getAttribute("x2"))) / 2;
    expect(chart.element.querySelector(".orchid-charts-line").getAttribute("d")).toContain(
      `M${center},${grid.getAttribute("y1")}`,
    );
    chart.destroy();
    expect(document.querySelector("svg")).toBeNull();
  });

  it.each(["content-box", "border-box"])(
    "measures %s content width independently of padding, borders, and transforms",
    async (boxSizing) => {
      const host = document.querySelector("#chart");
      host.style.cssText = `box-sizing:${boxSizing};width:300.5px;padding:12px 20px;border:3px solid;transform:scale(1.5)`;
      const chart = LineChart.make(host)
        .dataset({
          name: "Alpha",
          color: "#123456",
          values: [2, -1, 4],
        })
        .dataset({
          name: "Beta",
          values: [1, 3, 2],
        })
        .render();
      const decorationWidth = boxSizing === "border-box" ? 46 : 0;
      expect(widthOf(chart)).toBe(300.5 - decorationWidth);
      expect(chart.element.getScreenCTM().a).toBeCloseTo(1.5, 3);

      host.style.width = "420.5px";
      await expect.poll(() => widthOf(chart)).toBe(420.5 - decorationWidth);
      expect(chart.element.getScreenCTM().a).toBeCloseTo(1.5, 3);
      chart.destroy();
    },
  );

  it("uses a readable fallback width before a zero-width host receives layout", () => {
    document.querySelector("#chart").style.width = "0px";
    const chart = LineChart.make("#chart")
      .dataset({
        name: "Alpha",
        color: "#123456",
        values: [2, -1, 4],
      })
      .dataset({
        name: "Beta",
        values: [1, 3, 2],
      })
      .render();
    expect(widthOf(chart)).toBe(640);
    const legend = chart.element.querySelector(".orchid-charts-legend-group").getBBox();
    expect(legend.x + legend.width).toBeLessThanOrEqual(widthOf(chart));
    chart.destroy();
  });

  it.each([null, "#missing"])("rejects invalid parent %s", (parent) => {
    expect(() => LineChart.make(parent).dataset([1]).render()).toThrow("parent");
  });

  it.each([
    [
      "line yAxisPosition/data: position (case 4)",
      () =>
        LineChart.make("#chart")
          .yAxis((axis) => axis.position("center"))
          .dataset({
            name: "Alpha",
            color: "#123456",
            values: [2, -1, 4],
          })
          .dataset({
            name: "Beta",
            values: [1, 3, 2],
          })
          .render(),
      "position",
    ],
    [
      "pie padAngle/data: padAngle (case 5)",
      () =>
        PieChart.make("#chart")
          .padAngle(Infinity)
          .dataset({
            name: "Alpha",
            color: "#123456",
            values: [2, -1, 4],
          })
          .dataset({
            name: "Beta",
            values: [1, 3, 2],
          })
          .render(),
      "padAngle",
    ],
    [
      "pie padAngle/data: padAngle (case 6)",
      () =>
        PieChart.make("#chart")
          .padAngle(-1)
          .dataset({
            name: "Alpha",
            color: "#123456",
            values: [2, -1, 4],
          })
          .dataset({
            name: "Beta",
            values: [1, 3, 2],
          })
          .render(),
      "padAngle",
    ],
    [
      "pie padAngle/data: padAngle (case 7)",
      () =>
        PieChart.make("#chart")
          .padAngle(360)
          .dataset({
            name: "Alpha",
            color: "#123456",
            values: [2, -1, 4],
          })
          .dataset({
            name: "Beta",
            values: [1, 3, 2],
          })
          .render(),
      "padAngle",
    ],
    [
      "bar radius/data: radius (case 8)",
      () =>
        BarChart.make("#chart")
          .radius(-1)
          .dataset({
            name: "Alpha",
            color: "#123456",
            values: [2, -1, 4],
          })
          .dataset({
            name: "Beta",
            values: [1, 3, 2],
          })
          .render(),
      "radius",
    ],
    [
      "donut cornerRadius/data: cornerRadius (case 9)",
      () =>
        DonutChart.make("#chart")
          .cornerRadius(-1)
          .dataset({
            name: "Alpha",
            color: "#123456",
            values: [2, -1, 4],
          })
          .dataset({
            name: "Beta",
            values: [1, 3, 2],
          })
          .render(),
      "cornerRadius",
    ],
    [
      "timesheet radius/data: radius (case 10)",
      () => TimesheetChart.make("#chart").radius(-1).task({ label: "Task", start: 1, end: 2 }).render(),
      "radius",
    ],
    ["line : data (case 11)", () => LineChart.make("#chart").render(), "dataset"],
    ["line data: dataset (case 12)", () => LineChart.make("#chart").render(), "dataset"],
    ["line data: object (case 13)", () => LineChart.make("#chart").dataset(null).render(), "object"],
    [
      "line data: values (case 14)",
      () => LineChart.make("#chart").dataset({ values: [] }).render(),
      "values",
    ],
    [
      "line data: finite (case 15)",
      () =>
        LineChart.make("#chart")
          .dataset({
            values: [null],
          })
          .render(),
      "finite",
    ],
    [
      "line data: finite (case 16)",
      () =>
        LineChart.make("#chart")
          .dataset({
            values: [NaN],
          })
          .render(),
      "finite",
    ],
    [
      "bubble data: finite (case 17)",
      () =>
        BubbleChart.make("#chart")
          .dataset({
            values: [{ y: 1, x: NaN }],
          })
          .render(),
      "finite",
    ],
    [
      "bubble data: finite (case 18)",
      () =>
        BubbleChart.make("#chart")
          .dataset({
            values: [{ x: 1, y: NaN, r: 1 }],
          })
          .render(),
      "finite",
    ],
    [
      "bubble data: finite (case 19)",
      () =>
        BubbleChart.make("#chart")
          .dataset({
            values: [{ x: 1, y: 1, r: NaN }],
          })
          .render(),
      "finite",
    ],
    [
      "line width/data: width (case 20)",
      () =>
        LineChart.make("#chart")
          .width(0)
          .dataset({
            name: "Alpha",
            color: "#123456",
            values: [2, -1, 4],
          })
          .dataset({
            name: "Beta",
            values: [1, 3, 2],
          })
          .render(),
      "width",
    ],
    [
      "line height/data: height (case 21)",
      () =>
        LineChart.make("#chart")
          .height(NaN)
          .dataset({
            name: "Alpha",
            color: "#123456",
            values: [2, -1, 4],
          })
          .dataset({
            name: "Beta",
            values: [1, 3, 2],
          })
          .render(),
      "height",
    ],
    [
      "radar data: match (case 22)",
      () =>
        RadarChart.make("#chart")
          .dataset({
            name: "First",
            values: [1],
          })
          .dataset({
            name: "Second",
            values: [1, 2],
          })
          .render(),
      "match",
    ],
    [
      "polar-area data: exactly one (case 23)",
      () =>
        PolarAreaChart.make("#chart")
          .dataset({
            name: "Alpha",
            color: "#123456",
            values: [2, -1, 4],
          })
          .dataset({
            name: "Beta",
            values: [1, 3, 2],
          })
          .render(),
      "exactly one",
    ],
    [
      "bubble data: negative (case 24)",
      () =>
        BubbleChart.make("#chart")
          .dataset({
            values: [{ x: 1, y: 1, r: -1 }],
          })
          .render(),
      "negative",
    ],
    [
      "line data: labels (case 25)",
      () =>
        LineChart.make("#chart")
          .labels("A")
          .dataset({
            values: [1],
          })
          .render(),
      "labels",
    ],
    ["bar horizontal requires boolean", () => BarChart.make("#chart").horizontal("diagonal"), "horizontal"],
  ])("rejects %s", (_name, build, message) => {
    expect(build).toThrow(message);
  });

  it("keeps the previous state when an update is invalid", () => {
    const chart = LineChart.make("#chart")
      .dataset({
        values: [1, 2],
      })
      .render();
    expect(() =>
      chart.update({
        labels: "invalid",
        datasets: [
          {
            values: [3],
          },
        ],
      }),
    ).toThrow("labels");
    expect(chart.point(0).values).toEqual([1]);
  });
});
