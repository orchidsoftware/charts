import "./styles.css";
import Chart from "./core/Chart.js";

/**
 * Creates and immediately renders a chart inside an existing DOM element.
 * The returned instance owns its generated markup and provides the lifecycle
 * methods used to update, export, resize, or destroy the visualization.
 *
 * @param {string | Element} parent - CSS selector or element that will host the chart.
 * @param {import("./index.js").ChartOptions} options - Chart type, data, presentation, and interaction options.
 * @returns {import("./index.js").Chart} Rendered chart instance controlled by the caller.
 * @throws {TypeError} When the parent cannot be resolved or the supplied chart data is invalid.
 */
export function createChart(parent, options) {
  return new Chart(parent, options);
}
