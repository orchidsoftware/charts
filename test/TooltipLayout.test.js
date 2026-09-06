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
  ScatterChart,
} from "../src/index.js";

import ChartScenario from "./support/ChartScenario.js";
import "../src/styles.css";

const tooltipFor = (chart) => chart.element.parentElement.querySelector(".orchid-charts-tooltip");

beforeEach(() => {
  document.body.innerHTML = '<div id="chart" style="width: 640px"></div>';
});

describe("TooltipLayout", () => {
  it.each([
    { name: "pie", Definition: PieChart },
    { name: "donut", Definition: DonutChart },
  ])("anchors $name popovers outside their sectors", ({ Definition }) => {
    const chart = Definition.make("#chart")
      .labels(["Direct", "Search", "Partners"])
      .dataset({ values: [1, 1, 1] })
      .render();
    const marks = [...chart.element.querySelectorAll(".orchid-charts-interactive-mark")];
    expect(marks).toHaveLength(3);
    const bottomMark = marks.find((mark) => mark.dataset.tooltipPlacement === "bottom");
    expect(bottomMark).not.toBeUndefined();
    bottomMark.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    expect(tooltipFor(chart).style.transform).toBe("none");
    bottomMark.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
    for (const mark of marks) {
      expect(Number(mark.dataset.tooltipAnchorX)).toBeGreaterThan(0);
      expect(Number(mark.dataset.tooltipAnchorY)).toBeGreaterThan(0);
      expect(["top", "right", "bottom", "left"]).toContain(mark.dataset.tooltipPlacement);
      mark.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
      expect(mark).toHaveClass("is-hovered");
      expect(tooltipFor(chart).hidden).toBe(false);
      expect(tooltipFor(chart).style.left).not.toBe("");
      expect(tooltipFor(chart).style.top).not.toBe("");
      mark.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
    }
  });

  it("anchors percentage popovers on their segments", () => {
    const chart = PercentageChart.make("#chart")
      .labels(["Direct", "Search", "Partners"])
      .dataset({ values: [1, 1, 1] })
      .render();
    const marks = [...chart.element.querySelectorAll(".orchid-charts-interactive-mark")];
    expect(marks).toHaveLength(3);
    for (const mark of marks) {
      expect(mark.dataset.tooltipAnchorX).toBeUndefined();
      expect(mark.dataset.tooltipAnchorY).toBeUndefined();
      expect(mark.dataset.tooltipPlacement).toBeUndefined();
      mark.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
      expect(mark).toHaveClass("is-hovered");
      expect(tooltipFor(chart).hidden).toBe(false);
      expect(tooltipFor(chart).style.left).not.toBe("");
      expect(tooltipFor(chart).style.top).not.toBe("");
      mark.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
    }
  });

  it("anchors a complete pie above its circle", () => {
    const whole = PieChart.make("#chart")
      .labels(["Complete"])
      .dataset({
        values: [100],
      })
      .render();
    const topMark = whole.element.querySelector(".orchid-charts-interactive-mark");

    expect(topMark.dataset.tooltipPlacement).toBe("top");
    topMark.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    expect(tooltipFor(whole).style.transform).toBe("none");
    whole.destroy();
  });

  it("uses highlighted shared areas for easy scatter and bubble hover", () => {
    for (const [type, Definition] of [
      ["scatter", ScatterChart],
      ["bubble", BubbleChart],
    ]) {
      const values = type === "bubble" ? [1, 2, 3, 4].map((x) => ({ x, y: x + 1, r: 5 })) : [2, 3, 4, 5];
      const chart = Definition.make("#chart").labels(["A", "B", "C", "D"]).dataset({ values }).render();
      const hits = [...chart.element.querySelectorAll(".orchid-charts-x-hit")];
      const visibleMarks = [...chart.element.querySelectorAll(".orchid-charts-visual-mark")];
      const widths = hits.map((hit) => Number(hit.getAttribute("width")));

      expect(hits).toHaveLength(visibleMarks.length);
      expect(chart.element.querySelector(".orchid-charts-point-hit")).toBeNull();
      expect(widths[0]).toBeCloseTo(widths[1], 8);
      expect(widths.at(-1)).toBeCloseTo(widths.at(-2), 8);
      expect(Number(visibleMarks[0].getAttribute("cx"))).toBeGreaterThan(Number(hits[0].getAttribute("x")));
      for (const hit of hits) {
        hit.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
        expect(hit).toHaveClass("is-hovered");
        expect(JSON.parse(hit.dataset.tooltipItems)).toHaveLength(1);
        expect(tooltipFor(chart).hidden).toBe(false);
        hit.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
      }
      chart.destroy();
    }

    const line = LineChart.make("#chart")
      .labels(["A", "B", "C", "D"])
      .dataset({
        values: [2, 3, 4, 5],
      })
      .render();
    const lineWidths = [...line.element.querySelectorAll(".orchid-charts-x-hit")].map((hit) =>
      Number(hit.getAttribute("width")),
    );

    expect(lineWidths[0] * 2).toBeCloseTo(lineWidths[1], 8);
    expect(lineWidths.at(-1) * 2).toBeCloseTo(lineWidths.at(-2), 8);
    line.destroy();
  });

  it("keeps aligned mixed hover shared while selection remains point-specific", () => {
    const data = {
      labels: ["W1", "W2"],
      datasets: [
        {
          name: "Actual",
          chartType: "bar",
          values: [2, 3],
        },
        {
          name: "Plan",
          chartType: "line",
          values: [3, 4],
        },
      ],
    };
    const hoverChart = MixedChart.make("#chart")
      .labels(data.labels)
      .dataset({
        name: "Actual",
        chartType: "bar",
        values: [2, 3],
      })
      .dataset({
        name: "Plan",
        chartType: "line",
        values: [3, 4],
      })
      .render();
    const category = hoverChart.element.querySelector(".orchid-charts-x-hit");

    expect(hoverChart.element.querySelectorAll(".orchid-charts-interactive-mark")).toHaveLength(2);
    category.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    expect(tooltipFor(hoverChart).querySelectorAll(".orchid-charts-tooltip-row")).toHaveLength(2);
    expect(tooltipFor(hoverChart).textContent).toContain("Actual");
    expect(tooltipFor(hoverChart).textContent).toContain("Plan");
    hoverChart.destroy();

    const selectable = MixedChart.make("#chart")
      .onSelect(vi.fn())
      .labels(data.labels)
      .dataset({
        name: "Actual",
        chartType: "bar",
        values: [2, 3],
      })
      .dataset({
        name: "Plan",
        chartType: "line",
        values: [3, 4],
      })
      .render();
    expect(selectable.element.querySelector(".orchid-charts-x-hit")).toBeNull();
    expect(selectable.element.querySelectorAll(".orchid-charts-interactive-mark")).toHaveLength(4);
    selectable.destroy();
  });

  it.each(["left", "right"])("aligns shared mixed categories with the y-axis on the %s", (yAxisPosition) => {
    const labels = ["Mon", "Tue", "Wed", "Thu"];
    const chart = MixedChart.make("#chart")
      .yAxis((axis) => axis.position(yAxisPosition))
      .labels(labels)
      .dataset({
        name: "Daily change",
        chartType: "bar",
        values: [-8, 4, -3, 9],
      })
      .dataset({
        name: "Rolling trend",
        chartType: "line",
        values: [-4, -2, 2, 5],
      })
      .dataset({
        name: "Alert threshold",
        chartType: "line",
        values: [3, 3, 3, 3],
      })
      .render();
    const categories = [...chart.element.querySelectorAll(".orchid-charts-x-hit")];
    const categoryLabels = [...chart.element.querySelectorAll(".orchid-charts-label")].slice(-labels.length);

    expect(categories).toHaveLength(labels.length);
    expect(categoryLabels.map((label) => label.textContent)).toEqual(labels);
    for (const [index, category] of categories.entries()) {
      expect(Number(categoryLabels[index].getAttribute("x"))).toBeCloseTo(
        Number(category.getAttribute("x")) + Number(category.getAttribute("width")) / 2,
        8,
      );
      category.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
      expect(tooltipFor(chart).querySelector(".orchid-charts-tooltip-heading").textContent).toBe(
        labels[index],
      );
      expect(tooltipFor(chart).querySelectorAll(".orchid-charts-tooltip-row")).toHaveLength(3);
      category.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
    }
    chart.destroy();
  });

  it("keeps tooltip width stable at the first and last chart positions", () => {
    const percentage = PercentageChart.make("#chart")
      .labels(["Same", "Same", "Same"])
      .dataset({
        values: [10, 10, 10],
      })
      .render();
    const percentageMarks = percentage.element.querySelectorAll(".orchid-charts-interactive-mark");
    percentageMarks[0].focus();
    const firstPercentageWidth = tooltipFor(percentage).getBoundingClientRect().width;
    percentageMarks[2].focus();
    expect(tooltipFor(percentage).getBoundingClientRect().width).toBe(firstPercentageWidth);
    percentage.destroy();

    const fractions = LineChart.make("#chart")
      .labels(["Same measurement", "Same measurement", "Same measurement"])
      .dataset({
        name: "Sensor A — fractional precision",
        values: [0.00012, 0.00012, 0.00012],
      })
      .dataset({
        name: "Sensor B — comparison",
        values: [0.00009, 0.00009, 0.00009],
      })
      .render();
    const fractionMarks = fractions.element.querySelectorAll(".orchid-charts-x-hit");
    fractionMarks[0].focus();
    const firstFractionWidth = tooltipFor(fractions).getBoundingClientRect().width;
    fractionMarks[2].focus();
    expect(tooltipFor(fractions).getBoundingClientRect().width).toBe(firstFractionWidth);
    expect(firstFractionWidth).toBeGreaterThan(200);
    fractions.destroy();
  });

  it("keeps the same tooltip anchor from hover through click selection", () => {
    const onSelect = vi.fn();
    const scenario = new ChartScenario(
      PercentageChart.make("#chart")
        .onSelect(onSelect)
        .labels(["Photos", "Apps", "Free"])
        .dataset({
          values: [72, 58, 64],
        })
        .render(),
    );
    const mark = scenario.mark();

    mark.hover({ x: 520, y: 120 });
    const hoverPosition = { left: scenario.tooltip().style.left, top: scenario.tooltip().style.top };

    mark.click();

    expect({ left: scenario.tooltip().style.left, top: scenario.tooltip().style.top }).toEqual(hoverPosition);
    expect(mark.element()).toHaveClass("is-active");
    expect(onSelect).toHaveBeenCalledOnce();
    scenario.destroy();
  });

  it.each([
    {
      build: () =>
        PercentageChart.make("#chart")
          .tooltip((tooltip) => tooltip.formatValue((value) => `${value} GB`))
          .labels(["Photos", "Free"])
          .dataset({
            values: [72, 28],
          })
          .render(),
      heading: "Photos",
      value: "72 GB (72%)",
    },
    {
      build: () =>
        PieChart.make("#chart")
          .labels(["Search", "Direct"])
          .dataset({
            values: [60, 40],
          })
          .render(),
      heading: "Search",
      value: "60 (60%)",
    },
    {
      build: () =>
        DonutChart.make("#chart")
          .labels(["Individual", "Family"])
          .dataset({
            values: [70, 30],
          })
          .render(),
      heading: "Individual",
      value: "70 (70%)",
    },
    {
      build: () =>
        PolarAreaChart.make("#chart")
          .labels(["Social", "Reading"])
          .dataset({
            values: [74, 26],
          })
          .render(),
      heading: "Social",
      value: "74",
    },
    {
      build: () => HeatmapChart.make("#chart").countLabel("events").points({ "2026-01-01": 4 }).render(),
      heading: "2026-01-01",
      value: "4 events",
    },
  ])("uses a single-row typography hierarchy for $heading", ({ build, heading, value }) => {
    const chart = build();
    chart.element.querySelector(".orchid-charts-interactive-mark").focus();
    const tooltipHeading = tooltipFor(chart).querySelector(".orchid-charts-tooltip-heading");
    const row = tooltipFor(chart).querySelector(".orchid-charts-tooltip-row");
    expect(tooltipHeading).toBeNull();
    expect(row.querySelector("span").textContent).toBe(heading);
    expect(row.querySelector("strong").textContent).toBe(value);
    expect(getComputedStyle(row.querySelector("span")).fontWeight).toBe("500");
    expect(getComputedStyle(row.querySelector("strong")).fontWeight).toBe("600");
    expect([...tooltipFor(chart).childNodes].every((node) => node.nodeType === Node.ELEMENT_NODE)).toBe(true);
    chart.destroy();
  });

  it("uses a heading and series rows for Cartesian typography", () => {
    const cartesian = BarChart.make("#chart")
      .horizontal()
      .labels(["Europe"])
      .dataset({
        name: "Standard",
        values: [36],
      })
      .dataset({
        name: "Express",
        values: [16],
      })
      .render();
    cartesian.element.querySelector(".orchid-charts-x-hit").focus();
    expect(tooltipFor(cartesian).querySelector(".orchid-charts-tooltip-heading").textContent).toBe("Europe");
    expect(
      [...tooltipFor(cartesian).querySelectorAll(".orchid-charts-tooltip-row span")].map(
        (node) => node.textContent,
      ),
    ).toEqual(["Standard", "Express"]);
    expect(
      [...tooltipFor(cartesian).querySelectorAll(".orchid-charts-tooltip-row strong")].map(
        (node) => node.textContent,
      ),
    ).toEqual(["36", "16"]);

    expect(tooltipFor(cartesian).querySelector("i").style.background).toBe("rgb(0, 122, 255)");
  });
});
