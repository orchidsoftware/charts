import LegendRenderer from "../LegendRenderer.js";

import CartesianAxesRenderer from "./CartesianAxesRenderer.js";
import CartesianInspectorRenderer from "./CartesianInspectorRenderer.js";
import CartesianLayout from "./CartesianLayout.js";
import {
  renderBarSeries,
  renderLineSeries,
  renderMixedSeries,
  renderPointSeries,
} from "./CartesianSeriesRendering.js";

/**
 * Coordinates one Cartesian pass across layout, axes, series, and inspection.
 */
class CartesianRenderer {
  #chart;
  #surface;
  #renderSeries;

  /**
   * Captures the chart snapshot and its owned SVG surface.
   *
   * @param {object} rendering - Collaborators for one Cartesian pass.
   * @param {object} rendering.chart - Frozen Cartesian data and options.
   * @param {import("../SvgSurface.js").default} rendering.surface - Owned SVG drawing surface.
   * @param {(rendering: object) => void} renderSeries - Family-specific series drawing function.
   */
  constructor({ chart, surface }, renderSeries) {
    this.#chart = chart;
    this.#surface = surface;
    this.#renderSeries = renderSeries;
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
    this.#renderSeries(rendering);
    axes.renderForeground();
    const interactive = this.#chart.options.tooltip || typeof this.#chart.options.onSelect === "function";

    if (layout.usesInspector && interactive) {
      new CartesianInspectorRenderer(rendering).render();
    }
  }
}

/**
 * Renders one Cartesian chart and its optional series legend.
 *
 * @param {object} rendering - Frozen chart snapshot and owned SVG surface.
 * @param {(rendering: object) => void} renderSeries - Family-specific series drawing function.
 * @returns {void} Cartesian content is appended to the chart SVG.
 */
function renderCartesianChart(rendering, renderSeries) {
  new CartesianRenderer(rendering, renderSeries).render();
  new LegendRenderer(rendering).render();
}

/**
 * Renders one line chart.
 *
 * @param {object} rendering - Frozen chart snapshot and owned SVG surface.
 * @returns {void} Line content is appended to the chart SVG.
 */
function renderLineChart(rendering) {
  renderCartesianChart(rendering, renderLineSeries);
}

/**
 * Renders one bar chart.
 *
 * @param {object} rendering - Frozen chart snapshot and owned SVG surface.
 * @returns {void} Bar content is appended to the chart SVG.
 */
function renderBarChart(rendering) {
  renderCartesianChart(rendering, renderBarSeries);
}

/**
 * Renders one point chart.
 *
 * @param {object} rendering - Frozen chart snapshot and owned SVG surface.
 * @returns {void} Point content is appended to the chart SVG.
 */
function renderPointChart(rendering) {
  renderCartesianChart(rendering, renderPointSeries);
}

/**
 * Renders one mixed chart.
 *
 * @param {object} rendering - Frozen chart snapshot and owned SVG surface.
 * @returns {void} Mixed content is appended to the chart SVG.
 */
function renderMixedChart(rendering) {
  renderCartesianChart(rendering, renderMixedSeries);
}

export { renderBarChart, renderLineChart, renderMixedChart, renderPointChart };
