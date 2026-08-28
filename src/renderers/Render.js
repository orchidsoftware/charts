import { AGGREGATION_TYPES, CARTESIAN_TYPES, ChartType } from "../support/Constants.js";

import AggregationRenderer from "./AggregationRenderer.js";
import CartesianRenderer from "./CartesianRenderer.js";
import HeatmapRenderer from "./HeatmapRenderer.js";
import LegendRenderer from "./LegendRenderer.js";
import PolarAreaRenderer from "./PolarAreaRenderer.js";
import RadarRenderer from "./RadarRenderer.js";
import SvgSurface from "./SvgSurface.js";
import TimesheetRenderer from "./TimesheetRenderer.js";

const RENDERERS = Object.freeze({
  ...Object.fromEntries(CARTESIAN_TYPES.map((type) => [type, CartesianRenderer])),
  ...Object.fromEntries(AGGREGATION_TYPES.map((type) => [type, AggregationRenderer])),
  [ChartType.RADAR]: RadarRenderer,
  [ChartType.POLAR_AREA]: PolarAreaRenderer,
  [ChartType.HEATMAP]: HeatmapRenderer,
  [ChartType.TIMESHEET]: TimesheetRenderer,
});

/**
 * Renders one validated snapshot through its chart-family strategy.
 *
 * @param {object} snapshot - Validated chart state and owned SVG surface.
 * @param {string} type - Validated chart type selecting a renderer class.
 * @returns {void} Chart content and any shared series legend are appended.
 * @throws {TypeError} When no renderer class is registered for the type.
 */
function renderChart(snapshot, type) {
  const { element, ...chartState } = snapshot;
  const chart = Object.freeze(chartState);
  const surface = new SvgSurface(element);
  const Renderer = RENDERERS[type];

  if (!Renderer) {
    throw new TypeError(`No render strategy for chart type: ${type}`);
  }

  new Renderer({ chart, surface }).render();
  if (![ChartType.HEATMAP, ChartType.TIMESHEET, ...AGGREGATION_TYPES].includes(type)) {
    new LegendRenderer({ chart, surface }).render();
  }
}

export { renderChart };
