import { HEATMAP_COLORS, HEATMAP_COMPACT_WIDTH, HEATMAP_MIN_CELL_WIDTH } from "../../support/Constants.js";
import { formatNumber, markMetadata, measuredTextWidth, svg, titled } from "../../support/Dom.js";
import { extent } from "../../support/geometry/Math.js";
import { formatContext, formatterText } from "../../support/presentation/Formatting.js";
import { intensityLevel } from "../../support/presentation/Presentation.js";

const GRID_PADDING = 24;
const MINIMUM_HORIZONTAL_PADDING = 4;
const HORIZONTAL_PADDING_RATIO = 0.08;
const GRID_TOP = 24;
const PREFERRED_CELL_GAP = 3;
const LEGEND_HEIGHT = 11;
const LEGEND_GAP = 12;
const DAYS_PER_WEEK = 7;
const INSPECTOR_WEEK_THRESHOLD = 20;
const MINIMUM_COLUMN_CALCULATION_WIDTH = 4;
const LEGEND_TOP_GAP = 12;
const LEGEND_BASELINE_OFFSET = 10;
const LEGEND_LABEL_GAP = 8;
const DESIRED_SWATCH_WIDTH = 11;
const DESIRED_SWATCH_GAP = 3;
const MINIMUM_SWATCH_WIDTH = 5;
const MINIMUM_SWATCH_GAP = 2;

/**
 * Calculates responsive horizontal padding for the heatmap grid.
 *
 * @param {number} width - Requested chart width.
 * @returns {number} Bounded horizontal padding.
 */
function heatmapHorizontalPadding(width) {
  return Math.min(GRID_PADDING, Math.max(MINIMUM_HORIZONTAL_PADDING, width * HORIZONTAL_PADDING_RATIO));
}

/**
 * Resolves viewport and overflow dimensions for one heatmap.
 *
 * @param {number} width - Requested chart width.
 * @param {number} height - Requested chart height.
 * @param {object} chart - Frozen chart snapshot.
 * @returns {object} Complete heatmap dimensions.
 */
function heatmapDimensions(width, height, chart) {
  const horizontalPadding = heatmapHorizontalPadding(width);
  const weeks = Math.max(1, Math.ceil(chart.heatmap.length / DAYS_PER_WEEK));
  const rows = Math.min(DAYS_PER_WEEK, Math.max(1, chart.heatmap.length));
  const hasWeekInspector = weeks > INSPECTOR_WEEK_THRESHOLD && width < HEATMAP_COMPACT_WIDTH;

  const minimumScrollableWidth =
    horizontalPadding * 2 + weeks * HEATMAP_MIN_CELL_WIDTH + (weeks - 1) * PREFERRED_CELL_GAP;

  return Object.freeze({
    horizontalPadding,
    weeks,
    rows,
    hasWeekInspector,
    layoutWidth: hasWeekInspector ? Math.max(width, minimumScrollableWidth) : width,
    gridTop: GRID_TOP,
    gridBottom: height - GRID_PADDING - LEGEND_HEIGHT - LEGEND_GAP,
  });
}

/**
 * Renders calendar heatmaps and owns their overflow presentation policy.
 */
class HeatmapRenderer {
  #chart;
  #surface;

  /**
   * Creates a renderer bound to one frozen render snapshot.
   *
   * @param {object} rendering - Collaborators for one heatmap pass.
   * @param {object} rendering.chart - Frozen heatmap data and options.
   * @param {import("../SvgSurface.js").default} rendering.surface - Owned SVG drawing surface.
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
    this.#renderLegend(layout);
  }

  /**
   * Derives grid dimensions, overflow behavior, and color scaling once per render.
   *
   * @returns {object} Complete immutable layout snapshot shared by heatmap drawing methods.
   */
  #layout() {
    const { height, width } = this.#chart.options;
    const dimensions = this.#dimensions(width, height);

    this.#configureSurface(dimensions, height);

    const cells = this.#cellGeometry(dimensions);
    const palette = this.#palette();

