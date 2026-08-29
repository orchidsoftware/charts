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

describe("LineChart fluent API", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="chart"><span>existing content</span></div>';
  });

  it("renders the canonical palette, height, and whole-chart gradient path", () => {
    const chart = LineChart.make("#chart")
      .labels(["Jan", "Feb", "Mar"])
      .dataset([42, 48, 57])
      .colors(["#00bdff", "#1b3bff"])
      .height(300)
      .gradient()
      .render();

    expect(chart.element.getAttribute("height")).toBe("300");
    expect(chart.element.querySelector(".charts2-line").getAttribute("stroke")).toBe("#00bdff");
    expect(chart.element.querySelectorAll("linearGradient")).toHaveLength(1);
    expect(chart.point(0)).toEqual({ index: 0, label: "Jan", values: [42] });
  });

  it("does not resolve or mutate the parent before render and copies inputs at each call", () => {
    const labels = ["Jan", "Feb"];
    const values = [10, 20];
    const colors = ["#123456"];
    const builder = LineChart.make("#chart").labels(labels).dataset(values).colors(colors);

    labels.push("Changed");
    values[0] = 999;
    colors[0] = "#ffffff";
    expect(document.querySelector("#chart").textContent).toBe("existing content");

    const chart = builder.render();
    expect(chart.point(0)).toEqual({ index: 0, label: "Jan", values: [10] });
    expect(chart.point(2)).toBeUndefined();
    expect(chart.element.querySelector(".charts2-line").getAttribute("stroke")).toBe("#123456");
  });

  it("consumes a builder only after successful rendering", () => {
    const builder = LineChart.make("#later").dataset([1, 2, 3]);
    expect(() => builder.render()).toThrow("parent");

    const host = document.createElement("div");
    host.id = "later";
    document.body.append(host);
    const chart = builder.render();

    expect(chart.element).toBeInstanceOf(SVGSVGElement);
    expect(() => builder.height(200)).toThrow("already been rendered");
    expect(() => builder.render()).toThrow("already been rendered");
  });

  it("expires local dataset scopes when their callback returns", () => {
    let retained;
    const chart = LineChart.make("#chart")
      .dataset("Revenue", [1, 2], (dataset) => {
        retained = dataset;
        dataset.color("#654321").gradient();
      })
      .render();

    expect(chart.element.querySelector(".charts2-line").getAttribute("stroke")).toBe("#654321");
    expect(() => retained.color("#000000")).toThrow("Dataset scope has expired");
  });

  it("rejects an unnamed dataset before resolving the DOM when more than one series exists", () => {
    const builder = LineChart.make("#missing").dataset([1, 2]).dataset("Plan", [2, 3]);

    expect(() => builder.render()).toThrow("unnamed dataset");
  });

  it("lets explicit presentation choices override frameless regardless of call order", () => {
    const chart = LineChart.make("#chart").dataset([1, 2, 3]).axes(true).dots(true).frameless().render();

    expect(chart.element.querySelectorAll(".charts2-axis").length).toBeGreaterThan(0);
    expect(chart.element.querySelectorAll(".charts2-point")).toHaveLength(3);
    expect(chart.element.querySelector(".charts2-grid-horizontal")).toBeNull();
  });

  it("leaves existing host content untouched when initial rendering fails", () => {
    const builder = LineChart.make("#chart")
      .labels(["Jan", "Feb"])
      .dataset([1, 2])
      .formatLabel(() => {
        throw new Error("format failed");
      });

    expect(() => builder.render()).toThrow("format failed");
    expect(document.querySelector("#chart").children).toHaveLength(1);
    expect(document.querySelector("#chart span").textContent).toBe("existing content");

    const chart = builder.formatLabel(String).render();
    expect(chart.point(0).label).toBe("Jan");
  });

  it("preserves model, SVG, and lifecycle when an update renderer fails", () => {
    const chart = LineChart.make("#chart")
      .labels(["Jan", "Feb"])
      .dataset([1, 2])
      .formatLabel((label) => {
        if (label === "Bad") {
          throw new Error("update format failed");
        }

        return String(label);
      })
      .render();
    const before = chart.toSvg();

    expect(() => chart.update({ labels: ["Bad", "Data"], datasets: [{ values: [9, 10] }] })).toThrow(
      "update format failed",
    );
    expect(chart.toSvg()).toBe(before);
    expect(chart.point(0)).toEqual({ index: 0, label: "Jan", values: [1] });
  });

  it("preserves a unique named selection by identity without notifying user code", () => {
    const onSelect = vi.fn();
    const chart = LineChart.make("#chart")
      .labels(["Jan", "Feb"])
      .dataset("Revenue", [10, 20])
      .onSelect(onSelect)
      .render();

    chart.element
      .querySelector('.charts2-mark[data-point-index="0"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    chart.update({ labels: ["Feb", "Jan"], datasets: [{ name: "Revenue", values: [25, 15] }] });

    expect(chart.element.querySelector(".is-active").dataset.pointIndex).toBe("1");
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("clears selection when update identity is unnamed or duplicated", () => {
    const named = LineChart.make("#chart")
      .labels(["Jan", "Feb"])
      .dataset("Revenue", [10, 20])
      .onSelect(vi.fn())
      .render();

    named.element
      .querySelector('.charts2-mark[data-point-index="0"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    named.update({ labels: ["Jan", "Jan"], datasets: [{ name: "Revenue", values: [12, 18] }] });
    expect(named.element.querySelector(".is-active")).toBeNull();
    named.destroy();

    document.body.innerHTML = '<div id="chart"></div>';
    const unnamed = LineChart.make("#chart").labels(["Jan"]).dataset([10]).onSelect(vi.fn()).render();
    unnamed.element.querySelector(".charts2-mark").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    unnamed.update({ labels: ["Jan"], datasets: [{ values: [12] }] });
    expect(unnamed.element.querySelector(".is-active")).toBeNull();
  });

  it("keeps the detached element inspectable after idempotent destruction", () => {
    const chart = LineChart.make("#chart").dataset([1, 2]).render();
    const element = chart.element;

    chart.destroy();
    chart.destroy();
    expect(chart.element).toBe(element);
    expect(element.isConnected).toBe(false);
    expect(() => chart.point(0)).toThrow("destroyed");
    expect(() => chart.update({ datasets: [{ values: [2, 3] }] })).toThrow("destroyed");
  });
});

describe("named fluent chart definitions", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="chart"></div>';
  });

  it.each([
    ["bar", () => BarChart.make("#chart").labels(["A", "B"]).dataset([1, 2]).horizontal().render()],
    [
      "scatter",
      () =>
        ScatterChart.make("#chart")
          .dataset([{ x: 1, y: 2 }])
          .render(),
    ],
    [
      "mixed",
      () => MixedChart.make("#chart").labels(["A", "B"]).bar("Actual", [1, 2]).line("Plan", [2, 3]).render(),
    ],
    [
      "bubble",
      () =>
        BubbleChart.make("#chart")
          .dataset([{ x: 1, y: 2, r: 4 }])
          .render(),
    ],
    ["pie", () => PieChart.make("#chart").labels(["A", "B"]).dataset([1, 2]).render()],
    ["donut", () => DonutChart.make("#chart").labels(["A", "B"]).dataset([1, 2]).render()],
    ["percentage", () => PercentageChart.make("#chart").labels(["A", "B"]).dataset([1, 2]).render()],
    ["radar", () => RadarChart.make("#chart").labels(["A", "B", "C"]).dataset([1, 2, 3]).render()],
    ["polar-area", () => PolarAreaChart.make("#chart").labels(["A", "B"]).dataset([1, 2]).render()],
    ["heatmap", () => HeatmapChart.make("#chart").points({ "2026-01-01": 2 }).render()],
    ["timesheet", () => TimesheetChart.make("#chart").task("Design", "2026-01-01", "2026-01-02").render()],
  ])("renders the minimum useful %s chain", (_name, render) => {
    const chart = render();

    expect(chart.element).toBeInstanceOf(SVGSVGElement);
    expect(chart.element.querySelector(".charts2-mark")).not.toBeNull();
    chart.destroy();
  });

  it("keeps unsupported family methods out of runtime autocomplete surfaces", () => {
    expect(HeatmapChart.make("#chart").legend).toBeUndefined();
    expect(TimesheetChart.make("#chart").frameless).toBeUndefined();
    expect(RadarChart.make("#chart").gradient).toBeUndefined();
    expect(PercentageChart.make("#chart").startAngle).toBeUndefined();
    expect(MixedChart.make("#chart").horizontal).toBeUndefined();
  });

  it("exports frozen definitions whose only own operation is make", () => {
    for (const definition of [
      LineChart,
      BarChart,
      ScatterChart,
      MixedChart,
      BubbleChart,
      PieChart,
      DonutChart,
      PercentageChart,
      RadarChart,
      PolarAreaChart,
      HeatmapChart,
      TimesheetChart,
    ]) {
      expect(Object.isFrozen(definition)).toBe(true);
      expect(Object.keys(definition)).toEqual(["make"]);
    }
  });

  it("rejects independently invalid fluent arguments immediately", () => {
    const line = LineChart.make("#missing");

    expect(() => line.width(0)).toThrow("width");
    expect(() => line.colors([])).toThrow("colors");
    expect(() => line.labels(["Valid", " "])).toThrow("label");
    expect(() => line.dots("yes")).toThrow("dots");
    expect(() => line.gradient({ fromOpacity: 2 })).toThrow("opacity");
    expect(() => PieChart.make("#missing").maxSlices(1.5)).toThrow("positive integer");
    expect(() => DonutChart.make("#missing").padAngle(360)).toThrow("padAngle");
    expect(() => HeatmapChart.make("#missing").points({})).toThrow("at least one");
  });

  it("rejects a second composition dataset without resolving the parent", () => {
    const pie = PieChart.make("#missing").dataset([1, 2]);

    expect(() => pie.dataset("Extra", [2, 3])).toThrow("exactly one");
  });

  it("applies local line and bar presentation over chart defaults", () => {
    const line = LineChart.make("#chart")
      .labels(["A", "B"])
      .dots(false)
      .strokeWidth(2)
      .dataset("Local", [1, 2], (dataset) => dataset.dots(true).dotSize(7).strokeWidth(5).area())
      .render();

    expect(line.element.querySelector(".charts2-line").getAttribute("stroke-width")).toBe("5");
    expect(line.element.querySelector(".charts2-point").getAttribute("r")).toBe("7");
    expect(line.element.querySelector(".charts2-area")).not.toBeNull();
    expect(line.element.querySelector("linearGradient")).toBeNull();
    line.destroy();

    document.body.innerHTML = '<div id="chart"></div>';
    const bar = BarChart.make("#chart")
      .labels(["A"])
      .radius(1)
      .dataset("Local", [4], (dataset) => dataset.radius(9).opacity(0.4))
      .render();
    expect(bar.element.querySelector(".charts2-bar").getAttribute("opacity")).toBe("0.4");
  });

  it("normalizes maxSlices into point and selection identity data", () => {
    const chart = PieChart.make("#chart")
      .labels(["A", "B", "C", "D"])
      .dataset([1, 5, 2, 4])
      .maxSlices(3)
      .render();

    expect(chart.point(0)).toEqual({ index: 0, label: "B", values: [5] });
    expect(chart.point(1)).toEqual({ index: 1, label: "D", values: [4] });
    expect(chart.point(2)).toEqual({ index: 2, label: "Rest", values: [3] });
    expect(chart.element.querySelectorAll(".charts2-mark")).toHaveLength(3);
  });

  it("uses formatter precedence with a frozen public context", () => {
    const chartFormatter = vi.fn(() => "chart");
    const datasetFormatter = vi.fn((_value, context) => {
      expect(Object.isFrozen(context)).toBe(true);
      expect(Object.isFrozen(context.point)).toBe(true);

      return "dataset";
    });

    const chart = BarChart.make("#chart")
      .labels(["A"])
      .formatValue(chartFormatter)
      .dataset("Revenue", [12], (dataset) => dataset.formatValue(datasetFormatter))
      .render();

    expect(chart.element.querySelector(".charts2-interactive-mark").getAttribute("aria-label")).toContain(
      "dataset",
    );
    expect(datasetFormatter).toHaveBeenCalled();
  });

  it("renders title as safe visible text and accessible-name fallback", () => {
    const chart = LineChart.make("#chart").title("Revenue <strong>").dataset([1, 2]).render();

    expect(chart.element.getAttribute("aria-label")).toBe("Revenue <strong>");
    expect(chart.element.querySelector(".charts2-title").textContent).toBe("Revenue <strong>");
    expect(chart.element.querySelector("strong")).toBeNull();
  });

  it("accepts public heatmap points on update and returns defensive frozen snapshots", () => {
    const chart = HeatmapChart.make("#chart").points({ "2026-01-01": 2 }).render();
    const first = chart.point(0);

    expect(Object.isFrozen(first)).toBe(true);
    first.date.setUTCFullYear(2000);
    expect(chart.point(0).date.getUTCFullYear()).toBe(2026);
    chart.update({ points: { "2026-01-02": 4 } });
    expect(chart.point(0).key).toBe("2026-01-02");
    expect(() => chart.update({ points: { "not-a-date": 1 } })).toThrow("Invalid heatmap date");
  });
});
