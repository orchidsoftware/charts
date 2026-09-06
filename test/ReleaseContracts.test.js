import { beforeEach, expect, it, vi } from "vitest";

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
  TimesheetChart,
} from "../src/index.js";
import "../src/styles.css";

beforeEach(() => {
  document.body.innerHTML = '<button id="outside">Outside</button><div id="chart" style="width:600px"></div>';
});

it.each([ScatterChart, BubbleChart])(
  "keeps independent point labels consistent with selection",
  (definition) => {
    const selected = vi.fn();
    const chart = definition
      .make("#chart")
      .dataset([definition === BubbleChart ? { x: 12, y: 38, r: 5 } : { x: 12, y: 38 }])
      .onSelect(selected)
      .render();
    const mark = () => chart.element.querySelector(".orchid-charts-interactive-mark");
    mark().dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(chart.point().label).toBe(12);
    expect(selected.mock.lastCall[0].label).toBe(chart.point().label);
    chart.update({
      labels: ["Observed"],
      datasets: [{ values: [definition === BubbleChart ? { x: 18, y: 51, r: 6 } : { x: 18, y: 51 }] }],
    });
    mark().dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(chart.point().label).toBe("Observed");
    expect(selected.mock.lastCall[0].label).toBe("Observed");
  },
);

it.each([PieChart, DonutChart, PercentageChart, PolarAreaChart])(
  "exposes generated composition labels consistently",
  (definition) => {
    const selected = vi.fn();
    const chart = definition.make("#chart").dataset([1, 2]).onSelect(selected).render();
    chart.element
      .querySelector(".orchid-charts-interactive-mark")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(selected.mock.lastCall[0].label).toBe(1);
    expect(chart.point().label).toBe(1);
  },
);

it("keeps Unix-second heatmap keys inside their UTC calendar days on render and update", () => {
  const first = Date.parse("2026-08-01T12:00:00Z") / 1000;
  const last = Date.parse("2026-08-02T01:00:00Z") / 1000;
  const chart = HeatmapChart.make("#chart")
    .points({ [first]: 2, [last]: 3 })
    .render();
  expect(chart.point(1)).toMatchObject({ key: "2026-08-02", value: 3 });
  expect(chart.point(0).date.toISOString()).toBe("2026-08-01T00:00:00.000Z");
  chart.update({ start: new Date("2026-08-01"), end: new Date("2026-08-02"), points: { [last + 3600]: 4 } });
  expect(chart.point(0).value).toBe(0);
  expect(chart.point(1).value).toBe(4);
});

it("places mixed bars and independent scatter observations on one X scale", () => {
  const chart = MixedChart.make("#chart")
    .bar("Bars", [5, 10, 15, 20])
    .scatter("Events", [
      { x: 0, y: 5 },
      { x: 0.5, y: 8 },
      { x: 1, y: 10 },
      { x: 2, y: 15 },
    ])
    .render();
  const bars = [...chart.element.querySelectorAll(".orchid-charts-bar")].map((node) => node.getBBox());
  const points = [...chart.element.querySelectorAll(".orchid-charts-scatter")].map((node) =>
    Number(node.getAttribute("cx")),
  );
  expect(points[0]).toBeCloseTo(bars[0].x + bars[0].width / 2);
  expect(points[2]).toBeCloseTo(bars[1].x + bars[1].width / 2);
  expect(points[3]).toBeCloseTo(bars[2].x + bars[2].width / 2);
  expect(points[1]).toBeCloseTo((points[0] + points[2]) / 2);
});

it.each([ScatterChart, BubbleChart])(
  "inspects unsorted independent coordinates without category assumptions",
  (definition) => {
    const chart = definition
      .make("#chart")
      .dataset(
        [
          { x: 2, y: 38, r: 5 },
          { x: 0, y: 51, r: 6 },
          { x: 1, y: 63, r: 7 },
        ].map(({ x, y, r }) => (definition === BubbleChart ? { x, y, r } : { x, y })),
      )
      .render();
    const marks = [...chart.element.querySelectorAll(".orchid-charts-interactive-mark")];
    expect(marks).toHaveLength(3);
    for (const [index, mark] of marks.entries()) {
      mark.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
      const tooltip = document.querySelector(".orchid-charts-tooltip");
      expect(tooltip.textContent).not.toContain("undefined");
      expect(mark.getAttribute("aria-label")).toContain(`${chart.point(index).x}:`);
      expect(tooltip.textContent.includes("size")).toBe(definition === BubbleChart);
    }
  },
);

