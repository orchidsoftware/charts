import { beforeEach, describe, expect, it, vi } from "vitest";

import { HeatmapChart, LineChart } from "../src/index.js";
import "../src/styles.css";

const tooltipFor = (chart) => chart.element.parentElement.querySelector(".orchid-charts-tooltip");
const widthOf = (chart) => chart.element.viewBox.baseVal.width;
const heightOf = (chart) => chart.element.viewBox.baseVal.height;
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
describe("Heatmap Rendering", () => {
  it("keeps short ranges compact regardless of values, container width, and updates", async () => {
    const chart = HeatmapChart.make("#chart")
      .range("2026-09-01", "2026-09-04")
      .points({ "2026-09-01": 0, "2026-09-02": 0, "2026-09-03": 0, "2026-09-04": 0 })
      .render();
    const expectCompact = () => {
      const cells = [
        ...chart.element.querySelectorAll(".orchid-charts-heat-cell"),
      ];
      expect(cells).toHaveLength(4);
      for (const cell of cells) {
        expect(Number(cell.getAttribute("width"))).toBeLessThanOrEqual(32);
        expect(cell.getAttribute("width")).toBe(cell.getAttribute("height"));
      }
      expect(heightOf(chart)).toBeLessThan(200);
      const legend = chart.element.querySelector(".orchid-charts-heat-legend").getBBox();
      expect(legend.y + legend.height).toBeLessThanOrEqual(heightOf(chart));
    };
    expectCompact();
    const initialHeight = heightOf(chart);
    document.querySelector("#chart").style.width = "1200px";
    await expect.poll(() => widthOf(chart)).toBe(1200);
    expectCompact();
    expect(heightOf(chart)).toBe(initialHeight);
    chart.update({ points: { "2026-09-01": 1_250_000, "2026-09-04": 2_375_000 } });
    expectCompact();
    expect(heightOf(chart)).toBe(initialHeight);
    chart.destroy();
  });

  it("normalizes heatmap dates, colors, updates, and invalid inputs", () => {
    const stamp = Date.parse("2026-01-02T00:00:00Z") / 1000;
    const palette = [
      "#f8f8f8",
      "#e4f2ff",
      "#cce5ff",
      "#acd7ff",
      "#8bc7ff",
      "#67b5ff",
      "#429fff",
      "#2188e5",
      "#126fbd",
      "#084b83",
    ];
    const heatmap = HeatmapChart.make("#chart")
      .countLabel("events")
      .radius(4)
      .colors(palette)
      .points({ [stamp]: 5, "2026-01-01": 1 })
      .render();
    expect(heatmap.element.querySelector(".orchid-charts-heat-cell").dataset.tooltip).toBe(
      "2026-01-01: 1 events",
    );
    expect(heatmap.element.querySelector(".orchid-charts-heat-cell title")).toBeNull();
    const cells = [
      ...heatmap.element.querySelectorAll(".orchid-charts-heat-cell"),
    ];
    const swatches = [
      ...heatmap.element.querySelectorAll(".orchid-charts-heat-legend-swatch"),
    ];
    expect(cells.every((cell) => cell.getAttribute("width") === cell.getAttribute("height"))).toBe(true);
    const cellSize = Number(cells[0].getAttribute("width"));
    expect(cells[0]).toHaveAttribute("x", "0");
    expect(Number(cells[0].getAttribute("y"))).toBeCloseTo(3 * (cellSize + 3));
    expect(cells.map((cell) => cell.getAttribute("fill"))).toEqual([
      palette[0],
      palette.at(-1),
    ]);
    expect(swatches.map((swatch) => swatch.getAttribute("fill"))).toEqual(palette);
    const gridBottom = Math.max(
      ...cells.map((cell) => Number(cell.getAttribute("y")) + Number(cell.getAttribute("height"))),
    );
    expect(Number(swatches[0].getAttribute("y")) - gridBottom).toBe(12);
    expect(
      heatmap.element.querySelector(".orchid-charts-heat-legend-more").getBBox().x +
        heatmap.element.querySelector(".orchid-charts-heat-legend-more").getBBox().width,
    ).toBeLessThanOrEqual(widthOf(heatmap));
    expect(
      Number(swatches[0].getAttribute("y")) + Number(swatches[0].getAttribute("height")),
    ).toBeLessThanOrEqual(heightOf(heatmap));
    expect(heatmap.point(1).key).toBe("2026-01-02");
    document.querySelector("#chart").style.width = "180px";
    dispatchEvent(new Event("resize"));
    expect(widthOf(heatmap)).toBe(180);
    expect(heatmap.element.style.minWidth).toBe("");
    const resizedCells = [
      ...heatmap.element.querySelectorAll(".orchid-charts-heat-cell"),
    ];
    expect(resizedCells.every((cell) => cell.getAttribute("width") === cell.getAttribute("height"))).toBe(
      true,
    );
    expect(
      Math.max(
        ...resizedCells.map((cell) => Number(cell.getAttribute("x")) + Number(cell.getAttribute("width"))),
      ),
    ).toBeLessThanOrEqual(widthOf(heatmap));
    expect(() => heatmap.update({ points: {} })).toThrow("at least one entry");
    expect(heatmap.element.querySelector(".orchid-charts-heat-cell")).not.toBeNull();
    expect(heatmap.element.querySelectorAll(".orchid-charts-heat-legend-swatch")).toHaveLength(10);
    heatmap.destroy();
    const singleDay = HeatmapChart.make("#chart").points({ "2026-01-01": 2 }).render();
    expect(singleDay.element.querySelector(".orchid-charts-heat-legend")).not.toBeNull();
    singleDay.destroy();

    const year = Object.fromEntries(
      Array.from({ length: 365 }, (_, index) => [
        new Date(Date.UTC(2026, 0, index + 1)).toISOString().slice(0, 10),
        index,
      ]),
    );
    const onWeekSelect = vi.fn();
    const narrow = HeatmapChart.make("#chart")
      .width(100)
      .colors(palette)
      .onSelect(onWeekSelect)
      .points(year)
      .render();
    const narrowCells = [
      ...narrow.element.querySelectorAll(".orchid-charts-heat-cell"),
    ];
    const narrowSwatches = [
      ...narrow.element.querySelectorAll(".orchid-charts-heat-legend-swatch"),
    ];
    const weekHits = [
      ...narrow.element.querySelectorAll(".orchid-charts-heat-week-hit"),
    ];
    expect(narrow.element.parentElement).not.toHaveClass("orchid-charts-scrollable-heatmap");
    expect(narrow.element.getBoundingClientRect().width).toBe(
      narrow.element.parentElement.getBoundingClientRect().width,
    );
    expect(widthOf(narrow)).toBe(100);
    expect(narrowCells.every((cell) => cell.getAttribute("width") === cell.getAttribute("height"))).toBe(
      true,
    );
    expect(narrowCells.every((cell) => cell.classList.contains("orchid-charts-mark"))).toBe(true);
    expect(weekHits).toHaveLength(0);
    expect(
      Number(narrowSwatches[1].getAttribute("x")) -
        Number(narrowSwatches[0].getAttribute("x")) -
        Number(narrowSwatches[0].getAttribute("width")),
    ).toBeCloseTo(0);
    narrowCells[0].dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(tooltipFor(narrow).hidden).toBe(false);
    narrowCells[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onWeekSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "heatmap",
        index: 0,
        key: "2026-01-01",
        value: 0,
      }),
    );
    narrow.destroy();
    const compactLegend = HeatmapChart.make("#chart")
      .width(100)
      .colors(palette)
      .points({ "2026-01-01": 1 })
      .render();
    const compactSwatches = [
      ...compactLegend.element.querySelectorAll(".orchid-charts-heat-legend-swatch"),
    ];
    expect(compactLegend.element.parentElement).not.toHaveClass("orchid-charts-scrollable-heatmap");
    expect(
      Number(compactSwatches[1].getAttribute("x")) -
        Number(compactSwatches[0].getAttribute("x")) -
        Number(compactSwatches[0].getAttribute("width")),
    ).toBeCloseTo(0);
    compactLegend.destroy();
    const tall = HeatmapChart.make("#chart").points(year).render();
    const tallCells = [
      ...tall.element.querySelectorAll(".orchid-charts-heat-cell"),
    ];
    const tallGridBottom = Math.max(
      ...tallCells.map((cell) => Number(cell.getAttribute("y")) + Number(cell.getAttribute("height"))),
    );
    expect(tallCells.every((cell) => cell.getAttribute("width") === cell.getAttribute("height"))).toBe(true);
    expect(
      Number(tall.element.querySelector(".orchid-charts-heat-legend-swatch").getAttribute("y")) -
        tallGridBottom,
    ).toBe(12);
    expect(heightOf(tall)).toBeGreaterThan(280);
    tall.destroy();
    expect(() =>
      HeatmapChart.make("#chart")
        .range(new Date("2026-02-01"), new Date("2026-01-01"))
        .points({ "2026-01-15": 1 })
        .render(),
    ).toThrow("precede");
    expect(() => HeatmapChart.make("#chart").points({ bad: 1 }).render()).toThrow("Invalid heatmap date");
    expect(() => HeatmapChart.make("#chart").points({ "2026-01-01": NaN }).render()).toThrow("finite");
    expect(() =>
      LineChart.make("#chart")
        .colors([])
        .labels(series.labels)
        .dataset({
          name: "One",
          values: [
            2,
            4,
            -1,
          ],
        })
        .render(),
    ).toThrow("colors");
  });
  it("reports heatmap selection and keeps tooltip positioning safe with an unmeasured host", () => {
    const chart = HeatmapChart.make("#chart")
      .onSelect(() => {})
      .points({ "2026-01-01": 4 })
      .render();
    const selected = [];
    chart.element.parentElement.addEventListener("data-select", (event) => {
      selected.push(event.detail);
    });
    const cell = chart.element.querySelector(".orchid-charts-heat-cell");
    cell.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(selected[0]).toMatchObject({ key: "2026-01-01", value: 4 });
    vi.spyOn(chart.element.parentElement, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      toJSON() {},
    });
    cell.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 40, clientY: 20 }));
    const hoverPosition = { left: tooltipFor(chart).style.left, top: tooltipFor(chart).style.top };
    cell.focus();
    expect({ left: tooltipFor(chart).style.left, top: tooltipFor(chart).style.top }).toEqual(hoverPosition);
    expect(tooltipFor(chart).hidden).toBe(false);

    delete cell.dataset.tooltip;
    delete cell.dataset.tooltipItems;
    delete cell.dataset.tooltipHeading;
    cell.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
    expect(tooltipFor(chart).querySelector("strong").textContent).toBe("4");
  });
});
