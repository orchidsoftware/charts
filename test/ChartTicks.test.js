import { beforeEach, describe, expect, it } from "vitest";

import { BarChart, LineChart } from "../src/index.js";
import "../src/styles.css";

const tickText = (chart) =>
  [...chart.element.querySelectorAll(".orchid-charts-value-label")].map((label) => label.textContent);

describe("ChartTicks", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="chart"><span>old</span></div>';
  });
  it("aligns descending integer tick labels with horizontal grid lines", () => {
    const integer = LineChart.make("#chart")
      .dataset({
        values: [1, 2, 3, 5],
      })
      .render();
    expect(tickText(integer)).toEqual(["5", "4", "3", "2", "1", "0"]);
    expect(integer.element.querySelectorAll(".orchid-charts-grid-horizontal")).toHaveLength(6);
    const integerLabels = [...integer.element.querySelectorAll(".orchid-charts-value-label")];
    for (const [index, label] of integerLabels.entries()) {
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
  });

  it("keeps small integer ticks whole and ordered", () => {
    const small = BarChart.make("#chart")
      .dataset({
        values: [1, 2],
      })
      .render();
    expect(tickText(small)).toEqual(["2", "1", "0"]);
    const smallLabels = [...small.element.querySelectorAll(".orchid-charts-value-label")];
    expect(Number(smallLabels[0].getAttribute("y"))).toBeLessThan(
      Number(smallLabels.at(-1).getAttribute("y")),
    );
    small.destroy();
  });

  it("aligns signed horizontal ticks with vertical grid lines", () => {
    const negative = BarChart.make("#chart")
      .horizontal()
      .dataset({
        values: [-3, 4],
      })
      .render();
    expect(tickText(negative)).toEqual(["-4", "-2", "0", "2", "4"]);
    expect(negative.element.querySelectorAll(".orchid-charts-grid-vertical")).toHaveLength(5);
    for (const [index, label] of [
      ...negative.element.querySelectorAll(".orchid-charts-value-label"),
    ].entries()) {
      expect(Number(label.getAttribute("x"))).toBeCloseTo(
        Number(negative.element.querySelectorAll(".orchid-charts-grid-vertical")[index].getAttribute("x1")),
        8,
      );
    }
    negative.destroy();
  });

  it("formats million-scale ticks without losing the zero baseline", () => {
    const millions = LineChart.make("#chart")
      .dataset({
        values: [6_450_000, 12_750_000],
      })
      .render();
    expect(tickText(millions)).toEqual(["15M", "10M", "5M", "0"]);
    millions.destroy();
  });

  it("reserves sufficient plot margin for small fractional tick labels", () => {
    const fractions = LineChart.make("#chart")
      .dataset({
        values: [0.00009, 0.00021],
      })
      .render();
    expect(tickText(fractions)).toEqual(["0.00025", "0.0002", "0.00015", "0.0001", "0.00005", "0"]);
    const fractionLabels = [...fractions.element.querySelectorAll(".orchid-charts-value-label")];
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
  });

  it("uses a nice ten-unit tick interval", () => {
    const tens = LineChart.make("#chart")
      .dataset({
        values: [8, 32],
      })
      .render();
    expect(tickText(tens)).toEqual(["40", "30", "20", "10", "0"]);
    tens.destroy();
  });

  it("centers an all-zero range between negative and positive ticks", () => {
    const zero = LineChart.make("#chart")
      .dataset({
        values: [0, 0],
      })
      .render();
    expect(tickText(zero)).toEqual(["1", "0", "-1"]);
    zero.destroy();
  });

  it("retains a grid for equal fractions when axes are hidden", () => {
    const equalFractions = LineChart.make("#chart")
      .axes(false)
      .grid(true)
      .valueLabels(false)
      .dataset({
        values: [0.25, 0.25],
      })
      .render();
    expect(equalFractions.element.querySelector(".orchid-charts-axis")).toBeNull();
    expect(equalFractions.element.querySelector(".orchid-charts-grid-horizontal")).not.toBeNull();
    equalFractions.destroy();
  });
});
