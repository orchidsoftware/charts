import { beforeEach, describe, expect, it, vi } from "vitest";

import { BarChart, LineChart, MixedChart } from "../src/index.js";
import "../src/styles.css";

const values = Array.from({ length: 90 }, (_, index) => 20 + (index % 50));
const labels = values.map((_, index) => `Day ${index + 1}`);

function pointer(mark, fraction, type = "pointermove", pointerType = "mouse") {
  const box = mark.getBoundingClientRect();
  mark.dispatchEvent(
    new PointerEvent(type, {
      clientX: box.left + box.width * fraction,
      clientY: box.top + box.height * fraction,
      pointerType,
      bubbles: true,
    }),
  );
}
function key(mark, name) {
  mark.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true }));
}
function hit(chart) {
  return chart.element.querySelector(".orchid-charts-dense-hit");
}

describe("Automatic dense inspection", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="chart" style="width:700px"></div>';
  });
  it("previews hidden-dot lines and all series without a selection callback", () => {
    const chart = LineChart.make("#chart")
      .labels(labels)
      .dataset("Mood", values)
      .dataset("Emotion", values)
      .dots(false)
      .render();
    const mark = hit(chart);
    expect(chart.element.querySelectorAll(".orchid-charts-mark")).toHaveLength(1);
    pointer(mark, 45 / 89, "pointerenter");
    const tooltip = document.querySelector(".orchid-charts-tooltip");
    expect(tooltip.hidden).toBe(false);
    expect(tooltip.textContent).toContain("Day 46");
    expect(tooltip.textContent).toContain("Mood");
    expect(tooltip.textContent).toContain("Emotion");
    expect(chart.element.querySelector(".orchid-charts-x-hit").getAttribute("visibility")).toBe("visible");
    pointer(mark, 1);
    expect(tooltip.textContent).toContain("Day 90");
    pointer(mark, 0, "pointerleave");
    expect(tooltip.hidden).toBe(true);
    mark.focus();
    expect(tooltip.textContent).toContain("Day 1");
    key(mark, "End");
    expect(chart.point().index).toBe(89);
    key(mark, "ArrowRight");
    expect(chart.point().index).toBe(0);
    key(mark, "ArrowLeft");
    key(mark, "ArrowUp");
    key(mark, "ArrowDown");
    expect(tooltip.textContent).toContain("Day 90");
    key(mark, "Home");
    key(mark, "Enter");
    key(mark, "a");
    key(mark, "Escape");
    expect(tooltip.hidden).toBe(true);
    mark.blur();
    chart.destroy();
    pointer(mark, 0);
    expect(document.querySelector(".orchid-charts-tooltip")).toBeNull();
  });
  it("selects exact categories and preserves them across redraws and short-series transitions", () => {
    const onSelect = vi.fn();
    const chart = LineChart.make("#chart")
      .labels(labels)
      .dataset("Values", values)
      .onSelect(onSelect)
      .render();
    let mark = hit(chart);
    pointer(mark, 45 / 89, "pointerdown");
    mark.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ index: 45, label: "Day 46" }));
    mark.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    pointer(mark, 0);
    pointer(mark, 0, "pointerleave");
    expect(chart.point().index).toBe(45);
    chart.update({
      labels,
      datasets: [
        { name: "Values", values },
      ],
    });
    mark = hit(chart);
    expect(mark.dataset.pointIndex).toBe("45");
    key(mark, "Home");
    key(mark, " ");
    expect(chart.point().index).toBe(0);
    chart.update({
      labels: labels.slice(0, 3),
      datasets: [
        { name: "Values", values: values.slice(0, 3) },
      ],
    });
    expect(hit(chart)).toBeNull();
    expect(chart.point().index).toBe(0);
    chart.update({
      labels,
      datasets: [
        { name: "Values", values },
      ],
    });
    mark = hit(chart);
    expect(mark.dataset.pointIndex).toBe("0");
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(onSelect).toHaveBeenLastCalledWith();
  });
  it("pins touch previews and supports explicit tooltip disabling", () => {
    const chart = LineChart.make("#chart").labels(labels).dataset("Values", values).render();
    const mark = hit(chart);
    const tooltip = document.querySelector(".orchid-charts-tooltip");
    pointer(mark, 0.5, "pointermove", "touch");
    expect(tooltip.hidden).toBe(true);
    pointer(mark, 1, "pointerdown", "touch");
    pointer(mark, 0, "pointerleave", "touch");
    expect(tooltip.textContent).toContain("Day 90");
    expect(tooltip.hidden).toBe(false);
    pointer(mark, 0, "pointercancel", "touch");
    expect(tooltip.hidden).toBe(true);
    chart.destroy();
    const onSelect = vi.fn();
    const selectable = LineChart.make("#chart")
      .dataset("Values", values)
      .tooltip(false)
      .onSelect(onSelect)
      .render();
    key(hit(selectable), "Enter");
    expect(onSelect).toHaveBeenCalledTimes(1);
    selectable.destroy();
    const silent = LineChart.make("#chart").dataset("Values", values).tooltip(false).render();
    expect(hit(silent)).toBeNull();
  });
  it("supports bars, horizontal categories and mixed series", () => {
    const bars = BarChart.make("#chart").labels(labels).dataset("Values", values).horizontal().render();
    pointer(hit(bars), 1);
    expect(hit(bars).dataset.pointIndex).toBe("89");
    bars.destroy();
    const mixed = MixedChart.make("#chart").line("Mood", values).bar("Emotion", values).render();
    pointer(hit(mixed), 0);
    expect(hit(mixed).dataset.pointIndex).toBe("0");
  });
  it("keeps the hit-target count constant for 50,000 points", () => {
    const chart = LineChart.make("#chart")
      .dataset(Array.from({ length: 50_000 }, (_, index) => index % 30))
      .render();
    expect(chart.element.querySelectorAll(".orchid-charts-mark")).toHaveLength(1);
    pointer(hit(chart), 1);
    expect(hit(chart).dataset.pointIndex).toBe("49999");
  });
});
