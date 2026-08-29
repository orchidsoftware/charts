import { AGGREGATION_TYPES, ChartType, DEFAULT_COLORS, HEATMAP_COLORS } from "../support/Constants.js";
import {
  normalizeDatasets,
  normalizeHeatmapData,
  normalizeTimesheetData,
  validateChartData,
  validateSeriesScene,
} from "../support/Normalize.js";

import {
  createCompositionSelection,
  createHeatmapSelection,
  createSeriesSelection,
  createTimesheetSelection,
} from "./ChartSelection.js";
import { normalizeCartesianSource } from "./NormalizeAnnotations.js";

const DEFAULT_MAXIMUM_SLICES = 20;
const INDEPENDENT_TYPES = new Set([ChartType.SCATTER, ChartType.AXIS_MIXED, ChartType.BUBBLE]);

/**
 * Creates one immutable independently-positioned series mark snapshot.
 *
 * @param {object} source - Dataset, point, coordinates, and public index.
 * @returns {object} Frozen public point snapshot.
 */
function seriesMarkSnapshot(source) {
  const snapshot = {
    index: source.index,
    datasetIndex: source.datasetIndex,
    dataset: source.dataset.name,
    pointIndex: source.pointIndex,
    label: source.label,
    x: source.point.x,
    y: source.point.y,
  };

  if (source.point.r !== undefined) {
    snapshot.r = source.point.r;
  }

  if (source.chartType !== undefined) {
    snapshot.chartType = source.chartType;
  }

  return Object.freeze(snapshot);
}

/**
 * Owns normalized chart data and projects lifecycle selection through one
 * cohesive presenter.
 */
export default class ChartData {
  #type;
  #source;
  #datasets;
  #labels;
  #heatmap;
  #timesheet;
  #selection;

  /**
   * Captures one completely normalized family snapshot.
   *
   * @param {object} state - Type, source, collections, and effective palette.
   */
  constructor(state) {
    const { type, source, collections, selection } = state;
    const { datasets = [], labels = [], heatmap = [], timesheet = null } = collections;

    this.#type = type;
    this.#source = source;
    this.#datasets = datasets;
    this.#labels = labels;
    this.#heatmap = heatmap;
    this.#timesheet = timesheet;
    this.#selection = selection;
  }

  /**
   * Exposes normalized series datasets.
   *
   * @returns {Array<object>} Canonical series datasets.
   */
  get datasets() {
    return this.#datasets;
  }

  /**
   * Exposes normalized category or task labels.
   *
   * @returns {unknown[]} Canonical category or task labels.
   */
  get labels() {
    return this.#labels;
  }

  /**
   * Exposes normalized heatmap entries.
   *
   * @returns {Array<object>} Canonical heatmap entries.
   */
  get heatmap() {
    return this.#heatmap;
  }

  /**
   * Exposes normalized timesheet state.
   *
   * @returns {object | null} Canonical timesheet state.
   */
  get timesheet() {
    return this.#timesheet;
  }

  /**
   * Exposes the completely validated caller source.
   *
   * @returns {object} Completely validated caller source.
   */
  get source() {
    return this.#source;
  }

