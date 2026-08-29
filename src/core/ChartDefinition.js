import { LineChartBuilder } from "./Builder.js";
import {
  BarChartBuilder,
  BubbleChartBuilder,
  MixedChartBuilder,
  ScatterChartBuilder,
} from "./CartesianBuilders.js";
import {
  DonutChartBuilder,
  PercentageChartBuilder,
  PieChartBuilder,
  PolarAreaChartBuilder,
  RadarChartBuilder,
} from "./CompositionBuilders.js";
import { HeatmapChartBuilder, TimesheetChartBuilder } from "./TemporalBuilders.js";

/**
 * Creates one immutable chart definition with no constructor surface.
 *
 * @param {(parent: string | Element) => object} createBuilder - Factory for the type-specific fluent builder.
 * @returns {Readonly<{make(parent: string | Element): object}>} Frozen public definition.
 */
function chartDefinition(createBuilder) {
  return Object.freeze({
    /**
     * Starts detached authoring for one chart host.
     *
     * @param {string | Element} parent - Deferred selector or host element.
     * @returns {object} Fresh type-specific single-use builder.
     */
    make(parent) {
      return createBuilder(parent);
    },
  });
}

const LineChart = chartDefinition((parent) => new LineChartBuilder(parent, "line"));
const BarChart = chartDefinition((parent) => new BarChartBuilder(parent, "bar"));
const ScatterChart = chartDefinition((parent) => new ScatterChartBuilder(parent, "scatter"));
const MixedChart = chartDefinition((parent) => new MixedChartBuilder(parent, "mixed"));
const BubbleChart = chartDefinition((parent) => new BubbleChartBuilder(parent, "bubble"));
const PieChart = chartDefinition((parent) => new PieChartBuilder(parent, "pie"));
const DonutChart = chartDefinition((parent) => new DonutChartBuilder(parent, "donut"));
const PercentageChart = chartDefinition((parent) => new PercentageChartBuilder(parent, "percentage"));
const RadarChart = chartDefinition((parent) => new RadarChartBuilder(parent, "radar"));
const PolarAreaChart = chartDefinition((parent) => new PolarAreaChartBuilder(parent, "polar-area"));
const HeatmapChart = chartDefinition((parent) => new HeatmapChartBuilder(parent, "heatmap"));
const TimesheetChart = chartDefinition((parent) => new TimesheetChartBuilder(parent, "timesheet"));

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
