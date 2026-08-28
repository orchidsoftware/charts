import { AGGREGATION_INSET, ChartType, DEFAULT_PERCENTAGE_RADIUS } from "../support/Constants.js";
import { svg, formatNumber } from "../support/Dom.js";
import { aggregationLayout, tooltipText } from "../support/Presentation.js";

import Composition from "./Composition.js";
import LegendRenderer from "./LegendRenderer.js";

const PERCENTAGE_INSET = 16;
const MINIMUM_SEGMENT_HEIGHT = 28;
const SEGMENT_HEIGHT_RATIO = 0.72;
const FULL_PERCENTAGE = 100;
const MINIMUM_SECTOR_RADIUS = 8;
const SECTOR_RADIUS_RATIO = 0.44;
const DONUT_LABEL_OFFSET = 5;

/**
 * Names the resolved geometry of one horizontal percentage strip.
 */
class PercentageStrip {
  /**
   * Resolves strip bounds and clipping policy.
   *
   * @param {number} width - Available chart width.
   * @param {object} layout - Vertical aggregation layout.
   * @param {object} clipping - Radius and unique clip identifier.
   */
  constructor(width, layout, clipping) {
    this.x = PERCENTAGE_INSET;
    this.width = width - PERCENTAGE_INSET * 2;
    this.height = Math.min(
      layout.contentHeight,
      Math.max(MINIMUM_SEGMENT_HEIGHT, layout.contentHeight * SEGMENT_HEIGHT_RATIO),
    );
    this.y = layout.contentTop + (layout.contentHeight - this.height) / 2;
    this.radius = Math.min(clipping.radius, this.height / 2, this.width / 2);
    this.clipId = clipping.id;
  }
}

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

      if (layout.legendBaseline !== null) {
        this.#renderItemLegend(composition.parts, colors, layout.legendBaseline);
      }

      return;
    }

    this.#renderSectors(composition, { colors, layout, width, type });

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
    const strip = new PercentageStrip(width, layout, {
      radius: this.#chart.options.barOptions?.radius ?? DEFAULT_PERCENTAGE_RADIUS,
      id: `charts2-percentage-clip-${this.#chart.id}`,
    });

    if (strip.radius > 0) {
      this.#appendPercentageClip(strip);
    }

    this.#renderPercentageSegments(composition, colors, strip);
  }

  /**
   * Renders each proportional segment from left to right.
   *
   * @param {Composition} composition - Normalized parts and their positive total.
   * @param {string[]} colors - Cyclic segment palette.
   * @param {PercentageStrip} strip - Resolved strip geometry.
   * @returns {void} Percentage marks are appended to the chart SVG.
   */
  #renderPercentageSegments(composition, colors, strip) {
    let x = strip.x;

    for (const [index, part] of composition.parts.entries()) {
      const segmentWidth = strip.width * composition.shareOf(part);

      this.#surface.mark(
        "rect",
        {
          x,
          y: strip.y,
          width: segmentWidth,
          height: strip.height,
          fill: colors[index % colors.length],
          class: "charts2-percentage-segment charts2-mark",
          ...(strip.radius > 0 && { "clip-path": `url(#${strip.clipId})` }),
        },
        {
          dataset: 0,
          point: index,
          title: tooltipText({
            options: this.#chart.options,
            label: part.label,
            value: part.value,
            suffix: ` (${Math.round(composition.shareOf(part) * FULL_PERCENTAGE)}%)`,
          }),
        },
      );
      x += segmentWidth;
    }
  }

  /**
   * Appends the rounded clipping boundary shared by all percentage segments.
   *
   * @param {PercentageStrip} strip - Resolved strip geometry and clip identifier.
   * @returns {void} A clip definition is appended to the surface.
   */
  #appendPercentageClip(strip) {
    const clip = svg("clipPath", { id: strip.clipId });

    const boundary = svg("rect", {
      x: strip.x,
      y: strip.y,
      width: strip.width,
      height: strip.height,
      rx: strip.radius,
    });

    clip.append(boundary);

    const defs = svg("defs");
    defs.append(clip);
    this.#surface.append(defs);
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

    const radius = Math.max(
      MINIMUM_SECTOR_RADIUS,
      Math.min(width - AGGREGATION_INSET * 2, layout.contentHeight) * SECTOR_RADIUS_RATIO,
    );

    const sectors = composition.sectors({ x: cx, y: cy }, radius, { type, colors });

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
          title: `${part.label}: ${formatNumber(part.value)} (${Math.round(composition.shareOf(part) * FULL_PERCENTAGE)}%)`,
        },
      );
    }

    if (type === ChartType.DONUT) {
      this.#surface.text(formatNumber(composition.total), {
        x: cx,
        y: cy + DONUT_LABEL_OFFSET,
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
