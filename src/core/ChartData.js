import { AGGREGATION_TYPES, ChartType } from "../support/Constants.js";
import { normalizeHeatmapData } from "../support/data/HeatmapData.js";
import { normalizeDatasets, validateChartData, validateSeriesScene } from "../support/data/SeriesData.js";
import { normalizeTimesheetData } from "../support/data/TimesheetData.js";
import { chartColors, heatmapPalette } from "../support/Palette.js";

import { categoryPointAt, heatmapPointAt, independentPointAt, timesheetPointAt } from "./ChartPoints.js";
import {
  createCompositionSelection,
  createHeatmapSelection,
  createSeriesSelection,
  createTimesheetSelection,
} from "./ChartSelection.js";
import { normalizeCartesianSource } from "./NormalizeAnnotations.js";

const DEFAULT_MAXIMUM_SLICES = 20;

/**
 * Combines normalized family collections with explicit public projections.
 *
 * @param {object} source - Validated caller data.
 * @param {object} collections - Only the collections belonging to this family.
 * @param {object} behavior - Family point and selection projections.
 * @returns {object} Immutable model interface used by the chart lifecycle.
 */
function chartModel(source, collections, behavior) {
  return Object.freeze({
    source,
    ...collections,
    pointAt: behavior.pointAt,
    selectionFor: (mark) => behavior.selection.from(mark),
    identityFor: (mark) => behavior.selection.identityFor(mark),
  });
}

/**
 * Accepts public labels and builder-generated numeric labels.
 *
 * @param {unknown} label - Candidate normalized label.
 * @returns {boolean} Whether the label is valid for the internal scene.
 */
function isNormalizedLabel(label) {
  if (typeof label === "number") {
    return Number.isFinite(label);
  }

  return typeof label === "string" && label.trim() !== "";
}

/**
 * Normalizes the shared series grammar without selecting another family.
 *
 * @param {string} type - Concrete series or composition type.
 * @param {object} data - Caller-controlled data.
 * @param {string[]} colors - Effective palette.
 * @returns {{source: object, collections: object}} Validated series snapshot.
 */
function normalizeSeries(type, data, colors) {
  validateSeriesScene(type, data);
  const datasets = normalizeDatasets(data, colors, type);

  if (data.labels !== undefined && !Array.isArray(data.labels)) {
    throw new TypeError("Chart labels must be an array");
  }

  if (data.labels?.some((label) => !isNormalizedLabel(label))) {
    throw new TypeError("Chart labels must contain non-empty strings or generated numbers");
  }

  const pointCount = Math.max(...datasets.map((dataset) => dataset.points.length));

  const labels =
    data.labels ??
    ([
      ChartType.SCATTER,
      ChartType.BUBBLE,
    ].includes(type)
      ? []
      : Array.from({ length: pointCount }, (_value, index) => index + 1));

  validateChartData(type, datasets, labels);

  return {
    source: normalizeCartesianSource(data),
    collections: { datasets, labels },
  };
}

/**
 * Aggregates the smallest composition slices behind one stable Rest item.
 *
 * @param {object} collections - Validated datasets and aligned labels.
 * @param {number} maximum - Maximum visible composition item count.
 * @returns {object} Original or aggregated collections.
 */
function aggregateComposition(collections, maximum) {
  const { datasets, labels } = collections;

  if (labels.length <= maximum) {
    return collections;
  }

  const entries = labels
    .map((label, index) => ({ label, point: datasets[0].points[index] }))
    .toSorted((left, right) => right.point.y - left.point.y);

  const visible = entries.slice(0, maximum - 1);
  const remainder = entries.slice(maximum - 1);
  let restValue = 0;

  for (const entry of remainder) {
    restValue += entry.point.y;
  }

  return {
    datasets: [
      {
        ...datasets[0],
        points: [
          ...visible.map((entry) => entry.point),
          { x: visible.length, y: restValue },
        ],
      },
    ],
    labels: [
      ...visible.map((entry) => entry.label),
      "Rest",
    ],
  };
}

/**
 * Creates a normalized Cartesian series model.
 *
 * @param {string} type - Concrete Cartesian type.
 * @param {object} data - Caller-controlled data.
 * @param {object} config - Effective chart configuration.
 * @returns {object} Normalized series model.
 */
function createSeriesModel(type, data, config) {
  const colors = chartColors(type, config.colors);
  const normalized = normalizeSeries(type, data, colors);
  const selection = createSeriesSelection(type, { ...normalized.collections, colors });

  const isIndependent = [
    ChartType.SCATTER,
    ChartType.BUBBLE,
    ChartType.AXIS_MIXED,
  ].includes(type);

  const pointAt = isIndependent
    ? (index) => independentPointAt(type, normalized.collections, index)
    : (index) => categoryPointAt(normalized.collections, index);

  return chartModel(normalized.source, normalized.collections, { selection, pointAt });
}

/**
 * Creates a normalized composition or radial model.
 *
 * @param {string} type - Concrete composition type.
 * @param {object} data - Caller-controlled data.
 * @param {object} config - Effective chart configuration.
 * @returns {object} Normalized composition model.
 */
function createCompositionModel(type, data, config) {
  const colors = chartColors(type, config.colors);
  const normalized = normalizeSeries(type, data, colors);
  const maximum = config.maxSlices ?? DEFAULT_MAXIMUM_SLICES;

  const collections = AGGREGATION_TYPES.includes(type)
    ? aggregateComposition(normalized.collections, maximum)
    : normalized.collections;

  const selection = createCompositionSelection(type, { ...collections, colors });

  return chartModel(normalized.source, collections, {
    selection,
    pointAt: (index) => categoryPointAt(collections, index),
  });
}

/**
 * Creates a normalized heatmap model.
 *
 * @param {string} type - Heatmap chart type.
 * @param {object} data - Caller-controlled heatmap data.
 * @param {object} config - Effective chart configuration.
 * @returns {object} Normalized heatmap model.
 */
function createHeatmapModel(type, data, config) {
  const colors = chartColors(type, config.colors);
  const heatmap = normalizeHeatmapData(data);
  const collections = { heatmap, palette: heatmapPalette(heatmap, colors) };
  const selection = createHeatmapSelection({ ...collections, colors });

  return chartModel(data, collections, {
    selection,
    pointAt: (index) => heatmapPointAt(collections.heatmap, index),
  });
}

/**
 * Creates a normalized timesheet model.
 *
 * @param {string} type - Timesheet chart type.
 * @param {object} data - Caller-controlled timesheet data.
 * @param {object} config - Effective chart configuration.
 * @returns {object} Normalized timesheet model.
 */
function createTimesheetModel(type, data, config) {
  const colors = chartColors(type, config.colors);
  const timesheet = normalizeTimesheetData(data, colors);
  const labels = timesheet.tasks.map((task) => task.label);
  const collections = { timesheet, labels };
  const selection = createTimesheetSelection(collections);

  return chartModel(data, collections, {
    selection,
    pointAt: (index) => timesheetPointAt(timesheet.tasks, index),
  });
}

export { createCompositionModel, createHeatmapModel, createSeriesModel, createTimesheetModel };
