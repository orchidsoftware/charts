import { renderLegend } from "../LegendRendering.js";

import CartesianAnnotationsRenderer from "./CartesianAnnotationsRenderer.js";
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
 * Coordinates layout, axes, series, inspection, and legend for one render pass.
 *
 * @param {object} snapshot - Chart data and owned SVG surface.
 * @param {object} snapshot.chart - Normalized chart data.
 * @param {object} snapshot.surface - Owned SVG surface.
 * @param {(rendering: object) => void} renderSeries - Family series renderer.
 * @returns {object} Effective chart dimensions after intrinsic reference label layout.
 */
function renderCartesianChart({ chart, surface }, renderSeries) {
  const layout = new CartesianLayout(chart);
  const rendering = { chart, layout, surface, visuals: [] };
  const axes = new CartesianAxesRenderer(rendering);
  const annotations = new CartesianAnnotationsRenderer(rendering);
  axes.renderBackground();
  annotations.renderBackground();
  axes.renderAxis();
  renderSeries(rendering);
  annotations.renderForeground();
  axes.renderForeground();
  const interactive = chart.options.tooltip || typeof chart.options.onSelect === "function";

  if (layout.usesInspector && interactive) {
    new CartesianInspectorRenderer(rendering).render();
  }

  renderLegend(rendering, layout.content);

  return layout.dimensions;
}

/**
 * Renders one line chart.
 *
 * @param {object} rendering - Frozen chart snapshot and owned SVG surface.
 * @returns {object} Effective chart dimensions.
 */
function renderLineChart(rendering) {
  return renderCartesianChart(rendering, renderLineSeries);
}

/**
 * Renders one bar chart.
 *
 * @param {object} rendering - Frozen chart snapshot and owned SVG surface.
 * @returns {object} Effective chart dimensions.
 */
function renderBarChart(rendering) {
  return renderCartesianChart(rendering, renderBarSeries);
}

/**
 * Renders one point chart.
 *
 * @param {object} rendering - Frozen chart snapshot and owned SVG surface.
 * @returns {object} Effective chart dimensions.
 */
function renderPointChart(rendering) {
  return renderCartesianChart(rendering, renderPointSeries);
}

/**
 * Renders one mixed chart.
 *
 * @param {object} rendering - Frozen chart snapshot and owned SVG surface.
 * @returns {object} Effective chart dimensions.
 */
function renderMixedChart(rendering) {
  return renderCartesianChart(rendering, renderMixedSeries);
}

export { renderBarChart, renderLineChart, renderMixedChart, renderPointChart };
