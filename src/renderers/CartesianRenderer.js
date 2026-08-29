import CartesianAxesRenderer from "./CartesianAxesRenderer.js";
import CartesianInspectorRenderer from "./CartesianInspectorRenderer.js";
import CartesianLayout from "./CartesianLayout.js";
import CartesianSeriesRenderer from "./CartesianSeriesRenderer.js";

/**
 * Coordinates one Cartesian pass across layout, axes, series, and inspection.
 */
export default class CartesianRenderer {
  #chart;
  #surface;

  /**
   * Captures the chart snapshot and its owned SVG surface.
   *
   * @param {object} rendering - Collaborators for one Cartesian pass.
   * @param {object} rendering.chart - Frozen Cartesian data and options.
   * @param {import("./SvgSurface.js").default} rendering.surface - Owned SVG drawing surface.
   */
  constructor({ chart, surface }) {
    this.#chart = chart;
    this.#surface = surface;
  }

  /**
   * Renders background, data marks, foreground, and optional category targets.
   *
   * @returns {void} Complete Cartesian content is appended to the chart SVG.
   */
  render() {
    const layout = new CartesianLayout(this.#chart);
    const rendering = { chart: this.#chart, layout, surface: this.#surface };
    const axes = new CartesianAxesRenderer(rendering);
    axes.renderBackground();
    new CartesianSeriesRenderer(rendering).render();
    axes.renderForeground();
    const interactive = this.#chart.options.tooltip || typeof this.#chart.options.onSelect === "function";

    if (layout.usesInspector && interactive) {
      new CartesianInspectorRenderer(rendering).render();
    }
  }
}
