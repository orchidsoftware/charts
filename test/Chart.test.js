import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  BarChart,
  BubbleChart,
  DonutChart,
  LineChart,
  MixedChart,
  PieChart,
  PolarAreaChart,
  RadarChart,
  TimesheetChart,
} from "../src/index.js";
import "../src/styles.css";

const tooltipFor = (chart) => chart.element.parentElement.querySelector(".orchid-charts-tooltip");
const widthOf = (chart) => chart.element.viewBox.baseVal.width;
const tickText = (chart) =>
  [
    ...chart.element.querySelectorAll(".orchid-charts-value-label"),
  ].map((label) => label.textContent);

const data = {
  datasets: [
    {
      name: "Alpha",
      color: "#123456",
      values: [
        2,
        -1,
        4,
      ],
    },
    {
      name: "Beta",
      values: [
        1,
        3,
        2,
      ],
    },
  ],
};

describe("Chart", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="chart"><span>old</span></div>';
  });

  it("groups compact color dots beside their labels without adding interaction targets", () => {
    const chart = LineChart.make("#chart")
      .dataset({
        name: "Alpha",
        color: "#123456",
        values: [
          2,
          -1,
          4,
        ],
      })
      .dataset({
        name: "Beta",
        values: [
          1,
          3,
          2,
        ],
      })
      .render();
    const samples = [
      ...chart.element.querySelectorAll(".orchid-charts-legend-swatch"),
    ];
    const labels = [
      ...chart.element.querySelectorAll(".orchid-charts-legend"),
    ];
    expect(samples.map((sample) => sample.tagName)).toEqual([
      "circle",
      "circle",
    ]);
    for (const [
      index,
      sample,
    ] of samples.entries()) {
      expect(sample.getAttribute("fill")).toBe(
        chart.element.querySelectorAll(".orchid-charts-line")[index].getAttribute("stroke"),
      );
      expect(labels[index].getBBox().x - (sample.getBBox().x + sample.getBBox().width)).toBe(8);
      expect(sample.getBBox().y).toBeLessThan(labels[index].getBBox().y + labels[index].getBBox().height);
      expect(sample.getBBox().width).toBe(8);
      expect(sample.getAttribute("aria-hidden")).toBe("true");
      expect(sample.hasAttribute("tabindex")).toBe(false);
    }
    const legendTop = chart.element.querySelector(".orchid-charts-legend-group").getBBox().y;
    for (const label of chart.element.querySelectorAll(".orchid-charts-label")) {
      expect(label.getBBox().y + label.getBBox().height).toBeLessThan(legendTop);
    }
    chart.destroy();
  });

  it("uses the same color dots for every series in a mixed legend", () => {
    const builder = MixedChart.make("#chart");
    for (const [
      index,
      chartType,
    ] of [
      "bar",
      "line",
      "scatter",
      "line",
    ].entries()) {
      builder.dataset({
        chartType,
        name: `Series ${index}`,
        values: [
          1,
          2,
          3,
        ],
      });
    }
    const chart = builder.render();
    const samples = [
      ...chart.element.querySelectorAll(".orchid-charts-legend-swatch"),
    ];
    expect(samples.map((sample) => sample.tagName)).toEqual([
      "circle",
      "circle",
      "circle",
      "circle",
    ]);
    chart.destroy();
  });

  it("renders and updates a line chart through the friendly factory", () => {
    const chart = LineChart.make("#chart")
      .width(400)
      .height(200)
      .ariaLabel("Growth")
      .dataset({
        name: "Alpha",
        color: "#123456",
        values: [
          2,
          -1,
          4,
        ],
      })
      .dataset({
        name: "Beta",
        values: [
          1,
          3,
          2,
        ],
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
            values: [
              5,
              5,
            ],
          },
        ],
      }),
    ).toBe(chart);
    expect(chart.element.querySelectorAll(".orchid-charts-line")).toHaveLength(1);
    chart.update({
      datasets: [
        {
          values: [
            8,
          ],
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

  it.each([
    "content-box",
    "border-box",
  ])("measures %s content width independently of padding, borders, and transforms", async (boxSizing) => {
    const host = document.querySelector("#chart");
    host.style.cssText = `box-sizing:${boxSizing};width:300.5px;padding:12px 20px;border:3px solid;transform:scale(1.5)`;
    const chart = LineChart.make(host)
      .dataset({
        name: "Alpha",
        color: "#123456",
        values: [
          2,
          -1,
          4,
        ],
      })
      .dataset({
        name: "Beta",
        values: [
          1,
          3,
          2,
        ],
      })
      .render();
    const decorationWidth = boxSizing === "border-box" ? 46 : 0;
    expect(widthOf(chart)).toBe(300.5 - decorationWidth);
    expect(chart.element.getScreenCTM().a).toBeCloseTo(1.5, 3);

    host.style.width = "420.5px";
    await expect.poll(() => widthOf(chart)).toBe(420.5 - decorationWidth);
    expect(chart.element.getScreenCTM().a).toBeCloseTo(1.5, 3);
    chart.destroy();
  });

  it("uses a readable fallback width before a zero-width host receives layout", () => {
    document.querySelector("#chart").style.width = "0px";
    const chart = LineChart.make("#chart")
      .dataset({
        name: "Alpha",
        color: "#123456",
        values: [
          2,
          -1,
          4,
        ],
      })
      .dataset({
        name: "Beta",
        values: [
          1,
          3,
          2,
        ],
      })
      .render();
    expect(widthOf(chart)).toBe(640);
    const legend = chart.element.querySelector(".orchid-charts-legend-group").getBBox();
    expect(legend.x + legend.width).toBeLessThanOrEqual(widthOf(chart));
    chart.destroy();
  });

  it("reserves legend space only while a legend is visible", () => {
    const chart = LineChart.make("#chart")
      .width(400)
      .dataset({
        name: "Alpha",
        color: "#123456",
        values: [
          2,
          -1,
          4,
        ],
      })
      .dataset({
        name: "Beta",
        values: [
          1,
          3,
          2,
        ],
      })
      .render();
    const plotTop = () =>
      Number(chart.element.querySelector(".orchid-charts-grid-horizontal").getAttribute("y1"));
    const originalBottom = Number(chart.element.querySelector(".orchid-charts-x-axis").getAttribute("y1"));
    expect(plotTop()).toBe(8);
    expect(chart.element.querySelector(".orchid-charts-legend-group")).not.toBeNull();

    chart.update({
      datasets: [
        data.datasets[0],
      ],
    });
    expect(chart.element.querySelector(".orchid-charts-legend-group")).toBeNull();
    expect(Number(chart.element.querySelector(".orchid-charts-x-axis").getAttribute("y1"))).toBeGreaterThan(
      originalBottom,
    );
    expect(plotTop()).toBe(8);
    for (const label of chart.element.querySelectorAll(".orchid-charts-value-label")) {
      expect(label.getBBox().y).toBeGreaterThanOrEqual(0);
    }

    chart.update(data);
    expect(plotTop()).toBe(8);
    chart.destroy();

    const hidden = LineChart.make("#chart")
      .legend(false)
      .dataset({
        name: "Alpha",
        color: "#123456",
        values: [
          2,
          -1,
          4,
        ],
      })
      .dataset({
        name: "Beta",
        values: [
          1,
          3,
          2,
        ],
      })
      .render();
    expect(hidden.element.querySelector(".orchid-charts-legend-group")).toBeNull();
    expect(Number(hidden.element.querySelector(".orchid-charts-grid-horizontal").getAttribute("y1"))).toBe(8);
    hidden.destroy();

    const bare = LineChart.make("#chart")
      .legend(false)
      .valueLabels(false)
      .dataset({
        name: "Alpha",
        color: "#123456",
        values: [
          2,
          -1,
          4,
        ],
      })
      .dataset({
        name: "Beta",
        values: [
          1,
          3,
          2,
        ],
      })
      .render();
    expect(Number(bare.element.querySelector(".orchid-charts-grid-horizontal").getAttribute("y1"))).toBe(0);
  });

  it("renders a labelled gradient line with native hover titles", () => {
    const chart = LineChart.make("#chart")
      .gradient(true)
      .labels([
        "Mon",
        "Tue",
        "Wed",
      ])
      .dataset({
        name: "Revenue",
        values: [
          1,
          4,
          2,
        ],
      })
      .render();
    expect(chart.element.querySelectorAll("linearGradient stop")).toHaveLength(2);
    expect(chart.element.querySelector(".orchid-charts-area").getAttribute("fill")).toContain(
      "orchid-charts-gradient-",
    );
    expect(chart.element.querySelectorAll(".orchid-charts-grid-horizontal")).toHaveLength(5);
    expect(chart.element.querySelectorAll(".orchid-charts-grid-vertical")).toHaveLength(0);
    expect(
      [
        ...chart.element.querySelectorAll(".orchid-charts-grid"),
      ].map((line) => line.dataset.tick),
    ).toEqual(
      [
        ...chart.element.querySelectorAll(".orchid-charts-value-label"),
      ].map((label) => label.textContent),
    );
    expect(chart.element.querySelectorAll(".orchid-charts-point title")).toHaveLength(3);
    expect(chart.element.querySelector(".orchid-charts-point title").textContent).toBe("Mon: 1");
    expect(chart.element.querySelector(".orchid-charts-point").getAttribute("fill")).toBe(
      "var(--orchid-charts-point-fill)",
    );
    expect(chart.element.querySelector(".orchid-charts-point").getAttribute("stroke")).toBe("#007AFF");
    expect(chart.element.querySelector(".orchid-charts-point").getAttribute("r")).toBe("3");
    expect(getComputedStyle(chart.element.querySelector(".orchid-charts-point")).strokeWidth).toBe("2px");
    const halo = chart.element.querySelector(".orchid-charts-point-halo");
    expect(halo.getAttribute("cx")).toBe(
      chart.element.querySelector(".orchid-charts-point").getAttribute("cx"),
    );
    expect(halo.getAttribute("cy")).toBe(
      chart.element.querySelector(".orchid-charts-point").getAttribute("cy"),
    );
    expect(getComputedStyle(halo).strokeWidth).toBe("3px");
    expect(halo.querySelector("title")).toBeNull();
    expect(
      [
        ...chart.element.querySelectorAll(".orchid-charts-label:not(.orchid-charts-value-label)"),
      ].map((node) => node.textContent),
    ).toEqual([
      "Mon",
      "Tue",
      "Wed",
    ]);
  });

  it("keeps first and last x labels inside the SVG without wrapping", () => {
    const labels = [
      "Initial calibration window",
      "After first adjustment",
      "Post-validation measurement",
      "Final stabilized sample",
    ];
    const chart = LineChart.make("#chart")
      .width(900)
      .labels(labels)
      .dataset({
        values: [
          1,
          2,
          1.5,
          3,
        ],
      })
      .render();
    const nodes = [
      ...chart.element.querySelectorAll(".orchid-charts-label:not(.orchid-charts-value-label)"),
    ];
    const boxes = nodes.map((node) => node.getBBox());
    expect(nodes.map((node) => node.textContent)).toEqual(labels);
    expect(nodes.map((node) => node.getAttribute("text-anchor"))).toEqual([
      "start",
      "middle",
      "middle",
      "end",
    ]);
    expect(nodes.every((node) => node.querySelector("tspan") === null)).toBe(true);
    expect(boxes[0].x).toBeGreaterThanOrEqual(0);
    // Chromium's Linux font metrics can extend the visual bounding box by a
    // fraction of a pixel even though the label is anchored at the plot edge.
    expect(boxes.at(-1).x + boxes.at(-1).width).toBeLessThanOrEqual(900.5);
    const precedingBoxes = boxes.slice(0, -1);
    for (const [
      index,
      box,
    ] of precedingBoxes.entries()) {
      expect(box.x + box.width).toBeLessThanOrEqual(boxes[index + 1].x);
    }
    chart.destroy();

    const narrow = LineChart.make("#chart")
      .width(240)
      .labels([
        labels[0],
        labels.at(-1),
      ])
      .dataset({
        values: [
          1,
          2,
        ],
      })
      .render();
    const narrowNodes = [
      ...narrow.element.querySelectorAll(".orchid-charts-label:not(.orchid-charts-value-label)"),
    ];
    const narrowBoxes = narrowNodes.map((node) => node.getBBox());
    expect(narrowNodes.map((node) => node.textContent)).toEqual([
      labels[0],
    ]);
    expect(narrowNodes.every((node) => node.querySelector("tspan") === null)).toBe(true);
    expect(narrowBoxes[0].x).toBeGreaterThanOrEqual(0);
    expect(narrowBoxes[0].x + narrowBoxes[0].width).toBeLessThanOrEqual(widthOf(narrow) + 0.5);
  });

  it("uses whole-number nice ticks for integer data and preserves meaningful fractions", () => {
    const integer = LineChart.make("#chart")
      .dataset({
        values: [
          1,
          2,
          3,
          5,
        ],
      })
      .render();
    expect(tickText(integer)).toEqual([
      "5",
      "4",
      "3",
      "2",
      "1",
      "0",
    ]);
    expect(integer.element.querySelectorAll(".orchid-charts-grid-horizontal")).toHaveLength(6);
    const integerLabels = [
      ...integer.element.querySelectorAll(".orchid-charts-value-label"),
    ];
    for (const [
      index,
      label,
    ] of integerLabels.entries()) {
      expect(Number(label.getAttribute("y")) - 3).toBeCloseTo(
        Number(integer.element.querySelectorAll(".orchid-charts-grid-horizontal")[index].getAttribute("y1")),
        8,
      );
    }
    expect(integerLabels.map((label) => Number(label.getAttribute("y")))).toEqual(
      integerLabels.map((label) => Number(label.getAttribute("y"))).toSorted((a, b) => a - b),
    );
    expect(Number(integerLabels[0].getAttribute("y"))).toBeLessThan(
      Number(integerLabels.at(-1).getAttribute("y")),
    );
    integer.destroy();

    const small = BarChart.make("#chart")
      .dataset({
        values: [
          1,
          2,
        ],
      })
      .render();
    expect(tickText(small)).toEqual([
      "2",
      "1",
      "0",
    ]);
    const smallLabels = [
      ...small.element.querySelectorAll(".orchid-charts-value-label"),
    ];
    expect(Number(smallLabels[0].getAttribute("y"))).toBeLessThan(
      Number(smallLabels.at(-1).getAttribute("y")),
    );
    small.destroy();

    const negative = BarChart.make("#chart")
      .horizontal()
      .dataset({
        values: [
          -3,
          4,
        ],
      })
      .render();
    expect(tickText(negative)).toEqual([
      "-4",
      "-2",
      "0",
      "2",
      "4",
    ]);
    expect(negative.element.querySelectorAll(".orchid-charts-grid-vertical")).toHaveLength(5);
    for (const [
      index,
      label,
    ] of [
      ...negative.element.querySelectorAll(".orchid-charts-value-label"),
    ].entries()) {
      expect(Number(label.getAttribute("x"))).toBeCloseTo(
        Number(negative.element.querySelectorAll(".orchid-charts-grid-vertical")[index].getAttribute("x1")),
        8,
      );
    }
    negative.destroy();

    const millions = LineChart.make("#chart")
      .dataset({
        values: [
          6_450_000,
          12_750_000,
        ],
      })
      .render();
    expect(tickText(millions)).toEqual([
      "15M",
      "10M",
      "5M",
      "0",
    ]);
    millions.destroy();

    const fractions = LineChart.make("#chart")
      .dataset({
        values: [
          0.00009,
          0.00021,
        ],
      })
      .render();
    expect(tickText(fractions)).toEqual([
      "0.00025",
      "0.0002",
      "0.00015",
      "0.0001",
      "0.00005",
      "0",
    ]);
    const fractionLabels = [
      ...fractions.element.querySelectorAll(".orchid-charts-value-label"),
    ];
    const fractionPlotLeft = Number(
      fractions.element.querySelector(".orchid-charts-grid-horizontal").getAttribute("x1"),
    );
    expect(fractionPlotLeft).toBeGreaterThan(28);
    expect(fractionLabels.every((label) => label.getBBox().x >= 0)).toBe(true);
    expect(fractionLabels.every((label) => Number(label.getAttribute("x")) === fractionPlotLeft - 5)).toBe(
      true,
    );
    expect(
      Number(
        fractions.element
          .querySelector(".orchid-charts-label:not(.orchid-charts-value-label)")
          .getAttribute("x"),
      ),
    ).toBe(fractionPlotLeft);
    fractions.destroy();

    const tens = LineChart.make("#chart")
      .dataset({
        values: [
          8,
          32,
        ],
      })
      .render();
    expect(tickText(tens)).toEqual([
      "40",
      "30",
      "20",
      "10",
      "0",
    ]);
    tens.destroy();

    const zero = LineChart.make("#chart")
      .dataset({
        values: [
          0,
          0,
        ],
      })
      .render();
    expect(tickText(zero)).toEqual([
      "1",
      "0",
      "-1",
    ]);
    zero.destroy();

    const equalFractions = LineChart.make("#chart")
      .axes(false)
      .grid(true)
      .valueLabels(false)
      .dataset({
        values: [
          0.25,
          0.25,
        ],
      })
      .render();
    expect(equalFractions.element.querySelector(".orchid-charts-axis")).toBeNull();
    expect(equalFractions.element.querySelector(".orchid-charts-grid-horizontal")).not.toBeNull();
    equalFractions.destroy();
  });

  it("renders vertical grouped bars for positive and negative values", () => {
    const chart = BarChart.make(document.querySelector("#chart"))
      .dataset({
        name: "Alpha",
        color: "#123456",
        values: [
          2,
          -1,
          4,
        ],
      })
      .dataset({
        name: "Beta",
        values: [
          1,
          3,
          2,
        ],
      })
      .render();
    const bars = [
      ...chart.element.querySelectorAll(".orchid-charts-bar.orchid-charts-visual-mark"),
    ];
    expect(bars).toHaveLength(6);
    expect(bars[0].getBBox().height).toBeGreaterThan(0);
    expect(bars[1].getBBox().height).toBeGreaterThan(0);

    const firstBand = chart.element.querySelector(".orchid-charts-x-hit[data-point-index='0']");
    const bandStart = Number(firstBand.getAttribute("x"));
    const bandEnd = bandStart + Number(firstBand.getAttribute("width"));
    const firstCategoryBars = bars.filter((bar) => bar.dataset.pointIndex === "0");
    expect(firstCategoryBars).toHaveLength(2);
    expect(firstCategoryBars.every((bar) => bar.getBBox().x >= bandStart)).toBe(true);
    expect(firstCategoryBars.every((bar) => bar.getBBox().x + bar.getBBox().width <= bandEnd)).toBe(true);
  });

  it("renders horizontal bars", () => {
    const chart = BarChart.make("#chart")
      .horizontal()
      .labels([
        "One",
        "Two",
        "Three",
      ])
      .dataset({
        name: "Alpha",
        color: "#123456",
        values: [
          2,
          -1,
          4,
        ],
      })
      .dataset({
        name: "Beta",
        values: [
          1,
          3,
          2,
        ],
      })
      .render();
    const bars = chart.element.querySelectorAll(".orchid-charts-bar.orchid-charts-visual-mark");
    expect(bars).toHaveLength(6);
    expect(bars[0].getBBox().width).toBeGreaterThan(0);
    expect(bars[1].getBBox().width).toBeGreaterThan(0);
    expect(
      Math.max(
        ...[
          ...bars,
        ].map((bar) => bar.getBBox().y + bar.getBBox().height),
      ),
    ).toBeLessThanOrEqual(292);
    const labels = [
      ...chart.element.querySelectorAll(".orchid-charts-label:not(.orchid-charts-value-label)"),
    ];
    expect(labels.map((label) => label.textContent)).toEqual([
      "One",
      "Two",
      "Three",
    ]);
    expect(labels.every((label) => label.getAttribute("text-anchor") === "end")).toBe(true);
    const axisX = Number(chart.element.querySelector(".orchid-charts-axis").getAttribute("x1"));
    expect(axisX).toBeLessThan(45);
    expect(labels.every((label) => Number(label.getAttribute("x")) === axisX - 4)).toBe(true);
    expect(chart.element.classList.contains("orchid-charts-horizontal-bar")).toBe(true);
    expect(chart.element.querySelectorAll(".orchid-charts-grid-horizontal")).toHaveLength(0);
    expect(chart.element.querySelectorAll(".orchid-charts-grid-vertical")).toHaveLength(6);
    chart.element
      .querySelector(".orchid-charts-x-hit")
      .dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 90, clientY: 40 }));
    expect(tooltipFor(chart).hidden).toBe(false);
    expect(tooltipFor(chart).querySelector(".orchid-charts-tooltip-heading").textContent).toBe("One");
    expect(
      [
        ...tooltipFor(chart).querySelectorAll(".orchid-charts-tooltip-row strong"),
      ].map((node) => node.textContent),
    ).toEqual([
      "2",
      "1",
    ]);
    const tooltipSwatches = [
      ...tooltipFor(chart).querySelectorAll(".orchid-charts-series-swatch"),
    ];
    expect(tooltipSwatches).toHaveLength(2);
    expect(
      tooltipSwatches.every(
        (swatch) =>
          getComputedStyle(swatch).width === "8px" && getComputedStyle(swatch).borderRadius === "50%",
      ),
    ).toBe(true);
    expect(tooltipSwatches.every((swatch) => swatch.getAttribute("aria-hidden") === "true")).toBe(true);
    expect(Number(tooltipFor(chart).style.left.replace("px", ""))).toBeGreaterThan(0);
    chart.element.dispatchEvent(new MouseEvent("mouseleave"));
    expect(tooltipFor(chart).hidden).toBe(true);
    chart.destroy();

    document.querySelector("#chart").style.width = "500px";
    const unlabelled = BarChart.make("#chart")
      .horizontal()
      .dataset({
        name: "Alpha",
        color: "#123456",
        values: [
          2,
          -1,
          4,
        ],
      })
      .dataset({
        name: "Beta",
        values: [
          1,
          3,
          2,
        ],
      })
      .render();
    expect(unlabelled.element.querySelector(".orchid-charts-bar title").textContent).toBe("Alpha, 1: 2");
    expect(widthOf(unlabelled)).toBe(500);
    document.querySelector("#chart").style.width = "560px";
    dispatchEvent(new Event("resize"));
    expect(widthOf(unlabelled)).toBe(560);
    unlabelled.element.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
    expect(tooltipFor(unlabelled).hidden).toBe(true);
    unlabelled.destroy();
  });

  it("places the Y-axis and its labels on the right without overflow", () => {
    const line = LineChart.make("#chart")
      .width(220)
      .yAxis((axis) => axis.position("right"))
      .labels([
        "A",
        "B",
        "C",
      ])
      .dataset({
        values: [
          0.00009,
          0.00014,
          0.00021,
        ],
      })
      .render();
    const valueLabels = [
      ...line.element.querySelectorAll(".orchid-charts-value-label"),
    ];
    const plotRight = Number(line.element.querySelector(".orchid-charts-grid-horizontal").getAttribute("x2"));
    expect(valueLabels.every((label) => label.getAttribute("text-anchor") === "start")).toBe(true);
    expect(valueLabels.every((label) => Number(label.getAttribute("x")) === plotRight + 5)).toBe(true);
    expect(
      Math.max(...valueLabels.map((label) => label.getBBox().x + label.getBBox().width)),
    ).toBeLessThanOrEqual(220);
    expect(Number(line.element.querySelector(".orchid-charts-grid-horizontal").getAttribute("x1"))).toBe(0);
    const lastHit = [
      ...line.element.querySelectorAll(".orchid-charts-x-hit"),
    ].at(-1);
    expect(Number(lastHit.getAttribute("x")) + Number(lastHit.getAttribute("width"))).toBe(plotRight);
    line.destroy();

    const horizontal = BarChart.make("#chart")
      .width(240)
      .horizontal()
      .yAxis((axis) => axis.position("right"))
      .labels([
        "North America",
        "Europe",
        "Asia-Pacific",
      ])
      .dataset({
        values: [
          42,
          36,
          54,
        ],
      })
      .render();
    const categoryLabels = [
      ...horizontal.element.querySelectorAll(".orchid-charts-label:not(.orchid-charts-value-label)"),
    ];
    const axisX = Number(horizontal.element.querySelector(".orchid-charts-y-axis").getAttribute("x1"));
    expect(categoryLabels.every((label) => label.getAttribute("text-anchor") === "start")).toBe(true);
    expect(categoryLabels.every((label) => Number(label.getAttribute("x")) === axisX + 4)).toBe(true);
    expect(
      Math.max(...categoryLabels.map((label) => label.getBBox().x + label.getBBox().width)),
    ).toBeLessThanOrEqual(240);
  });

  it("uses an explicit label formatter without changing source data or interaction labels", () => {
    const sourceLabels = [
      "North America",
      "Europe",
      "Asia-Pacific",
    ];
    const formatLabel = vi.fn((label) => `Region: ${label}`);
    const chart = BarChart.make("#chart")
      .horizontal()
      .width(640)
      .formatLabel(formatLabel)
      .labels(sourceLabels)
      .dataset({
        values: [
          9_800_000,
          12_750_000,
          6_450_000,
        ],
      })
      .render();
    const labels = [
      ...chart.element.querySelectorAll(".orchid-charts-multiline-label"),
    ];
    expect(labels.map((label) => label.textContent)).toEqual(sourceLabels.map((label) => `Region: ${label}`));
    expect(labels.map((label) => label.getAttribute("aria-label"))).toEqual(sourceLabels);
    expect(chart.point(0).label).toBe(sourceLabels[0]);
    chart.element
      .querySelector(".orchid-charts-x-hit")
      .dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
    expect(tooltipFor(chart).querySelector(".orchid-charts-tooltip-heading").textContent).toBe(
      `Region: ${sourceLabels[0]}`,
    );
    chart.destroy();
  });

  it("preserves explicit formatter lines on horizontal category axes", () => {
    const chart = BarChart.make("#chart")
      .horizontal()
      .formatLabel(() => [
        "Партнёрские интеграции",
        "проверка доступности",
        "и локализации",
      ])
      .labels([
        "Партнёрские интеграции с проверкой",
      ])
      .dataset({
        values: [
          61,
        ],
      })
      .render();
    const label = chart.element.querySelector(".orchid-charts-multiline-label");

    expect(
      [
        ...label.querySelectorAll("tspan"),
      ].map((line) => line.textContent),
    ).toEqual([
      "Партнёрские интеграции",
      "проверка доступности",
      "и локализации",
    ]);
    expect(label.getAttribute("aria-label")).toBe("Партнёрские интеграции с проверкой");
  });

  it("balances ordinary long horizontal labels without browser-dependent SVG wrapping", () => {
    const chart = BarChart.make("#chart")
      .horizontal()
      .width(320)
      .labels([
        "Partner integrations with availability and localization review",
      ])
      .dataset({
        values: [
          61,
        ],
      })
      .render();
    const lines = [
      ...chart.element.querySelectorAll(".orchid-charts-multiline-label tspan"),
    ];

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.length).toBeLessThanOrEqual(3);
    expect(lines.every((line) => !line.textContent.includes("…"))).toBe(true);
  });

  it.each([
    null,
    [],
    [
      "Valid",
      1,
    ],
  ])("rejects invalid formatted labels", (formatted) => {
    expect(() =>
      BarChart.make("#chart")
        .horizontal()
        .formatLabel(() => formatted)
        .labels([
          "A",
        ])
        .dataset({
          values: [
            1,
          ],
        })
        .render(),
    ).toThrow("Label formatter");
  });

  it("renders bubbles using point radii", () => {
    const chart = BubbleChart.make("#chart")
      .dataset({
        values: [
          { x: 2, y: 4, r: 9 },
          { x: 3, y: 2, r: 5 },
        ],
      })
      .render();
    const bubbles = chart.element.querySelectorAll(".orchid-charts-bubble.orchid-charts-visual-mark");
    expect(bubbles[0].getAttribute("r")).toBe("9");
    expect(bubbles[1].getAttribute("r")).toBe("5");
    expect(bubbles[0].getAttribute("opacity")).toBe("0.65");
    expect(chart.element.querySelectorAll(".orchid-charts-grid-vertical")).toHaveLength(0);
  });

  it("reserves legend space and renders a stable structured radar tooltip", () => {
    const chart = RadarChart.make("#chart")
      .width(240)
      .height(320)
      .labels([
        "Speed",
        "DX",
        "A11y",
        "Quality",
        "Size",
        "Stability",
      ])
      .dataset({
        name: "Current",
        color: "#007aff",
        values: [
          2,
          0,
          4,
          2,
          3,
          1,
        ],
      })
      .dataset({
        name: "Previous",
        color: "#34c759",
        values: [
          1,
          2,
          3,
          4,
          2,
          3,
        ],
      })
      .dataset({
        name: "Target",
        color: "#af52de",
        values: [
          4,
          4,
          4,
          4,
          4,
          4,
        ],
      })
      .render();
    expect(chart.element.querySelectorAll("line.orchid-charts-grid")).toHaveLength(6);
    expect(chart.element.querySelectorAll(".orchid-charts-radar")).toHaveLength(3);
    expect(chart.element.textContent).toContain("A11y");
    const legendBox = chart.element.querySelector(".orchid-charts-legend-group").getBBox();
    const frameBox = chart.element.querySelector(".orchid-charts-radar-frame").getBBox();
    expect(frameBox.y + frameBox.height).toBeLessThan(legendBox.y);
    const legendLabels = [
      ...chart.element.querySelectorAll(".orchid-charts-legend"),
    ];
    const legendSwatches = [
      ...chart.element.querySelectorAll(".orchid-charts-legend-swatch"),
    ];
    expect(
      legendSwatches.every((swatch) => swatch.tagName === "circle" && swatch.getAttribute("r") === "4"),
    ).toBe(true);
    expect(legendSwatches.every((swatch) => swatch.getAttribute("aria-hidden") === "true")).toBe(true);
    expect(
      legendLabels.map(
        (label) =>
          Number(label.getAttribute("x")) -
          (Number(legendSwatches[legendLabels.indexOf(label)].getAttribute("cx")) - 4),
      ),
    ).toEqual([
      16,
      16,
      16,
    ]);
    expect(new Set(legendLabels.map((label) => label.getAttribute("y")))).toEqual(
      new Set([
        "317",
      ]),
    );
    expect(
      legendSwatches[1].getBBox().x - (legendLabels[0].getBBox().x + legendLabels[0].getBBox().width),
    ).toBeGreaterThanOrEqual(14);

    const polygons = [
      ...chart.element.querySelectorAll(".orchid-charts-radar"),
    ];
    expect(polygons.every((polygon) => polygon.getAttribute("stroke-linejoin") === "round")).toBe(true);
    expect(polygons.every((polygon) => polygon.getAttribute("stroke-linecap") === "round")).toBe(true);
    const axes = chart.element.querySelectorAll(".orchid-charts-radar-axis");
    expect(axes).toHaveLength(6);
    axes[0].focus();
    expect(tooltipFor(chart).querySelector(".orchid-charts-tooltip-heading").textContent).toBe("Speed");
    expect(
      [
        ...tooltipFor(chart).querySelectorAll(".orchid-charts-tooltip-row span"),
      ].map((node) => node.textContent),
    ).toEqual([
      "Current",
      "Previous",
      "Target",
    ]);
    expect(tooltipFor(chart).querySelectorAll(".orchid-charts-tooltip-row")).toHaveLength(3);
    expect(
      [
        ...tooltipFor(chart).querySelectorAll(".orchid-charts-tooltip-row strong"),
      ].map((node) => node.textContent),
    ).toEqual([
      "2",
      "1",
      "4",
    ]);
    axes[1].focus();
    expect(tooltipFor(chart).querySelector(".orchid-charts-tooltip-heading").textContent).toBe("DX");
    expect(tooltipFor(chart).querySelector(".orchid-charts-tooltip-row strong").textContent).toBe("0");
    expect(tooltipFor(chart).getBoundingClientRect().width).toBeLessThanOrEqual(240);
    expect(polygons.every((polygon) => polygon.querySelector(":scope > title") === null)).toBe(true);
  });

  it("renders polar-area slices including a full-circle slice", () => {
    const chart = PolarAreaChart.make("#chart")
      .labels([
        "A",
        "B",
        "C",
        "D",
      ])
      .dataset({
        values: [
          2,
          4,
          2,
          1,
        ],
      })
      .render();
    expect(chart.element.querySelectorAll(".orchid-charts-polar-area")).toHaveLength(4);
    expect(chart.element.textContent).toContain("D");
    const single = PolarAreaChart.make("#chart")
      .labels([
        "Only",
      ])
      .dataset({
        values: [
          1,
        ],
      })
      .render();
    expect(single.element.querySelector("circle.orchid-charts-polar-area")).not.toBeNull();
  });

  it("keeps polar-area labels inside a narrow SVG", () => {
    const chart = PolarAreaChart.make("#chart")
      .width(220)
      .height(280)
      .labels([
        "Social",
        "Entertainment",
        "Productivity",
        "Creativity",
        "Reading",
        "Other",
      ])
      .dataset({
        values: [
          74,
          68,
          52,
          41,
          24,
          18,
        ],
      })
      .render();
    const labels = [
      ...chart.element.querySelectorAll(".orchid-charts-polar-label"),
    ];
    expect(labels).toHaveLength(6);
    for (const label of labels) {
      const bounds = label.getBBox();
      expect(bounds.x).toBeGreaterThanOrEqual(12);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(widthOf(chart) - 12);
    }
    expect(labels.some((label) => label.querySelector("title"))).toBe(true);
  });

  it.each([
    null,
    "#missing",
  ])("rejects invalid parent %s", (parent) => {
    expect(() =>
      LineChart.make(parent)
        .dataset([
          1,
        ])
        .render(),
    ).toThrow("parent");
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
            values: [
              2,
              -1,
              4,
            ],
          })
          .dataset({
            name: "Beta",
            values: [
              1,
              3,
              2,
            ],
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
            values: [
              2,
              -1,
              4,
            ],
          })
          .dataset({
            name: "Beta",
            values: [
              1,
              3,
              2,
            ],
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
            values: [
              2,
              -1,
              4,
            ],
          })
          .dataset({
            name: "Beta",
            values: [
              1,
              3,
              2,
            ],
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
            values: [
              2,
              -1,
              4,
            ],
          })
          .dataset({
            name: "Beta",
            values: [
              1,
              3,
              2,
            ],
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
            values: [
              2,
              -1,
              4,
            ],
          })
          .dataset({
            name: "Beta",
            values: [
              1,
              3,
              2,
            ],
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
            values: [
              2,
              -1,
              4,
            ],
          })
          .dataset({
            name: "Beta",
            values: [
              1,
              3,
              2,
            ],
          })
          .render(),
      "cornerRadius",
    ],
    [
      "timesheet radius/data: radius (case 10)",
      () => TimesheetChart.make("#chart").radius(-1).task({ label: "Task", start: 1, end: 2 }).render(),
      "radius",
    ],
    [
      "line : data (case 11)",
      () => LineChart.make("#chart").render(),
      "dataset",
    ],
    [
      "line data: dataset (case 12)",
      () => LineChart.make("#chart").render(),
      "dataset",
    ],
    [
      "line data: object (case 13)",
      () => LineChart.make("#chart").dataset(null).render(),
      "object",
    ],
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
            values: [
              null,
            ],
          })
          .render(),
      "finite",
    ],
    [
      "line data: finite (case 16)",
      () =>
        LineChart.make("#chart")
          .dataset({
            values: [
              NaN,
            ],
          })
          .render(),
      "finite",
    ],
    [
      "bubble data: finite (case 17)",
      () =>
        BubbleChart.make("#chart")
          .dataset({
            values: [
              { y: 1, x: NaN },
            ],
          })
          .render(),
      "finite",
    ],
    [
      "bubble data: finite (case 18)",
      () =>
        BubbleChart.make("#chart")
          .dataset({
            values: [
              { x: 1, y: NaN, r: 1 },
            ],
          })
          .render(),
      "finite",
    ],
    [
      "bubble data: finite (case 19)",
      () =>
        BubbleChart.make("#chart")
          .dataset({
            values: [
              { x: 1, y: 1, r: NaN },
            ],
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
            values: [
              2,
              -1,
              4,
            ],
          })
          .dataset({
            name: "Beta",
            values: [
              1,
              3,
              2,
            ],
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
            values: [
              2,
              -1,
              4,
            ],
          })
          .dataset({
            name: "Beta",
            values: [
              1,
              3,
              2,
            ],
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
            values: [
              1,
            ],
          })
          .dataset({
            name: "Second",
            values: [
              1,
              2,
            ],
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
            values: [
              2,
              -1,
              4,
            ],
          })
          .dataset({
            name: "Beta",
            values: [
              1,
              3,
              2,
            ],
          })
          .render(),
      "exactly one",
    ],
    [
      "bubble data: negative (case 24)",
      () =>
        BubbleChart.make("#chart")
          .dataset({
            values: [
              { x: 1, y: 1, r: -1 },
            ],
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
            values: [
              1,
            ],
          })
          .render(),
      "labels",
    ],
    [
      "bar horizontal requires boolean",
      () => BarChart.make("#chart").horizontal("diagonal"),
      "horizontal",
    ],
  ])("rejects %s", (_name, build, message) => {
    expect(build).toThrow(message);
  });

  it("keeps the previous state when an update is invalid", () => {
    const chart = LineChart.make("#chart")
      .dataset({
        values: [
          1,
          2,
        ],
      })
      .render();
    expect(() =>
      chart.update({
        labels: "invalid",
        datasets: [
          {
            values: [
              3,
            ],
          },
        ],
      }),
    ).toThrow("labels");
    expect(chart.point(0).values).toEqual([
      1,
    ]);
  });
});
