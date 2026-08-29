import { renderAggregationChart } from "../renderers/AggregationRenderer.js";
import {
  renderBarChart,
  renderLineChart,
  renderMixedChart,
  renderPointChart,
} from "../renderers/CartesianRenderer.js";
import { renderHeatmapChart } from "../renderers/HeatmapRenderer.js";
import { renderPolarAreaChart } from "../renderers/PolarAreaRenderer.js";
import { renderRadarChart } from "../renderers/RadarRenderer.js";
import { renderTimesheetChart } from "../renderers/TimesheetRenderer.js";

import { LineChartBuilder } from "./Builder.js";
import { BarChartBuilder, MixedChartBuilder, ScatterChartBuilder } from "./CartesianBuilders.js";
import Chart from "./Chart.js";
import {
  createCompositionModel,
  createHeatmapModel,
  createSeriesModel,
  createTimesheetModel,
} from "./ChartData.js";
import {
  PercentageChartBuilder,
  PolarAreaChartBuilder,
  RadarChartBuilder,
  SectorChartBuilder,
} from "./CompositionBuilders.js";
import { HeatmapChartBuilder, TimesheetChartBuilder } from "./TemporalBuilders.js";

/**
 * Creates one immutable chart definition and binds its private implementation.
 *
 * @param {typeof LineChartBuilder} Builder - Type-specific fluent builder constructor.
 * @param {string} type - Immutable chart type.
 * @param {{createModel: (type: string, data: object, config: object) => import("./ChartData.js").default, render: (rendering: object) => void}} implementation - Family model and renderer functions.
 * @returns {Readonly<{make(parent: string | Element): object}>} Frozen public definition.
 */
function chartDefinition(Builder, type, implementation) {
  if (typeof implementation?.createModel !== "function" || typeof implementation?.render !== "function") {
    throw new TypeError("Chart implementation requires createModel and render functions");
  }

  const boundImplementation = Object.freeze({ ...implementation });
  const mount = (parent, options) => new Chart(parent, options, boundImplementation);

  return Object.freeze({
    /**
     * Starts detached authoring for one chart host.
     *
     * @param {string | Element} parent - Deferred selector or host element.
     * @returns {object} Fresh type-specific single-use builder.
     */
    make(parent) {
      return new Builder(parent, type, mount);
    },
  });
}

const LineChart = /*#__PURE__*/ chartDefinition(LineChartBuilder, "line", {
  createModel: createSeriesModel,
  render: renderLineChart,
});

const BarChart = /*#__PURE__*/ chartDefinition(BarChartBuilder, "bar", {
  createModel: createSeriesModel,
  render: renderBarChart,
});

const ScatterChart = /*#__PURE__*/ chartDefinition(ScatterChartBuilder, "scatter", {
  createModel: createSeriesModel,
  render: renderPointChart,
});

const MixedChart = /*#__PURE__*/ chartDefinition(MixedChartBuilder, "mixed", {
  createModel: createSeriesModel,
  render: renderMixedChart,
});

const BubbleChart = /*#__PURE__*/ chartDefinition(ScatterChartBuilder, "bubble", {
  createModel: createSeriesModel,
  render: renderPointChart,
});

const PieChart = /*#__PURE__*/ chartDefinition(SectorChartBuilder, "pie", {
  createModel: createCompositionModel,
  render: renderAggregationChart,
});

const DonutChart = /*#__PURE__*/ chartDefinition(SectorChartBuilder, "donut", {
  createModel: createCompositionModel,
  render: renderAggregationChart,
});

const PercentageChart = /*#__PURE__*/ chartDefinition(PercentageChartBuilder, "percentage", {
  createModel: createCompositionModel,
  render: renderAggregationChart,
});

const RadarChart = /*#__PURE__*/ chartDefinition(RadarChartBuilder, "radar", {
  createModel: createCompositionModel,
  render: renderRadarChart,
});

const PolarAreaChart = /*#__PURE__*/ chartDefinition(PolarAreaChartBuilder, "polar-area", {
  createModel: createCompositionModel,
  render: renderPolarAreaChart,
});

const HeatmapChart = /*#__PURE__*/ chartDefinition(HeatmapChartBuilder, "heatmap", {
  createModel: createHeatmapModel,
  render: renderHeatmapChart,
});

const TimesheetChart = /*#__PURE__*/ chartDefinition(TimesheetChartBuilder, "timesheet", {
  createModel: createTimesheetModel,
  render: renderTimesheetChart,
});

export {
  BarChart,
  BubbleChart,
  DonutChart,
  HeatmapChart,
  LineChart,
  MixedChart,
  PercentageChart,
  PieChart,
  PolarAreaChart,
  RadarChart,
  ScatterChart,
  TimesheetChart,
  chartDefinition,
};