    return {
      height,
      ...dimensions,
      ...cells,
      ...palette,
    };
  }

  /**
   * Resolves viewport, grid, and overflow dimensions.
   *
   * @param {number} width - Requested chart width.
   * @param {number} height - Requested chart height.
   * @returns {object} Stable heatmap dimensions.
   */
  #dimensions(width, height) {
    return heatmapDimensions(width, height, this.#chart);
  }

  /**
   * Applies horizontal overflow policy to the host and SVG surface.
   *
   * @param {object} dimensions - Resolved viewport dimensions.
   * @param {number} height - Requested chart height.
   * @returns {void} Host class and SVG sizing are updated.
   */
  #configureSurface(dimensions, height) {
    this.#surface.attribute("data-scrollable", dimensions.hasWeekInspector ? "true" : "false");
    this.#surface.attribute("viewBox", `0 0 ${dimensions.layoutWidth} ${height}`);
    this.#surface.styles({
      width: dimensions.hasWeekInspector ? `${dimensions.layoutWidth}px` : "100%",
      maxWidth: dimensions.hasWeekInspector ? "none" : "100%",
    });
  }

  /**
   * Resolves gaps and cell sizes inside the drawable grid.
   *
   * @param {object} dimensions - Resolved viewport dimensions.
   * @returns {object} Row, column, and cell geometry.
   */
  #cellGeometry(dimensions) {
    const availableGridWidth = Math.max(1, dimensions.layoutWidth - dimensions.horizontalPadding * 2);
    const availableGridHeight = Math.max(dimensions.rows, dimensions.gridBottom - dimensions.gridTop);

    const rowGap = Math.min(
      PREFERRED_CELL_GAP,
      Math.max(0, (availableGridHeight - dimensions.rows) / Math.max(1, dimensions.rows - 1)),
    );

    const columnGap = Math.min(
      PREFERRED_CELL_GAP,
      Math.max(
        0,
        (availableGridWidth - dimensions.weeks * MINIMUM_COLUMN_CALCULATION_WIDTH) /
          Math.max(1, dimensions.weeks - 1),
      ),
    );

    const cellWidth = Math.max(
      Number.EPSILON,
      (availableGridWidth - (dimensions.weeks - 1) * columnGap) / dimensions.weeks,
    );

    const cellHeight = Math.max(1, (availableGridHeight - (dimensions.rows - 1) * rowGap) / dimensions.rows);

    return {
      availableGridHeight,
      rowGap,
      columnGap,
      cellWidth,
      cellHeight,
    };
  }

  /**
   * Resolves the active palette and its value-to-color mapping.
   *
   * @returns {object} Palette and bounded color-level function.
   */
  #palette() {
    const values = this.#chart.heatmap.map((item) => item.value);

    const [
      minimum,
      maximum,
    ] = extent(values);

    const colors = this.#chart.hasCustomColors ? this.#chart.options.colors : HEATMAP_COLORS;

    const colorLevel = (value) =>
      intensityLevel(
        value,
        [
          minimum,
          maximum,
        ],
        colors.length,
      );

    return {
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

    for (const [
      index,
      item,
    ] of this.#chart.heatmap.entries()) {
      const level = layout.colorLevel(item.value);
      const column = Math.floor(index / DAYS_PER_WEEK);
      const row = index % DAYS_PER_WEEK;

      const cell = svg("rect", {
        x: layout.horizontalPadding + column * (layout.cellWidth + layout.columnGap),
        y: layout.gridTop + row * (layout.cellHeight + layout.rowGap),
        width: layout.cellWidth,
        height: layout.cellHeight,
        rx: Math.min(this.#chart.options.radius ?? 2, layout.cellWidth / 2, layout.cellHeight / 2),
        fill: layout.colors[level],
        class: "charts2-heat-cell charts2-mark",
      });

      const visibleCell = titled(
        markMetadata(cell, 0, index),
        `${this.#formatDate(item)}: ${this.#formatValue(item, index)}${suffix}`,
      );

      this.#surface.append(visibleCell);
    }
  }

  /**
   * Renders the bounded Less-to-More color legend.
   *
   * @param {object} layout - Heatmap dimensions and palette from `#layout`.
   * @returns {void} The intensity legend is appended to the chart SVG.
   */
  #renderLegend(layout) {
    const geometry = this.#legendGeometry(layout);

    const legend = svg("g", {
      class: "charts2-heat-legend",
      "aria-label": "Heatmap intensity: Less to More",
    });

    const less = svg("text", {
      x: layout.horizontalPadding,
      y: geometry.baseline,
      class: "charts2-legend charts2-heat-legend-less",
    });

    less.textContent = "Less";
    legend.append(less);

    this.#appendLegendSwatches(legend, layout.colors, geometry);

    const more = svg("text", {
      x: geometry.scaleX + geometry.scaleWidth + LEGEND_LABEL_GAP,
      y: geometry.baseline,
      class: "charts2-legend charts2-heat-legend-more",
    });

    more.textContent = "More";
    legend.append(more);
    this.#surface.append(legend);
  }

  /**
   * Calculates bounded legend label and swatch geometry.
   *
   * @param {object} layout - Heatmap dimensions and palette.
   * @returns {object} Legend baseline, scale bounds, and swatch sizing.
   */
  #legendGeometry(layout) {
    const vertical = { top: layout.gridBottom + LEGEND_TOP_GAP };
    const labelWidths = { less: measuredTextWidth("Less"), more: measuredTextWidth("More") };
    const scaleX = layout.horizontalPadding + labelWidths.less + LEGEND_LABEL_GAP;
    const scaleWidth = this.#legendScaleWidth(layout, scaleX, labelWidths.more);

    const minimumGappedWidth =
      layout.colors.length * MINIMUM_SWATCH_WIDTH +
      Math.max(0, layout.colors.length - 1) * MINIMUM_SWATCH_GAP;

    const swatchGap = scaleWidth >= minimumGappedWidth ? MINIMUM_SWATCH_GAP : 0;
    const swatchWidth = (scaleWidth - swatchGap * (layout.colors.length - 1)) / layout.colors.length;

    return {
      top: vertical.top,
      baseline: vertical.top + LEGEND_BASELINE_OFFSET,
      scaleX,
      scaleWidth,
      swatchGap,
      swatchWidth,
    };
  }

  /**
   * Bounds the desired swatch scale between palette and viewport widths.
   *
   * @param {object} layout - Heatmap dimensions and palette.
   * @param {number} scaleX - Horizontal start of the swatch scale.
   * @param {number} moreWidth - Measured width of the trailing label.
   * @returns {number} Drawable width allocated to all swatches.
   */
  #legendScaleWidth(layout, scaleX, moreWidth) {
    const maximumScaleWidth = Math.max(
      layout.colors.length,
      layout.layoutWidth - layout.horizontalPadding - scaleX - moreWidth - LEGEND_LABEL_GAP,
    );

    const desiredScaleWidth =
      layout.colors.length * DESIRED_SWATCH_WIDTH +
      Math.max(0, layout.colors.length - 1) * DESIRED_SWATCH_GAP;

    return Math.min(desiredScaleWidth, maximumScaleWidth);
  }

  /**
   * Appends the ordered palette swatches to the legend group.
   *
   * @param {SVGElement} legend - Parent legend group.
   * @param {string[]} colors - Ordered heatmap palette.
   * @param {object} geometry - Resolved legend geometry.
   * @returns {void} Palette rectangles are appended.
   */
  #appendLegendSwatches(legend, colors, geometry) {
    for (const [
      index,
      color,
    ] of colors.entries()) {
      legend.append(
        svg("rect", {
          x: geometry.scaleX + index * (geometry.swatchWidth + geometry.swatchGap),
          y: geometry.top,
          width: geometry.swatchWidth,
          height: LEGEND_HEIGHT,
          rx: Math.min(2, geometry.swatchWidth / 2),
          fill: color,
          class: "charts2-heat-legend-swatch",
        }),
      );
    }
  }

  /**
   * Formats one heatmap date key through the optional tooltip hook.
   *
   * @param {object} item - Normalized daily heatmap point.
   * @returns {string} Caller-formatted or canonical date label.
   */
  #formatDate(item) {
    const formatter = this.#chart.options.tooltipFormatDate;

    if (!formatter) {
      return item.key;
    }

    return formatterText(formatter(new Date(item.date)), "Heatmap tooltip date");
  }

  /**
   * Formats one heatmap value through the optional tooltip hook.
   *
   * @param {object} item - Normalized daily heatmap point.
   * @param {number} index - Stable point position.
   * @returns {string} Caller-formatted or localized numeric value.
   */
  #formatValue(item, index) {
    const formatter = this.#chart.options.tooltipFormatValue;

    if (!formatter) {
      return formatNumber(item.value);
    }

    return formatterText(
      formatter(
        item.value,
        formatContext(this.#chart.options, "tooltip", {
          index,
          label: item.key,
          point: { x: index, y: item.value },
        }),
      ),
      "Heatmap tooltip value",
    );
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

/**
 * Renders one heatmap through its family renderer.
 *
 * @param {object} rendering - Frozen chart snapshot and owned SVG surface.
 * @returns {void} Heatmap content is appended to the chart SVG.
 */
function renderHeatmapChart(rendering) {
  new HeatmapRenderer(rendering).render();
}

export { renderHeatmapChart };
