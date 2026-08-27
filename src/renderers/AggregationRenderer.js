import { AGGREGATION_INSET, ChartType, DEFAULT_PERCENTAGE_RADIUS } from "../support/Constants.js";
import { svg, formatNumber } from "../support/Dom.js";
import { aggregationLayout, tooltipText } from "../support/Presentation.js";

import Composition from "./Composition.js";
import LegendRenderer from "./LegendRenderer.js";

/**
 * Renders the chart types that aggregate categories into parts of one whole.
 */
export default class AggregationRenderer {
  #chart;
  #surface;

  /**
   * Creates a renderer bound to one frozen render snapshot.
   *
   * @param {object} rendering - Collaborators for one composition pass.
   * @param {object} rendering.chart - Frozen chart data and options.
   * @param {import("./SvgSurface.js").default} rendering.surface - Owned SVG drawing surface.
   */
  constructor({ chart, surface }) {
    this.#chart = chart;
    this.#surface = surface;
  }

  /**
   * Renders aggregation values as pie, donut, percentage, or progress geometry.
   *
   * @returns {void} Aggregation marks and optional legend content are appended to the chart SVG.
   */
  render() {
    const { height, type, width } = this.#chart.options;
    const composition = new Composition(this.#chart);
    const colors = this.#chart.options.colors;
    const legendItems = composition.parts.map((part, index) => ({
      label: part.label,
      color: colors[index % colors.length],
    }));
    const layout = aggregationLayout({
      width,
      height,
      items: legendItems,
      showLegend: this.#chart.options.showLegend,
    });
    if (type === ChartType.PERCENTAGE) {
      this.#renderPercentage(composition, { colors, layout, width });
    } else {
      this.#renderSectors(composition, { colors, layout, width, type });
    }
    if (layout.legendBaseline !== null) {
      this.#renderItemLegend(composition.parts, colors, layout.legendBaseline);
    }
  }

  /**
   * Renders a rounded horizontal percentage strip.
   *
   * @param {Composition} composition - Normalized parts and their positive total.
   * @param {object} state - Layout and palette for the percentage chart.
   * @param {string[]} state.colors - Cyclic segment color palette.
   * @param {object} state.layout - Vertical content bounds and legend placement.
   * @param {number} state.width - Available chart width in pixels.
   * @returns {void} Percentage segments are appended to the chart SVG.
   */
  #renderPercentage(composition, { colors, layout, width }) {
    let x = 16;
    const available = width - 32;
    const segmentHeight = Math.min(layout.contentHeight, Math.max(28, layout.contentHeight * 0.72));
    const segmentY = layout.contentTop + (layout.contentHeight - segmentHeight) / 2;
    const percentageRadius = Math.min(
      this.#chart.options.barOptions?.radius ?? DEFAULT_PERCENTAGE_RADIUS,
      segmentHeight / 2,
      available / 2,
    );
    const clipId = `charts2-percentage-clip-${this.#chart.id}`;
    if (percentageRadius > 0) {
      const clip = svg("clipPath", { id: clipId });
      clip.append(svg("rect", { x: 16, y: segmentY, width: available, height: segmentHeight, rx: percentageRadius }));
      const defs = svg("defs");
      defs.append(clip);
      this.#surface.append(defs);
    }
    for (const [index, part] of composition.parts.entries()) {
      const segmentWidth = available * composition.shareOf(part);
      this.#surface.mark(
        "rect",
        {
          x,
          y: segmentY,
          width: segmentWidth,
          height: segmentHeight,
          fill: colors[index % colors.length],
          class: "charts2-percentage-segment charts2-mark",
          ...(percentageRadius > 0 && { "clip-path": `url(#${clipId})` }),
        },
        {
          dataset: 0,
          point: index,
          title: tooltipText({
            options: this.#chart.options,
            label: part.label,
            value: part.value,
            suffix: ` (${Math.round(composition.shareOf(part) * 100)}%)`,
          }),
        },
      );
      x += segmentWidth;
    }
  }

  /**
   * Renders pie or donut sectors and the optional center total.
   *
   * @param {Composition} composition - Normalized parts and their sector geometry.
   * @param {object} state - Layout, palette, dimensions, and renderer type.
   * @param {string[]} state.colors - Cyclic sector color palette.
   * @param {object} state.layout - Vertical content bounds and legend placement.
   * @param {number} state.width - Available chart width in pixels.
   * @param {string} state.type - Pie or donut renderer type.
   * @returns {void} Aggregation sectors are appended to the chart SVG.
   */
  #renderSectors(composition, { colors, layout, width, type }) {
    const cx = width / 2;
    const cy = layout.contentTop + layout.contentHeight / 2;
    const radius = Math.max(8, Math.min(width - AGGREGATION_INSET * 2, layout.contentHeight) * 0.44);
    const sectors = composition.sectors({ cx, cy, radius, type, colors });
    for (const { attributes, index, name, part } of sectors) {
      this.#surface.mark(
        name,
        {
          ...attributes,
          class: `charts2-${type}-slice charts2-mark`,
        },
        {
          dataset: 0,
          point: index,
          title: `${part.label}: ${formatNumber(part.value)} (${Math.round(composition.shareOf(part) * 100)}%)`,
        },
      );
    }
    if (type === ChartType.DONUT) {
      this.#surface.text(formatNumber(composition.total), {
        x: cx,
        y: cy + 5,
        class: "charts2-direct-value",
        "text-anchor": "middle",
      });
    }
  }

  /**
   * Renders a wrapped legend for aggregation items rather than data series.
   *
   * @param {Array<{label: string, value: number}>} entries - Ordered aggregation values to describe.
   * @param {string[]} colors - Item colors aligned with the supplied entries.
   * @param {number} y - Baseline of the first legend row.
   * @returns {void} Positioned legend groups are appended to the chart SVG.
   */
  #renderItemLegend(entries, colors, y) {
    new LegendRenderer({ chart: this.#chart, surface: this.#surface }).renderItems(
      entries.map((item, index) => ({ label: item.label, color: colors[index % colors.length] })),
      y,
    );
  }
}
