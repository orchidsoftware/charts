import { HEATMAP_COLORS, HEATMAP_COMPACT_WIDTH, HEATMAP_MIN_CELL_WIDTH } from "../support/Constants.js";
import { formatNumber, markMetadata, measuredTextWidth, svg, titled } from "../support/Dom.js";
import { extent, scale } from "../support/Math.js";

/**
 * Renders calendar heatmaps and owns their overflow presentation policy.
 */
export default class HeatmapRenderer {
  #chart;
  #surface;

  /**
   * Creates a renderer bound to one frozen render snapshot.
   *
   * @param {object} rendering - Collaborators for one heatmap pass.
   * @param {object} rendering.chart - Frozen heatmap data and options.
   * @param {import("./SvgSurface.js").default} rendering.surface - Owned SVG drawing surface.
   */
  constructor({ chart, surface }) {
    this.#chart = chart;
    this.#surface = surface;
  }

  /**
   * Renders daily values as an accessible, horizontally scrollable calendar grid.
   *
   * @returns {void} Heatmap cells, inspectors, and legend are appended to the chart SVG.
   */
  render() {
    const layout = this.#layout();
    this.#renderCells(layout);
    if (layout.hasWeekInspector) {
      this.#renderWeekInspectors(layout);
    }
    if (this.#chart.options.showLegend) {
      this.#renderLegend(layout);
    }
  }

  /**
   * Derives grid dimensions, overflow behavior, and color scaling once per render.
   *
   * @returns {object} Complete immutable layout snapshot shared by heatmap drawing methods.
   */
  #layout() {
    const { height, width } = this.#chart.options;
    const padding = 24;
    const horizontalPadding = Math.min(padding, Math.max(4, width * 0.08));
    const gridTop = 24;
    const preferredCellGap = 3;
    const legendHeight = this.#chart.options.showLegend ? 11 : 0;
    const legendGap = this.#chart.options.showLegend ? 12 : 0;
    const weeks = Math.max(1, Math.ceil(this.#chart.heatmap.length / 7));
    const rows = Math.min(7, Math.max(1, this.#chart.heatmap.length));
    const hasWeekInspector = weeks > 20 && width < HEATMAP_COMPACT_WIDTH;
    const minimumScrollableWidth =
      horizontalPadding * 2 + weeks * HEATMAP_MIN_CELL_WIDTH + (weeks - 1) * preferredCellGap;
    const layoutWidth = hasWeekInspector ? Math.max(width, minimumScrollableWidth) : width;
    this.#chart.host.classList.toggle("charts2-scrollable-heatmap", hasWeekInspector);
    this.#surface.attribute("viewBox", `0 0 ${layoutWidth} ${height}`);
    this.#surface.styles({
      width: hasWeekInspector ? `${layoutWidth}px` : "100%",
      maxWidth: hasWeekInspector ? "none" : "100%",
    });

    const availableGridWidth = Math.max(1, layoutWidth - horizontalPadding * 2);
    const gridBottom = height - padding - legendHeight - legendGap;
    const availableGridHeight = Math.max(rows, gridBottom - gridTop);
    const rowGap = Math.min(preferredCellGap, Math.max(0, (availableGridHeight - rows) / Math.max(1, rows - 1)));
    const columnGap = Math.min(
      preferredCellGap,
      Math.max(0, (availableGridWidth - weeks * 4) / Math.max(1, weeks - 1)),
    );
    const cellWidth = Math.max(Number.EPSILON, (availableGridWidth - (weeks - 1) * columnGap) / weeks);
    const cellHeight = Math.max(1, (availableGridHeight - (rows - 1) * rowGap) / rows);
    const values = this.#chart.heatmap.map((item) => item.value);
    const [minimum, maximum] = values.length > 0 ? extent(values) : [0, 1];
    const colors = this.#chart.hasCustomColors ? this.#chart.options.colors : HEATMAP_COLORS;
    const colorLevel = (value) =>
      Math.min(colors.length - 1, Math.max(0, Math.round(scale(value, [minimum, maximum], [0, colors.length - 1]))));
    return {
      height,
      horizontalPadding,
      gridTop,
      weeks,
      hasWeekInspector,
      layoutWidth,
      availableGridHeight,
      gridBottom,
      rowGap,
      columnGap,
      cellWidth,
      cellHeight,
      colors,
      colorLevel,
    };
  }

  /**
   * Appends visible daily cells and individual interaction metadata when enabled.
   *
   * @param {object} layout - Heatmap dimensions and color scale from `#layout`.
   * @returns {void} Daily heat cells are appended to the chart SVG.
   */
  #renderCells(layout) {
    const suffix = this.#countSuffix();
    for (const [index, item] of this.#chart.heatmap.entries()) {
      const level = layout.colorLevel(item.value);
      const column = Math.floor(index / 7);
      const row = index % 7;
      const cell = svg("rect", {
        x: layout.horizontalPadding + column * (layout.cellWidth + layout.columnGap),
        y: layout.gridTop + row * (layout.cellHeight + layout.rowGap),
        width: layout.cellWidth,
        height: layout.cellHeight,
        rx: Math.min(this.#chart.options.radius ?? 2, layout.cellWidth / 2, layout.cellHeight / 2),
        fill: layout.colors[level],
        class: `charts2-heat-cell ${layout.hasWeekInspector ? "charts2-visual-mark" : "charts2-mark"}`,
      });
      const visibleCell = layout.hasWeekInspector
        ? cell
        : titled(markMetadata(cell, 0, index), `${item.key}: ${formatNumber(item.value)}${suffix}`);
      this.#surface.append(visibleCell);
    }
  }

  /**
   * Adds one aggregate hit target and structured tooltip for each visible week.
   *
   * @param {object} layout - Heatmap dimensions and color scale from `#layout`.
   * @returns {void} Week-sized interaction targets are appended to the chart SVG.
   */
  #renderWeekInspectors(layout) {
    const weeks = Array.from({ length: layout.weeks }, (_, columnIndex) =>
      this.#chart.heatmap.slice(columnIndex * 7, columnIndex * 7 + 7),
    );
    const suffix = this.#countSuffix();
    for (const [columnIndex, items] of weeks.entries()) {
      const firstLabel = this.#formatKey(items[0].key);
      const lastLabel = this.#formatKey(items.at(-1).key);
      const heading = firstLabel === lastLabel ? firstLabel : `${firstLabel} – ${lastLabel}`;
      const tooltipItems = items.map((item) => ({
        name: this.#formatKey(item.key),
        value: `${this.#formatValue(item.value)}${suffix}`,
        color: layout.colors[layout.colorLevel(item.value)],
      }));
      const hit = markMetadata(
        svg("rect", {
          x: layout.horizontalPadding + columnIndex * (layout.cellWidth + layout.columnGap) - layout.columnGap / 2,
          y: layout.gridTop,
          width: layout.cellWidth + layout.columnGap,
          height: layout.availableGridHeight,
          fill: "transparent",
          class: "charts2-x-hit charts2-heat-week-hit charts2-mark",
        }),
        -1,
        columnIndex * 7,
      );
      Object.assign(hit.dataset, {
        heatmapRangeLength: String(items.length),
        tooltipHeading: heading,
        tooltipItems: JSON.stringify(tooltipItems),
      });
      const summary = tooltipItems.map((item) => `${item.name}: ${item.value}`).join(" · ");
      this.#surface.append(titled(hit, `${heading} — ${summary}`));
    }
  }

