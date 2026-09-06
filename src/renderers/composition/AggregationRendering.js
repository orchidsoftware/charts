import { ChartType, DEFAULT_PERCENTAGE_RADIUS } from "../../support/Constants.js";
import { svg } from "../../support/Dom.js";
import { formatLabel, formatValue, seriesContext } from "../../support/presentation/Formatting.js";
import { chartContentLayout, tooltipContent } from "../../support/presentation/Presentation.js";
import { renderLegend } from "../LegendRendering.js";

import Composition from "./Composition.js";

const FULL_PERCENTAGE = 100;
const MINIMUM_SECTOR_RADIUS = 8;
const SECTOR_RADIUS_RATIO = 0.5;
const DONUT_LABEL_OFFSET = 5;
const VALUE_LABEL_TARGET = "value-label";

/**
 * Resolves bounds and clipping for one horizontal percentage strip.
 *
 * @param {number} width - Available chart width.
 * @param {object} layout - Vertical aggregation layout.
 * @param {object} clipping - Radius and unique clip identifier.
 * @returns {object} Complete percentage strip geometry.
 */
function percentageStrip(width, layout, clipping) {
  const stripWidth = width;

  const height = layout.contentHeight;

  return {
    x: 0,
    width: stripWidth,
    height,
    y: 0,
    radius: Math.min(clipping.radius, height / 2, stripWidth / 2),
    clipId: clipping.id,
  };
}

/**
 * Renders the chart types that aggregate categories into parts of one whole.
 */
class AggregationRenderer {
  #chart;
  #surface;

  /**
   * Creates a renderer bound to one frozen render snapshot.
   *
   * @param {object} rendering - Collaborators for one composition pass.
   * @param {object} rendering.chart - Frozen chart data and options.
   * @param {import("../SvgSurface.js").default} rendering.surface - Owned SVG drawing surface.
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
      label: formatLabel(this.#chart.options, part.label, { target: VALUE_LABEL_TARGET, index }),
      color: colors[index % colors.length],
    }));

    const layout = chartContentLayout({
      width,
      height,
      items: legendItems,
      legend: this.#chart.options.legend,
    });

    renderLegend({ chart: this.#chart, surface: this.#surface }, layout);

    if (type === ChartType.PERCENTAGE) {
      this.#renderPercentage(composition, { colors, layout, width });

      return;
    }

    this.#renderSectors(composition, { colors, layout, width, type });
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
    const strip = percentageStrip(width, layout, {
      radius: this.#chart.options.radius ?? DEFAULT_PERCENTAGE_RADIUS,
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
   * @param {object} strip - Resolved strip geometry.
   * @returns {void} Percentage marks are appended to the chart SVG.
   */
  #renderPercentageSegments(composition, colors, strip) {
    let x = strip.x;

    for (const [
      index,
      part,
    ] of composition.parts.entries()) {
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
          title: tooltipContent({
            ...seriesContext(this.#chart, 0, index),
            options: this.#chart.options,
            label: part.label,
            color: colors[index % colors.length],
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
   * @param {object} strip - Resolved strip geometry and clip identifier.
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
    const cy = layout.contentHeight / 2;

    const radius = Math.max(
      MINIMUM_SECTOR_RADIUS,
      Math.min(width, layout.contentHeight) * SECTOR_RADIUS_RATIO,
    );

    const sectors = composition.sectors({ x: cx, y: cy }, radius, { type, colors });

    for (const sector of sectors) {
      this.#appendSector(composition, sector, type);
    }

    if (type === ChartType.DONUT) {
      this.#surface.text(
        formatValue(this.#chart.options, composition.total, { target: VALUE_LABEL_TARGET }),
        {
          x: cx,
          y: cy + DONUT_LABEL_OFFSET,
          class: "charts2-direct-value",
          "text-anchor": "middle",
        },
      );
    }
  }

  /**
   * Appends one radial sector with stable outer-arc tooltip metadata.
   *
   * @param {Composition} composition - Current normalized composition.
   * @param {object} sector - Renderable sector descriptor.
   * @param {string} type - Pie or donut renderer type.
   * @returns {void} One interactive sector is appended.
   */
  #appendSector(composition, sector, type) {
    this.#surface.mark(
      sector.name,
      {
        ...sector.attributes,
        class: `charts2-${type}-slice charts2-mark`,
      },
      {
        dataset: 0,
        point: sector.index,
        anchor: sector.tooltip,
        title: this.#sectorTitle(composition, sector.part, sector.index),
      },
    );
  }

  /**
   * Formats one composition mark through tooltip-specific precedence.
   *
   * @param {Composition} composition - Current normalized composition.
   * @param {object} part - Current labeled value.
   * @param {number} index - Stable part position.
   * @returns {string} Plain tooltip and accessibility text.
   */
  #sectorTitle(composition, part, index) {
    return tooltipContent({
      options: this.#chart.options,
      label: part.label,
      color: this.#chart.options.colors[index % this.#chart.options.colors.length],
      value: part.value,
      ...seriesContext(this.#chart, 0, index),
      suffix: ` (${Math.round(composition.shareOf(part) * FULL_PERCENTAGE)}%)`,
    });
  }
}

/**
 * Renders one aggregation chart through its family renderer.
 *
 * @param {object} rendering - Frozen chart snapshot and owned SVG surface.
 * @returns {void} Aggregation content is appended to the chart SVG.
 */
function renderAggregationChart(rendering) {
  new AggregationRenderer(rendering).render();
}

export { renderAggregationChart };
