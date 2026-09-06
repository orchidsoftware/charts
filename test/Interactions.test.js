import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  BarChart,
  DonutChart,
  HeatmapChart,
  LineChart,
  PercentageChart,
  PieChart,
  PolarAreaChart,
  RadarChart,
  ScatterChart,
  TimesheetChart,
} from "../src/index.js";

import ChartScenario from "./support/ChartScenario.js";
import "../src/styles.css";

const tooltipFor = (chart) => chart.element.parentElement.querySelector(".orchid-charts-tooltip");

function press(element, key) {
  element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key }));
  element.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key }));
}

beforeEach(() => {
  document.body.innerHTML = '<div id="chart" style="width: 640px"></div>';
});

describe("Interactions", () => {
  it.each([
    { name: "line", ChartType: LineChart },
    { name: "bar", ChartType: BarChart },
    { name: "scatter", ChartType: ScatterChart },
  ])("uses only chart feedback for touch inspection ($name)", ({ ChartType }) => {
    const chart = ChartType.make("#chart")
      .labels(["Direct", "Search"])
      .dataset({
        values: [60, 40],
      })
      .render();
    const mark = chart.element.querySelector(".orchid-charts-interactive-mark");

    // Native tap feedback paints above the SVG and tooltip, then fades to our preview.
    expect(getComputedStyle(mark).webkitTapHighlightColor).toBe("rgba(0, 0, 0, 0)");
    const touch = new PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      pointerType: "touch",
    });
    mark.dispatchEvent(touch);
    expect(touch.defaultPrevented).toBe(false);
    expect(tooltipFor(chart).hidden).toBe(true);

    mark.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerType: "touch" }));
    mark.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "touch" }));
    expect(mark).toHaveClass("is-hovered");
    expect(getComputedStyle(mark).fillOpacity).toBe("0.08");
    expect(tooltipFor(chart).hidden).toBe(false);
    chart.destroy();
  });

  it("uses one tab stop, arrow navigation, persistent active state, and Escape", () => {
    const scenario = new ChartScenario(
      BarChart.make("#chart")
        .horizontal()
        .ariaLabel("Regional response")
        .onSelect(vi.fn())
        .labels(["EU", "US", "APAC"])
        .dataset({
          values: [42, 68, 51],
        })
        .render(),
    );
    const marks = scenario.marks();
    expect(marks).toHaveLength(3);
    expect(marks.filter((mark) => mark.getAttribute("tabindex") === "0")).toHaveLength(1);
    expect(marks[0].getAttribute("aria-label")).toBe("EU — Series 1: 42");

    scenario.mark(0).focus().press("ArrowRight");
    expect(scenario.tooltip().hidden).toBe(false);
    expect(marks[1].getAttribute("tabindex")).toBe("0");
    scenario.mark(1).press("Enter");
    expect(marks[1].getAttribute("aria-pressed")).toBe("true");
    expect(marks[1].classList.contains("is-active")).toBe(true);
    scenario.mark(1).press("Escape");
    expect(scenario.chart().element.querySelector(".is-active")).toBeNull();
    scenario.destroy();
  });

  it("dismisses a pinned tooltip when the person clicks any free area", () => {
    const chart = RadarChart.make("#chart")
      .onSelect(vi.fn())
      .labels(["Speed", "Quality", "Stability"])
      .dataset({
        name: "Current",
        values: [72, 88, 81],
      })
      .dataset({
        name: "Previous",
        values: [64, 84, 76],
      })
      .render();
    const mark = chart.element.querySelector(".orchid-charts-radar-axis");

    mark.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    mark.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(mark.getAttribute("aria-pressed")).toBe("true");
    expect(tooltipFor(chart).hidden).toBe(false);

    chart.element.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    mark.dispatchEvent(new PointerEvent("pointerleave"));
    expect(chart.element.querySelector(".is-active")).toBeNull();
    expect(mark.getAttribute("aria-pressed")).toBe("false");
    expect(tooltipFor(chart).hidden).toBe(true);

    mark.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(chart.element.querySelector(".is-active")).toBeNull();
    expect(tooltipFor(chart).hidden).toBe(true);
    chart.destroy();

    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  });

  it("applies the same model to aggregation charts", () => {
    const scenario = new ChartScenario(
      PieChart.make("#chart")
        .ariaLabel("Acquisition sources")
        .onSelect(vi.fn())
        .labels(["Direct", "Search"])
        .dataset({
          values: [60, 40],
        })
        .render(),
    );
    const marks = scenario.marks();
    expect(scenario.chart().element.getAttribute("role")).toBe("group");
    expect(marks[0].getAttribute("aria-label")).toBe("Direct: 60 (60%)");
    scenario.mark().click();
    expect(marks[0].getAttribute("aria-pressed")).toBe("true");
    scenario.mark().press("ArrowRight");
    expect(marks[1].getAttribute("tabindex")).toBe("0");
    scenario.destroy();
  });

  it("keeps charts read-only unless an onSelect callback opts into selection", () => {
    const chart = LineChart.make("#chart")
      .labels(["A", "B"])
      .dataset({
        values: [1, 2],
      })
      .render();
    const mark = chart.element.querySelector(".orchid-charts-interactive-mark");

    expect(mark.getAttribute("role")).toBe("img");
    expect(mark.hasAttribute("aria-pressed")).toBe(false);
    expect(mark.classList.contains("orchid-charts-selectable-mark")).toBe(false);
    const pointerDown = new PointerEvent("pointerdown", { bubbles: true, cancelable: true });
    mark.dispatchEvent(pointerDown);
    expect(pointerDown.defaultPrevented).toBe(true);
    mark.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    press(mark, "Enter");
    expect(chart.element.querySelector(".is-active")).toBeNull();
    mark.focus();
    expect(tooltipFor(chart).hidden).toBe(false);
    chart.destroy();
  });

  it.each([
    { name: "line", ChartType: LineChart },
    { name: "bar", ChartType: BarChart },
    { name: "pie", ChartType: PieChart },
    { name: "donut", ChartType: DonutChart },
    { name: "radar", ChartType: RadarChart },
    { name: "percentage", ChartType: PercentageChart },
    { name: "polar-area", ChartType: PolarAreaChart },
  ])("keeps a tooltip-only touch preview pinned after the pointer leaves ($name)", ({ ChartType }) => {
    const chart = ChartType.make("#chart")
      .labels(["Direct", "Search"])
      .dataset({
        values: [60, 40],
      })
      .render();
    const [first, second] = chart.element.querySelectorAll(".orchid-charts-interactive-mark");

    first.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }));
    const emulatedMouseMove = new MouseEvent("mousemove", { bubbles: true });
    Object.defineProperty(emulatedMouseMove, "sourceCapabilities", {
      value: { firesTouchEvents: true },
    });
    first.dispatchEvent(emulatedMouseMove);
    first.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
    first.dispatchEvent(new PointerEvent("pointercancel", { pointerType: "touch" }));
    expect(first).not.toHaveClass("is-hovered");
    expect(tooltipFor(chart).hidden).toBe(true);

    first.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }));
    first.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "touch" }));
    first.dispatchEvent(new FocusEvent("blur"));
    first.dispatchEvent(new PointerEvent("pointerup", { pointerType: "touch" }));
    expect(first).toHaveClass("is-hovered");
    expect(tooltipFor(chart).hidden).toBe(false);
    expect(tooltipFor(chart).textContent).toContain("Direct");

    // Compatibility mouse events may omit sourceCapabilities (for example in WebKit).
    chart.element.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
    chart.element.dispatchEvent(new MouseEvent("mouseleave"));
    expect(first).toHaveClass("is-hovered");
    expect(tooltipFor(chart).hidden).toBe(false);

    second.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }));
    second.dispatchEvent(new PointerEvent("pointerup", { pointerType: "touch" }));
    expect(first).not.toHaveClass("is-hovered");
    expect(second).toHaveClass("is-hovered");
    expect(tooltipFor(chart).textContent).toContain("Search");

    chart.element.dispatchEvent(new MouseEvent("mouseleave"));
    expect(second).toHaveClass("is-hovered");
    expect(tooltipFor(chart).hidden).toBe(false);

    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }));
    expect(second).not.toHaveClass("is-hovered");
    expect(tooltipFor(chart).hidden).toBe(true);
    chart.destroy();
  });

  it("balances wrapped tooltip headings without changing their accessible text", () => {
    const heading = "A deliberately long localized category heading for the final measurement";
    const chart = LineChart.make("#chart")
      .labels([heading, "Short"])
      .dataset({
        name: "Observed",
        values: [12, 18],
      })
      .dataset({
        name: "Baseline",
        values: [10, 15],
      })
      .render();
    chart.element.querySelector(".orchid-charts-x-hit").focus();
    const tooltipHeading = tooltipFor(chart).querySelector(".orchid-charts-tooltip-heading");

    expect(tooltipHeading.textContent).toBe(heading);
    expect(getComputedStyle(tooltipHeading).textWrap).toBe("balance");
    expect(tooltipFor(chart).querySelectorAll(".orchid-charts-tooltip-row")).toHaveLength(2);
    chart.destroy();
  });

  it("makes frameless charts inspectable without making every value a tab stop", () => {
    const onSelect = vi.fn();
    const chart = LineChart.make("#chart")
      .axes(false)
      .grid(false)
      .valueLabels(false)
      .legend(false)
      .dots(false)
      .ariaLabel("Revenue trend")
      .onSelect(onSelect)
      .labels(["Value 1", "Value 2", "Value 3"])
      .dataset({
        values: [12, 18, 16],
      })
      .render();
    const marks = [...chart.element.querySelectorAll(".orchid-charts-interactive-mark")];
    expect(marks).toHaveLength(3);
    expect(marks.filter((mark) => mark.getAttribute("tabindex") === "0")).toHaveLength(1);
    marks[0].focus();
    expect(tooltipFor(chart).querySelector(".orchid-charts-tooltip-heading").textContent).toBe("Value 1");
    expect(tooltipFor(chart).querySelector(".orchid-charts-tooltip-row strong").textContent).toBe("12");
    expect(tooltipFor(chart).hidden).toBe(false);
    marks[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(marks[0]).toHaveClass("is-active");
    chart.update({
      labels: ["Value 1", "Value 2", "Value 3"],
      datasets: [
        {
          values: [20, 24, 22],
        },
      ],
    });
    expect(chart.element.querySelector(".is-active")).toBeNull();
    expect(tooltipFor(chart).hidden).toBe(false);
    expect(chart.point().label).toBe("Value 1");
    expect(chart.element.contains(document.activeElement)).toBe(true);
    expect(onSelect).toHaveBeenCalledTimes(1);
    chart.destroy();
  });

  it("removes hover and focus inspection when a tooltip is opted out", () => {
    const chart = LineChart.make("#chart")
      .tooltip(false)
      .labels(["Mon", "Tue"])
      .dataset({
        name: "Revenue",
        values: [12, 18],
      })
      .render();
    const line = chart.element.querySelector(".orchid-charts-line");

    expect(chart.element.querySelector(".orchid-charts-x-hit")).toBeNull();
    expect(chart.element.querySelector(".orchid-charts-interactive-mark")).toBeNull();
    expect(chart.element.querySelector("title")).toBeNull();
    expect(tooltipFor(chart).hidden).toBe(true);
    line.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 40, clientY: 40 }));
    expect(tooltipFor(chart).hidden).toBe(true);
    chart.destroy();
  });

  it("keeps selection without hover preview when tooltip is disabled", () => {
    const onSelect = vi.fn();
    const chart = LineChart.make("#chart")
      .tooltip(false)
      .onSelect(onSelect)
      .labels(["Mon", "Tue"])
      .dataset({
        name: "Revenue",
        values: [12, 18],
      })
      .render();
    const mark = chart.element.querySelector(".orchid-charts-x-hit");

    expect(mark).toHaveClass("orchid-charts-interactive-mark");
    expect(mark).not.toHaveClass("orchid-charts-previewable-mark");
    mark.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    expect(mark).not.toHaveClass("is-hovered");
    mark.focus();
    expect(tooltipFor(chart).hidden).toBe(true);
    mark.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(mark).toHaveClass("is-active");
    expect(onSelect).toHaveBeenCalledOnce();
    chart.destroy();
  });

  it("applies the same model to heatmap cells", () => {
    const chart = HeatmapChart.make("#chart").points({ "2026-01-01": 1, "2026-01-02": 4 }).render();
    const cells = chart.element.querySelectorAll(".orchid-charts-interactive-mark");
    expect(cells).toHaveLength(2);
    expect(cells[0].getAttribute("aria-label")).toBe("2026-01-01: 1");
    cells[0].focus();
    expect(tooltipFor(chart).hidden).toBe(false);
    chart.destroy();
  });

  it("keeps a timesheet tooltip anchored while the whole row handles hover and click", () => {
    const onSelect = vi.fn();
    const chart = TimesheetChart.make("#chart")
      .width(400)
      .height(220)
      .onSelect(onSelect)
      .range("2026-09-01", "2026-09-07")
      .task({ label: "Implementation", start: "2026-09-02", end: "2026-09-04", group: "Engineering" })
      .render();
    const hit = chart.element.querySelector(".orchid-charts-timesheet-hit");
    const bar = chart.element.querySelector(".orchid-charts-timesheet-bar");

    expect(Number(hit.getAttribute("x"))).toBeLessThanOrEqual(Number(bar.getAttribute("x")));
    expect(Number(hit.getAttribute("width"))).toBeGreaterThan(Number(bar.getAttribute("width")));
    hit.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    const hoverPosition = { left: tooltipFor(chart).style.left, top: tooltipFor(chart).style.top };
    hit.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 390, clientY: 200 }));
    expect({ left: tooltipFor(chart).style.left, top: tooltipFor(chart).style.top }).toEqual(hoverPosition);
    hit.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    hit.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect({ left: tooltipFor(chart).style.left, top: tooltipFor(chart).style.top }).toEqual(hoverPosition);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ label: "Implementation", group: "Engineering" }),
    );
    expect(tooltipFor(chart).querySelectorAll(".orchid-charts-tooltip-row")).toHaveLength(1);
    chart.destroy();
  });
});
