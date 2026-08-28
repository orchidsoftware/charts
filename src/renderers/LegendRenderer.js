import { SERIES_SWATCH_DIAMETER } from "../support/Constants.js";
import { svg, labelElement } from "../support/Dom.js";
import { legendLayout } from "../support/Presentation.js";

const DEFAULT_LEGEND_BASELINE = 16;

/**
 * Renders shared series and item legends from measured layout policies.
 */
export default class LegendRenderer {
  #chart;
  #surface;

  /**
   * Creates a renderer bound to one frozen render snapshot.
   *
   * @param {object} rendering - Collaborators for one legend pass.
   * @param {object} rendering.chart - Frozen chart data and options.
   * @param {import("./SvgSurface.js").default} rendering.surface - Owned SVG drawing surface.
   */
  constructor({ chart, surface }) {
    this.#chart = chart;
    this.#surface = surface;
  }

  /**
   * Calculates and renders a wrapped legend for datasets that expose series.
   *
   * @returns {void} Legend content is appended when enabled and meaningful.
   */
  render() {
    if (!this.#chart.options.showLegend || this.#chart.datasets.length < 2) {
      return;
    }

    this.renderItems(
      this.#chart.datasets.map((dataset) => ({ label: dataset.name, color: dataset.color })),
      DEFAULT_LEGEND_BASELINE,
    );
  }

  /**
   * Renders precomputed legend entries at a shared first-row baseline.
   *
   * @param {Array<{label: string, color: string}>} items - Ordered series labels and colors.
   * @param {number} baseline - Vertical baseline of the first legend row.
   * @returns {void} Positioned legend groups are appended to the chart SVG.
   */
  renderItems(items, baseline) {
    const { labelOffset, positions } = legendLayout(this.#chart.options.width, items);
    const group = svg("g", { class: "charts2-legend-group", "aria-label": "Legend" });

    for (const [index, item] of items.entries()) {
      const { labelMaxWidth, x, yOffset } = positions[index];
      const y = baseline + yOffset;
      group.append(
        svg("circle", {
          cx: x + SERIES_SWATCH_DIAMETER / 2,
          cy: y - SERIES_SWATCH_DIAMETER / 2,
          r: SERIES_SWATCH_DIAMETER / 2,
          fill: item.color,
          class: "charts2-legend-swatch charts2-series-swatch",
          "aria-hidden": "true",
        }),
      );
      group.append(
        labelElement({
          value: item.label,
          attributes: { x: x + labelOffset, y, class: "charts2-legend" },
          measurement: { maxWidth: labelMaxWidth },
        }),
      );
    }

    this.#surface.append(group);
  }
}