  /**
   * Reads one type-appropriate normalized value without exposing mutable internals.
   *
   * @param {number} index - Requested point, entry, or task index.
   * @returns {object | undefined} Defensive public data snapshot.
   */
  pointAt(index) {
    if (this.#type === ChartType.HEATMAP) {
      const point = this.#heatmap[index];

      return point && Object.freeze({ ...point, date: new Date(point.date) });
    }

    if (this.#type === ChartType.TIMESHEET) {
      const task = this.#timesheet.tasks[index];

      return task && Object.freeze({ ...task, start: new Date(task.start), end: new Date(task.end) });
    }

    if (INDEPENDENT_TYPES.has(this.#type)) {
      return this.#seriesMarkAt(index);
    }

    if (this.#datasets.every((dataset) => dataset.points[index] === undefined)) {
      return;
    }

    return Object.freeze({
      index,
      label: this.#labels[index],
      values: Object.freeze(this.#datasets.map((dataset) => dataset.points[index]?.y)),
    });
  }

  /**
   * Projects renderer metadata through the selection presenter.
   *
   * @param {SVGElement} mark - Rendered mark carrying source indices.
   * @returns {object} Frozen public selection payload.
   */
  selectionFor(mark) {
    return this.#selection.from(mark);
  }

  /**
   * Resolves a rendered mark into its stable lifecycle identity.
   *
   * @param {SVGElement} mark - Rendered mark carrying source indices.
   * @returns {string | null} Stable identity or null when ambiguous.
   */
  identityFor(mark) {
    return this.#selection.identityFor(mark);
  }

  /**
   * Reads one independently-positioned mark in renderer navigation order.
   *
   * @param {number} index - Flattened mark position.
   * @returns {object | undefined} Immutable mark snapshot.
   */
  #seriesMarkAt(index) {
    const marks = this.#datasets.flatMap((dataset, datasetIndex) =>
      dataset.points.map((point, pointIndex) => ({ dataset, datasetIndex, point, pointIndex })),
    );

    const mark = marks[index];

    if (!mark) {
      return;
    }

    return seriesMarkSnapshot({
      ...mark,
      index,
      label: this.#labels[mark.pointIndex],
      chartType: this.#type === ChartType.AXIS_MIXED ? mark.dataset.chartType : undefined,
    });
  }
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
    ([ChartType.SCATTER, ChartType.BUBBLE].includes(type)
      ? []
      : Array.from({ length: pointCount }, (_value, index) => index + 1));

  validateChartData(type, datasets, labels);

  return { source: normalizeCartesianSource(data), collections: { datasets, labels } };
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
        points: [...visible.map((entry) => entry.point), { x: visible.length, y: restValue }],
      },
    ],
    labels: [...visible.map((entry) => entry.label), "Rest"],
  };
}

/**
 * Creates a normalized Cartesian series model.
 *
 * @param {string} type - Concrete Cartesian type.
 * @param {object} data - Caller-controlled data.
 * @param {object} config - Effective chart configuration.
 * @returns {ChartData} Normalized series model.
 */
function createSeriesModel(type, data, config) {
  const colors = config.colors ?? DEFAULT_COLORS;
  const normalized = normalizeSeries(type, data, colors);
  const selection = createSeriesSelection(type, { ...normalized.collections, colors });

  return new ChartData({ type, ...normalized, selection });
}

/**
 * Creates a normalized composition or radial model.
 *
 * @param {string} type - Concrete composition type.
 * @param {object} data - Caller-controlled data.
 * @param {object} config - Effective chart configuration.
 * @returns {ChartData} Normalized composition model.
 */
function createCompositionModel(type, data, config) {
  const colors = config.colors ?? DEFAULT_COLORS;
  const normalized = normalizeSeries(type, data, colors);
  const maximum = config.maxSlices ?? DEFAULT_MAXIMUM_SLICES;

  const collections = AGGREGATION_TYPES.includes(type)
    ? aggregateComposition(normalized.collections, maximum)
    : normalized.collections;

  const selection = createCompositionSelection(type, { ...collections, colors });

  return new ChartData({ type, source: normalized.source, collections, selection });
}

/**
 * Creates a normalized heatmap model.
 *
 * @param {string} type - Heatmap chart type.
 * @param {object} data - Caller-controlled heatmap data.
 * @param {object} config - Effective chart configuration.
 * @returns {ChartData} Normalized heatmap model.
 */
function createHeatmapModel(type, data, config) {
  const colors = config.colors ?? HEATMAP_COLORS;
  const collections = { heatmap: normalizeHeatmapData(data) };
  const selection = createHeatmapSelection({ ...collections, colors });

  return new ChartData({ type, source: data, collections, selection });
}

/**
 * Creates a normalized timesheet model.
 *
 * @param {string} type - Timesheet chart type.
 * @param {object} data - Caller-controlled timesheet data.
 * @param {object} config - Effective chart configuration.
 * @returns {ChartData} Normalized timesheet model.
 */
function createTimesheetModel(type, data, config) {
  const colors = config.colors ?? DEFAULT_COLORS;
  const timesheet = normalizeTimesheetData(data, colors);
  const labels = timesheet.tasks.map((task) => task.label);
  const collections = { timesheet, labels };
  const selection = createTimesheetSelection(collections);

  return new ChartData({ type, source: data, collections, selection });
}

export { createCompositionModel, createHeatmapModel, createSeriesModel, createTimesheetModel };
