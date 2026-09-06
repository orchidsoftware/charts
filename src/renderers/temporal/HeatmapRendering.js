import { HEATMAP_MIN_CELL_WIDTH } from "../../support/Constants.js";
import { svg } from "../../support/Dom.js";
import { formatContext, formatterText } from "../../support/presentation/Formatting.js";
import { formatNumber } from "../../support/presentation/NumberFormatting.js";
import { measuredTextWidth } from "../../support/presentation/TextLayout.js";

const PREFERRED_CELL_GAP = 3;
const MAXIMUM_CELL_SIZE = 32;
const LEGEND_HEIGHT = 11;
const DAYS_PER_WEEK = 7;
const MONDAY_FIRST_OFFSET = 6;
const LEGEND_TOP_GAP = 12;
const LEGEND_BOTTOM_GAP = 2;
const LEGEND_BASELINE_OFFSET = 10;
const LEGEND_LABEL_GAP = 8;
const DESIRED_SWATCH_WIDTH = 11;
const DESIRED_SWATCH_GAP = 3;
const MINIMUM_SWATCH_WIDTH = 5;
const MINIMUM_SWATCH_GAP = 2;

/**
 * Converts the native Sunday-first weekday to a Monday-first calendar row.
 *
 * @param {Date} date - UTC calendar date.
 * @returns {number} Zero-based Monday-first weekday.
 */
function mondayFirstWeekday(date) {
  return (date.getUTCDay() + MONDAY_FIRST_OFFSET) % DAYS_PER_WEEK;
}

/**
 * Locates a continuous day inside its absolute week column.
 *
 * @param {number} startWeekday - Monday-first weekday of the first date.
 * @param {number} index - Zero-based day offset.
 * @returns {number} Zero-based week index.
 */
function weekIndex(startWeekday, index) {
  return Math.floor((startWeekday + index) / DAYS_PER_WEEK);
}

/**
 * Balances all weeks across the fewest readable horizontal bands.
 *
 * @param {number} width - Available SVG width.
 * @param {number} weeks - Total calendar week count.
 * @returns {{bands: number, columns: number}} Band and column counts.
 */
function bandArrangement(width, weeks) {
  const maximumColumns = Math.max(
    1,
    Math.floor((width + PREFERRED_CELL_GAP) / (HEATMAP_MIN_CELL_WIDTH + PREFERRED_CELL_GAP)),
  );

  const bands = Math.max(1, Math.ceil(weeks / maximumColumns));

  return Object.freeze({
    bands,
    columns: Math.ceil(weeks / bands),
  });
}

/**
 * Omits unused weekday rows after the final visible day.
 *
 * @param {Array<object>} heatmap - Continuous normalized daily records.
 * @param {number} startWeekday - Monday-first weekday of the first date.
 * @param {{bands: number, columns: number}} arrangement - Responsive band geometry.
 * @returns {number} Number of occupied or structurally required rows.
 */
function visibleRowCount(heatmap, startWeekday, arrangement) {
  const lastBandStartWeek = (arrangement.bands - 1) * arrangement.columns;

  const lastBandWeekdays = heatmap.flatMap((item, index) =>
    weekIndex(startWeekday, index) < lastBandStartWeek
      ? []
      : [
          mondayFirstWeekday(item.date),
        ],
  );

  return (arrangement.bands - 1) * DAYS_PER_WEEK + Math.max(...lastBandWeekdays) + 1;
}

/**
 * Resolves square-cell geometry for a continuous responsive calendar field.
 *
 * @param {number} width - Available SVG width.
 * @param {Array<object>} heatmap - Continuous normalized daily records.
 * @returns {object} Immutable geometry shared by rendering and the legend.
 */
function heatmapGeometry(width, heatmap) {
  const startWeekday = mondayFirstWeekday(heatmap[0].date);
  const weeks = Math.ceil((startWeekday + heatmap.length) / DAYS_PER_WEEK);
  const arrangement = bandArrangement(width, weeks);

  const cellSize = Math.max(
    Number.EPSILON,
    Math.min(
      MAXIMUM_CELL_SIZE,
      (width - (arrangement.columns - 1) * PREFERRED_CELL_GAP) / arrangement.columns,
    ),
  );

  const rows = visibleRowCount(heatmap, startWeekday, arrangement);
  const gridBottom = rows * cellSize + (rows - 1) * PREFERRED_CELL_GAP;

  return Object.freeze({
    height: gridBottom + LEGEND_TOP_GAP + LEGEND_HEIGHT + LEGEND_BOTTOM_GAP,
    layoutWidth: width,
    cellSize,
    columns: arrangement.columns,
    startWeekday,
    gridBottom,
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
   * Renders daily values as an accessible adaptive calendar grid.
   *
   * @returns {void} Heatmap cells, inspectors, and legend are appended to the chart SVG.
   */
  render() {
    const layout = this.#layout();
    this.#renderCells(layout);
    this.#renderLegend(layout);

    return {
      width: layout.layoutWidth,
      height: layout.height,
    };
  }

  /**
   * Derives adaptive calendar bands and color scaling once per render.
   *
   * @returns {object} Complete immutable layout snapshot shared by heatmap drawing methods.
   */
  #layout() {
    const geometry = heatmapGeometry(this.#chart.options.width, this.#chart.heatmap);
    const palette = this.#chart.palette;

    const layout = Object.freeze({
      ...geometry,
      ...palette,
    });

    return layout;
  }

  /**
   * Appends visible daily cells and individual interaction metadata when enabled.
   *
   * @param {object} layout - Heatmap dimensions and color scale from `#layout`.
   * @returns {void} Daily heat cells are appended to the chart SVG.
   */
  #renderCells(layout) {
    for (const [
      index,
      item,
    ] of this.#chart.heatmap.entries()) {
      const absoluteWeek = Math.floor((layout.startWeekday + index) / DAYS_PER_WEEK);
      const band = Math.floor(absoluteWeek / layout.columns);
      const column = absoluteWeek % layout.columns;
      const weekday = mondayFirstWeekday(item.date);
      const row = band * DAYS_PER_WEEK + weekday;

      const cell = svg("rect", {
        x: column * (layout.cellSize + PREFERRED_CELL_GAP),
        y: row * (layout.cellSize + PREFERRED_CELL_GAP),
        width: layout.cellSize,
        height: layout.cellSize,
        rx: Math.min(this.#chart.options.radius ?? 2, layout.cellSize / 2),
        fill: layout.colorFor(item.value),
        class: "charts2-heat-cell charts2-mark",
      });

      const content = this.#cellContent(item, index);

      this.#surface.mark(cell, {}, { kind: "cell", dataset: 0, point: index, title: content });
    }
  }

  /**
   * Formats a cell once for both accessibility and structured tooltip display.
   *
   * @param {object} item - Normalized heatmap entry.
   * @param {number} index - Source entry index.
   * @returns {object} Accessible text and tooltip row.
   */
  #cellContent(item, index) {
    const name = this.#formatDate(item);
    const value = `${this.#formatValue(item, index)}${this.#countSuffix()}`;
    const color = this.#chart.palette.colorFor(item.value);

    return {
      text: `${name}: ${value}`,
      heading: "",
      items: [
        { name, value, color },
      ],
    };
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
      x: 0,
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
    const scaleX = labelWidths.less + LEGEND_LABEL_GAP;
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
      layout.layoutWidth - scaleX - moreWidth - LEGEND_LABEL_GAP,
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
  return new HeatmapRenderer(rendering).render();
}

export { renderHeatmapChart };
