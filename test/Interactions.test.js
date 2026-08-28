import { beforeEach, describe, expect, it, vi } from "vitest";

import InteractionController from "../src/core/InteractionController.js";
import { createChart } from "../src/index.js";

import ChartScenario from "./support/ChartScenario.js";

const tooltipFor = (chart) => chart.element.parentElement.querySelector(".charts2-tooltip");

function press(element, key) {
  element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key }));
  element.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key }));
}

beforeEach(() => {
  document.body.innerHTML = '<div id="chart" style="width: 640px"></div>';
});

describe("shared chart interaction contract", () => {
  it("uses one tab stop, arrow navigation, persistent active state, and Escape", () => {
    const scenario = ChartScenario.mount({
      type: "bar",
      orientation: "horizontal",
      ariaLabel: "Regional response",
      onSelect: vi.fn(),
      data: { labels: ["EU", "US", "APAC"], datasets: [{ values: [42, 68, 51] }] },
    });
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
    const chart = createChart("#chart", {
      type: "radar",
      onSelect: vi.fn(),
      data: {
        labels: ["Speed", "Quality", "Stability"],
        datasets: [
          { name: "Current", values: [72, 88, 81] },
          { name: "Previous", values: [64, 84, 76] },
        ],
      },
    });
    const mark = chart.element.querySelector(".charts2-radar");

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
    const scenario = ChartScenario.mount({
      type: "pie",
      ariaLabel: "Acquisition sources",
      onSelect: vi.fn(),
      data: { labels: ["Direct", "Search"], datasets: [{ values: [60, 40] }] },
    });
    const marks = scenario.marks();
    expect(scenario.chart().element.getAttribute("role")).toBe("group");
    expect(marks[0].getAttribute("aria-label")).toBe("Direct: 60 (60%)");
    scenario.mark().click();
    expect(marks[0].getAttribute("aria-pressed")).toBe("true");
    scenario.mark().press("ArrowRight");
    expect(marks[1].getAttribute("tabindex")).toBe("0");
    scenario.destroy();
  });

  it("keeps tooltip width stable at the first and last chart positions", () => {
    const percentage = createChart("#chart", {
      type: "percentage",
      data: { labels: ["Same", "Same", "Same"], datasets: [{ values: [10, 10, 10] }] },
    });
    const percentageMarks = percentage.element.querySelectorAll(".charts2-interactive-mark");
    percentageMarks[0].focus();
    const firstPercentageWidth = tooltipFor(percentage).getBoundingClientRect().width;
    percentageMarks[2].focus();
    expect(tooltipFor(percentage).getBoundingClientRect().width).toBe(firstPercentageWidth);
    percentage.destroy();

    const fractions = createChart("#chart", {
      type: "line",
      data: {
        labels: ["Same measurement", "Same measurement", "Same measurement"],
        datasets: [
          { name: "Sensor A — fractional precision", values: [0.00012, 0.00012, 0.00012] },
          { name: "Sensor B — comparison", values: [0.00009, 0.00009, 0.00009] },
        ],
      },
    });
    const fractionMarks = fractions.element.querySelectorAll(".charts2-x-hit");
    fractionMarks[0].focus();
    const firstFractionWidth = tooltipFor(fractions).getBoundingClientRect().width;
    fractionMarks[2].focus();
    expect(tooltipFor(fractions).getBoundingClientRect().width).toBe(firstFractionWidth);
    expect(firstFractionWidth).toBeGreaterThan(200);
    fractions.destroy();
  });

  it("keeps the same tooltip anchor from hover through click selection", () => {
    const onSelect = vi.fn();
    const scenario = ChartScenario.mount({
      type: "percentage",
      onSelect,
      data: { labels: ["Photos", "Apps", "Free"], datasets: [{ values: [72, 58, 64] }] },
    });
    const mark = scenario.mark();

    mark.hover({ x: 520, y: 120 });
    const hoverPosition = { left: scenario.tooltip().style.left, top: scenario.tooltip().style.top };

    mark.click();

    expect({ left: scenario.tooltip().style.left, top: scenario.tooltip().style.top }).toEqual(hoverPosition);
    expect(mark.element()).toHaveClass("is-active");
    expect(onSelect).toHaveBeenCalledOnce();
    scenario.destroy();
  });

  it("uses one tooltip typography hierarchy across chart families", () => {
    const cases = [
      {
        options: {
          type: "percentage",
          tooltipOptions: { formatTooltipY: (value) => `${value} GB` },
          data: { labels: ["Photos", "Free"], datasets: [{ values: [72, 28] }] },
        },
        heading: "Photos",
        value: "72 GB (72%)",
      },
      {
        options: { type: "pie", data: { labels: ["Search", "Direct"], datasets: [{ values: [60, 40] }] } },
        heading: "Search",
        value: "60 (60%)",
      },
      {
        options: { type: "donut", data: { labels: ["Individual", "Family"], datasets: [{ values: [70, 30] }] } },
        heading: "Individual",
        value: "70 (70%)",
      },
      {
        options: { type: "polar-area", data: { labels: ["Social", "Reading"], datasets: [{ values: [74, 26] }] } },
        heading: "Social",
        value: "74",
      },
      {
        options: { type: "heatmap", countLabel: "events", data: { dataPoints: { "2026-01-01": 4 } } },
        heading: "2026-01-01",
        value: "4 events",
      },
    ];

    for (const { options, heading, value } of cases) {
      const chart = createChart("#chart", options);
      chart.element.querySelector(".charts2-interactive-mark").focus();
      const tooltipHeading = tooltipFor(chart).querySelector(".charts2-tooltip-heading");
      const row = tooltipFor(chart).querySelector(".charts2-tooltip-row");
      expect(tooltipHeading).toBeNull();
      expect(row.querySelector("span").textContent).toBe(heading);
      expect(row.querySelector("strong").textContent).toBe(value);
      expect(getComputedStyle(row.querySelector("span")).fontWeight).toBe("500");
      expect(getComputedStyle(row.querySelector("strong")).fontWeight).toBe("600");
      expect([...tooltipFor(chart).childNodes].every((node) => node.nodeType === Node.ELEMENT_NODE)).toBe(true);
      chart.destroy();
    }

    const cartesian = createChart("#chart", {
      type: "bar",
      orientation: "horizontal",
      data: {
        labels: ["Europe"],
        datasets: [
          { name: "Standard", values: [36] },
          { name: "Express", values: [16] },
        ],
      },
    });
    cartesian.element.querySelector(".charts2-x-hit").focus();
    expect(tooltipFor(cartesian).querySelector(".charts2-tooltip-heading").textContent).toBe("Europe");
    expect(
      [...tooltipFor(cartesian).querySelectorAll(".charts2-tooltip-row span")].map((node) => node.textContent),
    ).toEqual(["Standard", "Express"]);
    expect(
      [...tooltipFor(cartesian).querySelectorAll(".charts2-tooltip-row strong")].map((node) => node.textContent),
    ).toEqual(["36", "16"]);

    expect(tooltipFor(cartesian).querySelector("i").style.background).toBe("rgb(0, 122, 255)");
  });

  it("keeps charts read-only unless an onSelect callback opts into selection", () => {
    const chart = createChart("#chart", {
      type: "line",
      data: { labels: ["A", "B"], datasets: [{ values: [1, 2] }] },
    });
    const mark = chart.element.querySelector(".charts2-interactive-mark");

    expect(mark.getAttribute("role")).toBe("img");
    expect(mark.hasAttribute("aria-pressed")).toBe(false);
    expect(mark.classList.contains("charts2-selectable-mark")).toBe(false);
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

  it("balances wrapped tooltip headings without changing their accessible text", () => {
    const heading = "A deliberately long localized category heading for the final measurement";
    const chart = createChart("#chart", {
      type: "line",
      data: {
        labels: [heading, "Short"],
        datasets: [
          { name: "Observed", values: [12, 18] },
          { name: "Baseline", values: [10, 15] },
        ],
      },
    });
    chart.element.querySelector(".charts2-x-hit").focus();
    const tooltipHeading = tooltipFor(chart).querySelector(".charts2-tooltip-heading");

    expect(tooltipHeading.textContent).toBe(heading);
    expect(getComputedStyle(tooltipHeading).textWrap).toBe("balance");
    expect(tooltipFor(chart).querySelectorAll(".charts2-tooltip-row")).toHaveLength(2);
    chart.destroy();
  });

  it("makes frameless charts inspectable without making every value a tab stop", () => {
    const chart = createChart("#chart", {
      type: "line",
      showAxes: false,
      showGrid: false,
      showLabels: false,
      showLegend: false,
      showDots: false,
      data: { labels: ["Value 1", "Value 2", "Value 3"], datasets: [{ values: [12, 18, 16] }] },
      ariaLabel: "Revenue trend",
      onSelect: vi.fn(),
    });
    const marks = [...chart.element.querySelectorAll(".charts2-interactive-mark")];
    expect(marks).toHaveLength(3);
    expect(marks.filter((mark) => mark.getAttribute("tabindex") === "0")).toHaveLength(1);
    marks[0].focus();
    expect(tooltipFor(chart).querySelector(".charts2-tooltip-heading").textContent).toBe("Value 1");
    expect(tooltipFor(chart).querySelector(".charts2-tooltip-row strong").textContent).toBe("12");
    expect(tooltipFor(chart).hidden).toBe(false);
    marks[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(marks[0]).toHaveClass("is-active");
    chart.update({ labels: ["Value 1", "Value 2", "Value 3"], datasets: [{ values: [20, 24, 22] }] });
    expect(tooltipFor(chart).querySelector(".charts2-tooltip-row strong").textContent).toBe("20");
    chart.destroy();
  });

  it("removes hover and focus inspection when a tooltip is opted out", () => {
    const chart = createChart("#chart", {
      type: "line",
      showTooltip: false,
      data: { labels: ["Mon", "Tue"], datasets: [{ name: "Revenue", values: [12, 18] }] },
    });
    const line = chart.element.querySelector(".charts2-line");

    expect(chart.element.querySelector(".charts2-x-hit")).toBeNull();
    expect(chart.element.querySelector(".charts2-interactive-mark")).toBeNull();
    expect(chart.element.querySelector("title")).toBeNull();
    expect(tooltipFor(chart).hidden).toBe(true);
    line.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 40, clientY: 40 }));
    expect(tooltipFor(chart).hidden).toBe(true);
    chart.destroy();
  });

  it("keeps selection without hover preview when tooltip is disabled", () => {
    const onSelect = vi.fn();
    const chart = createChart("#chart", {
      type: "line",
      showTooltip: false,
      onSelect,
      data: { labels: ["Mon", "Tue"], datasets: [{ name: "Revenue", values: [12, 18] }] },
    });
    const mark = chart.element.querySelector(".charts2-x-hit");

    expect(mark).toHaveClass("charts2-interactive-mark");
    expect(mark).not.toHaveClass("charts2-previewable-mark");
    mark.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    expect(mark).not.toHaveClass("is-hovered");
    mark.focus();
    expect(tooltipFor(chart).hidden).toBe(true);
    mark.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(mark).toHaveClass("is-active");
    expect(onSelect).toHaveBeenCalledOnce();
    chart.destroy();
  });

  it("covers the complete pointer and keyboard state machine", async () => {
    const namespace = "http://www.w3.org/2000/svg";
    const marks = [0, 1, 2].map(() => document.createElementNS(namespace, "rect"));
    const shown = [];
    const hidden = [];
    const active = [];
    const callbacks = {
      labelFor: (_mark, index) => `Mark ${index + 1}`,
      onShow: (_mark, label) => {
        shown.push(label);
      },
      onHide: () => {
        hidden.push(true);
      },
      onActiveChange: (index) => {
        active.push(index);
      },
    };
    const setup = (activeIndex) => new InteractionController(marks, { activeIndex }, callbacks);

    const controller = setup(1);
    expect(marks[1].getAttribute("tabindex")).toBe("0");
    expect(marks[1].getAttribute("aria-pressed")).toBe("true");
    marks[1].dispatchEvent(new PointerEvent("pointerenter"));
    marks[1].dispatchEvent(new PointerEvent("pointerdown"));
    expect(marks[1].classList.contains("is-pressed")).toBe(true);
    marks[1].dispatchEvent(new PointerEvent("pointerup"));
    marks[1].dispatchEvent(new PointerEvent("pointercancel"));
    marks[1].dispatchEvent(new PointerEvent("pointerleave"));
    marks[1].focus();
    marks[1].blur();
    expect(shown).toContain("Mark 2");
    expect(hidden).toHaveLength(0);

    press(marks[1], "ArrowLeft");
    expect(marks[0].getAttribute("tabindex")).toBe("0");
    press(marks[0], "ArrowUp");
    expect(marks[2].getAttribute("tabindex")).toBe("0");
    press(marks[2], "Home");
    expect(marks[0].getAttribute("tabindex")).toBe("0");
    press(marks[0], "End");
    expect(marks[2].getAttribute("tabindex")).toBe("0");
    press(marks[2], " ");
    expect(active.at(-1)).toBe(2);
    marks[2].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(active.at(-1)).toBe(2);
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    press(marks[2], "Escape");
    expect(active.at(-1)).toBe(-1);
    expect(hidden.length).toBeGreaterThan(0);
    press(marks[2], "Escape");
    press(marks[2], "PageDown");

    controller.dismiss();
    expect(hidden.length).toBeGreaterThan(0);

    setup(99);
    expect(marks[0].getAttribute("tabindex")).toBe("0");
    const emptyCallbacks = {
      labelFor: () => "",
      onShow: () => {},
      onHide: () => {},
      onActiveChange: () => {},
    };
    const emptyController = new InteractionController([], {}, emptyCallbacks);
    emptyController.dismiss();
  });

  it("applies the same model to heatmap cells", () => {
    const chart = createChart("#chart", {
      type: "heatmap",
      data: { dataPoints: { "2026-01-01": 1, "2026-01-02": 4 } },
    });
    const cells = chart.element.querySelectorAll(".charts2-interactive-mark");
    expect(cells).toHaveLength(2);
    expect(cells[0].getAttribute("aria-label")).toBe("2026-01-01: 1");
    cells[0].focus();
    expect(tooltipFor(chart).hidden).toBe(false);
    chart.destroy();
  });

  it("keeps a timesheet tooltip anchored while the whole row handles hover and click", () => {
    const onSelect = vi.fn();
    const chart = createChart("#chart", {
      type: "timesheet",
      width: 400,
      height: 220,
      onSelect,
      data: {
        start: "2026-09-01",
        end: "2026-09-07",
        tasks: [{ label: "Implementation", start: "2026-09-02", end: "2026-09-04", group: "Engineering" }],
      },
    });
    const hit = chart.element.querySelector(".charts2-timesheet-hit");
    const bar = chart.element.querySelector(".charts2-timesheet-bar");

    expect(Number(hit.getAttribute("x"))).toBeLessThanOrEqual(Number(bar.getAttribute("x")));
    expect(Number(hit.getAttribute("width"))).toBeGreaterThan(Number(bar.getAttribute("width")));
    hit.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    const hoverPosition = { left: tooltipFor(chart).style.left, top: tooltipFor(chart).style.top };
    hit.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 390, clientY: 200 }));
    expect({ left: tooltipFor(chart).style.left, top: tooltipFor(chart).style.top }).toEqual(hoverPosition);
    hit.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    hit.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect({ left: tooltipFor(chart).style.left, top: tooltipFor(chart).style.top }).toEqual(hoverPosition);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ label: "Implementation", group: "Engineering" }));
    expect(tooltipFor(chart).querySelectorAll(".charts2-tooltip-row")).toHaveLength(1);
    chart.destroy();
  });
});