it.each([3, 90])(
  "preserves keyboard focus across data updates and responsive redraws (%i points)",
  async (count) => {
    const labels = Array.from({ length: count }, (_, index) => `Day ${index}`);
    const values = labels.map((_, index) => index + 1);
    const chart = LineChart.make("#chart").labels(labels).dataset("Revenue", values).render();
    chart.element.querySelector("[tabindex='0']").focus();
    document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    chart.update({ labels, datasets: [{ name: "Revenue", values: values.map((value) => value + 1) }] });
    expect(chart.element.contains(document.activeElement)).toBe(true);
    expect(chart.point().label).toBe("Day 1");
    document.querySelector("#chart").style.width = "500px";
    await expect.poll(() => chart.element.viewBox.baseVal.width).toBe(500);
    expect(chart.element.contains(document.activeElement)).toBe(true);
    expect(chart.point().label).toBe("Day 1");
  },
);

it.each([ScatterChart, BubbleChart])(
  "keeps sorted coordinate tooltips exact and respects hidden dots",
  (definition) => {
    const points = [12, 18, 25].map((x) =>
      definition === BubbleChart ? { x, y: x + 1, r: 6 } : { x, y: x + 1 },
    );
    const chart = definition.make("#chart").dataset(points).dots(false).render();
    const mark = chart.element.querySelector(".orchid-charts-interactive-mark");
    mark.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
    expect(document.querySelector(".orchid-charts-tooltip-heading").textContent).toBe("12");
    expect(document.querySelector(".orchid-charts-tooltip").textContent.includes("size")).toBe(
      definition === BubbleChart,
    );
    for (const dot of chart.element.querySelectorAll(".orchid-charts-visual-mark")) {
      expect(getComputedStyle(dot).visibility).toBe("hidden");
    }
  },
);

it("keeps repeated X observations individually inspectable", () => {
  const chart = ScatterChart.make("#chart")
    .dataset([
      { x: 1, y: 2 },
      { x: 1, y: 4 },
    ])
    .render();
  const marks = [...chart.element.querySelectorAll(".orchid-charts-point-hit")];
  expect(marks).toHaveLength(2);
  marks[1].focus();
  expect(chart.point().y).toBe(4);
});

it("describes static composition values", () => {
  const chart = PieChart.make("#chart").labels(["Paid", "Free"]).dataset([12, 18]).tooltip(false).render();
  expect(chart.element.querySelector("desc").textContent).toContain("Paid — Series 1: 12.");
});

it("restores reordered focus, chooses a neighbor on removal, and leaves outside focus alone", () => {
  const chart = BarChart.make("#chart").labels(["A", "B", "C"]).dataset([1, 2, 3]).render();
  chart.element.querySelectorAll(".orchid-charts-interactive-mark")[1].focus();
  chart.update({ labels: ["B", "C", "A"], datasets: [{ values: [4, 5, 6] }] });
  expect(chart.point().label).toBe("B");
  chart.update({ labels: ["C", "A"], datasets: [{ values: [5, 6] }] });
  expect(chart.point().label).toBe("C");
  document.querySelector("#outside").focus();
  chart.update({ labels: ["A"], datasets: [{ values: [8] }] });
  expect(document.activeElement.id).toBe("outside");
});

it("keeps exact values accessible when visual tooltips are disabled", () => {
  const chart = LineChart.make("#chart")
    .labels(["Jan", "Feb", "Mar"])
    .dataset("Revenue", [12, 18, 24])
    .tooltip(false)
    .render();
  expect(chart.element.querySelector("desc").textContent).toContain("Feb — Revenue: 18.");
  expect(chart.element.querySelector("[role='button']")).toBeNull();
  chart.update({ labels: ["Apr"], datasets: [{ name: "Revenue", values: [42] }] });
  expect(chart.element.querySelector("desc").textContent).toContain("Apr — Revenue: 42.");
  expect(chart.element.querySelector("desc").textContent).not.toContain("Feb");
});

it("describes static activity and task data without tooltip interactions", () => {
  const heatmap = HeatmapChart.make("#chart").points({ "2026-01-01": 2 }).tooltip(false).render();
  expect(heatmap.element.querySelector("desc").textContent).toContain("2026-01-01: 2.");
  heatmap.destroy();
  const tasks = TimesheetChart.make("#chart")
    .task("Build", "2026-01-01", "2026-01-02")
    .tooltip(false)
    .render();
  expect(tasks.element.querySelector("desc").textContent).toContain(
    "Build: 2026-01-01T00:00:00.000Z – 2026-01-02T00:00:00.000Z.",
  );
});

it.each([true, false])("clears dense ARIA selection on dismissal (tooltip=%s)", (tooltip) => {
  const chart = LineChart.make("#chart")
    .dataset(Array.from({ length: 90 }, (_, index) => index))
    .onSelect(vi.fn())
    .tooltip(tooltip)
    .render();
  const mark = chart.element.querySelector(".orchid-charts-interactive-mark");
  mark.focus();
  mark.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  expect(mark.getAttribute("aria-pressed")).toBe("true");
  mark.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  expect(mark.getAttribute("aria-pressed")).toBe("false");
  mark.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
  document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  expect(mark.getAttribute("aria-pressed")).toBe("false");
});