  /**
   * Renders the bounded Less-to-More color legend.
   *
   * @param {object} layout - Heatmap dimensions and palette from `#layout`.
   * @returns {void} The intensity legend is appended to the chart SVG.
   */
  #renderLegend(layout) {
    const legendTop = layout.gridBottom + 12;
    const legendBaseline = legendTop + 10;
    const labelGap = 8;
    const lessWidth = measuredTextWidth("Less");
    const moreWidth = measuredTextWidth("More");
    const scaleX = layout.horizontalPadding + lessWidth + labelGap;
    const maximumScaleWidth = Math.max(
      layout.colors.length,
      layout.layoutWidth - layout.horizontalPadding - scaleX - moreWidth - labelGap,
    );
    const desiredScaleWidth = layout.colors.length * 11 + Math.max(0, layout.colors.length - 1) * 3;
    const scaleWidth = Math.min(desiredScaleWidth, maximumScaleWidth);
    const swatchGap = scaleWidth >= layout.colors.length * 5 + Math.max(0, layout.colors.length - 1) * 2 ? 2 : 0;
    const swatchWidth = (scaleWidth - swatchGap * (layout.colors.length - 1)) / layout.colors.length;
    const legend = svg("g", { class: "charts2-heat-legend", "aria-label": "Heatmap intensity: Less to More" });
    const less = svg("text", {
      x: layout.horizontalPadding,
      y: legendBaseline,
      class: "charts2-legend charts2-heat-legend-less",
    });
    less.textContent = "Less";
    legend.append(less);
    for (const [index, color] of layout.colors.entries()) {
      legend.append(
        svg("rect", {
          x: scaleX + index * (swatchWidth + swatchGap),
          y: legendTop,
          width: swatchWidth,
          height: 11,
          rx: Math.min(2, swatchWidth / 2),
          fill: color,
          class: "charts2-heat-legend-swatch",
        }),
      );
    }
    const more = svg("text", {
      x: scaleX + scaleWidth + labelGap,
      y: legendBaseline,
      class: "charts2-legend charts2-heat-legend-more",
    });
    more.textContent = "More";
    legend.append(more);
    this.#surface.append(legend);
  }

  /**
   * Formats one heatmap date key through the optional tooltip hook.
   *
   * @param {string} key - Canonical daily heatmap key.
   * @returns {string} Caller-formatted or canonical date label.
   */
  #formatKey(key) {
    return String(this.#chart.options.tooltipOptions?.formatTooltipX?.(key) ?? key);
  }

  /**
   * Formats one heatmap value through the optional tooltip hook.
   *
   * @param {number} value - Normalized heatmap value.
   * @returns {string} Caller-formatted or localized numeric value.
   */
  #formatValue(value) {
    return String(this.#chart.options.tooltipOptions?.formatTooltipY?.(value) ?? formatNumber(value));
  }

  /**
   * Builds the optional unit suffix shared by heatmap tooltips.
   *
   * @returns {string} Empty text or a leading-space count label.
   */
  #countSuffix() {
    return this.#chart.options.countLabel ? ` ${this.#chart.options.countLabel}` : "";
  }
}
