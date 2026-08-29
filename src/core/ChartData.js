import { AGGREGATION_TYPES, ChartType, DEFAULT_COLORS, HEATMAP_COLORS } from "../support/Constants.js";
import {
  normalizeDatasets,
  normalizeHeatmapData,
  normalizeTimesheetData,
  validateChartData,
  validateSeriesScene,
} from "../support/Normalize.js";

import ChartSelection from "./ChartSelection.js";
import { normalizeCartesianSource } from "./NormalizeAnnotations.js";

const DEFAULT_MAXIMUM_SLICES = 20;
const INDEPENDENT_TYPES = new Set([ChartType.SCATTER, ChartType.AXIS_MIXED, ChartType.BUBBLE]);

/**
 * Names one immutable independently-positioned series mark snapshot.
 */
class SeriesMarkSnapshot {
  /**
   * Copies one normalized point and its dataset identity.
   *
   * @param {object} source - Dataset, point, coordinates, and public index.
   */
  constructor(source) {
    this.index = source.index;
    this.datasetIndex = source.datasetIndex;
    this.dataset = source.dataset.name;
    this.pointIndex = source.pointIndex;
    this.label = source.label;
    this.x = source.point.x;
    this.y = source.point.y;
    if (source.point.r !== undefined) {
      this.r = source.point.r;
    }

    if (source.chartType !== undefined) {
      this.chartType = source.chartType;
    }

    Object.freeze(this);
  }
}

/**
 * Owns normalized chart data and atomically replaces model snapshots. Public
 * selection projection is delegated so storage and event payload rules evolve
 * independently.
 */
export default class ChartData {
  #type;
  #source;
  #datasets = [];
  #labels = [];
  #heatmap = [];
  #timesheet = null;
  #colors;
  #maxSlices;
  #selection;

  /**
   * Creates a normalized data model for one immutable chart type.
   *
   * @param {string} type - Validated chart type that determines normalization rules.
   * @param {object} data - Initial caller-controlled data payload.
   * @param {object} [config={}] - Data normalization configuration.
   * @param {Array<string> | undefined} config.colors - Effective categorical or intensity palette.
   * @param {number | undefined} config.maxSlices - Optional composition item limit.
   * @throws {TypeError} When the payload violates its chart type's invariants.
   */
  constructor(type, data, config = {}) {
    this.#type = type;
    this.#colors = config.colors ?? (type === ChartType.HEATMAP ? HEATMAP_COLORS : DEFAULT_COLORS);
    this.#maxSlices = config.maxSlices ?? DEFAULT_MAXIMUM_SLICES;
    this.#replaceData(data);
  }

  /**
   * Exposes normalized series to a synchronous renderer snapshot.
   *
   * @returns {Array<object>} Canonical datasets, or an empty array for non-series charts.
   */
  get datasets() {
    return this.#datasets;
  }

  /**
   * Exposes normalized category labels to a synchronous renderer snapshot.
   *
   * @returns {unknown[]} Labels aligned with datasets or timesheet tasks.
   */
  get labels() {
    return this.#labels;
  }

  /**
   * Exposes sorted heatmap entries to a synchronous renderer snapshot.
   *
   * @returns {Array<object>} Canonical heatmap entries, or an empty array for other charts.
   */
  get heatmap() {
    return this.#heatmap;
  }

  /**
   * Exposes normalized timesheet bounds and tasks to a synchronous renderer snapshot.
   *
   * @returns {object | null} Canonical timesheet data, or null for other charts.
   */
  get timesheet() {
    return this.#timesheet;
  }

  /**
   * Exposes the original payload only to renderers that consume annotations.
   *
   * @returns {object} Latest completely validated caller payload.
   */
  get source() {
    return this.#source;
  }

  /**
   * Reads one type-appropriate normalized value without exposing mutable internals.
   *
   * @param {number} index - Requested point, heatmap entry, or timesheet task index.
   * @returns {object | undefined} Public-facing data at the requested index.
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
   * Reads one independently-positioned mark in renderer navigation order.
   *
   * @param {number} index - Flattened mark position.
   * @returns {SeriesMarkSnapshot | undefined} Immutable mark snapshot.
   */
  #seriesMarkAt(index) {
    const datasets = this.#orderedIndependentDatasets();

    const marks = datasets.flatMap(({ dataset, datasetIndex }) =>
      dataset.points.map((point, pointIndex) => ({ dataset, datasetIndex, point, pointIndex })),
    );

    const mark = marks[index];

    if (!mark) {
      return;
    }

    return new SeriesMarkSnapshot({
      ...mark,
      index,
      label: this.#labels[mark.pointIndex],
      chartType: this.#type === ChartType.AXIS_MIXED ? mark.dataset.chartType : undefined,
    });
  }

  /**
   * Orders mixed datasets by render layer while retaining stable source indices.
   *
   * @returns {Array<object>} Dataset entries in keyboard navigation order.
   */
  #orderedIndependentDatasets() {
    return this.#datasets.map((dataset, datasetIndex) => ({ dataset, datasetIndex }));
  }

  /**
   * Projects renderer metadata through the dedicated selection policy object.
   *
   * @param {SVGElement} mark - Rendered mark carrying dataset and point indices.
   * @returns {object} Payload suitable for callbacks and `data-select` events.
   */
  selectionFor(mark) {
    return this.#selection.from(mark);
  }

  /**
   * Resolves a mark into its type-specific normalized lifecycle identity.
   *
   * @param {SVGElement} mark - Rendered mark carrying dataset and point indices.
   * @returns {string | null} Stable identity or null when it cannot be preserved.
   */
  identityFor(mark) {
    return this.#selection.identityFor(mark);
  }

  /**
   * Normalizes one payload into temporary values before committing model state.
   *
   * @param {object} data - Caller-controlled chart data.
   * @returns {void} Every derived field is replaced after validation succeeds.
   */
  #replaceData(data) {
    if (this.#type === ChartType.HEATMAP) {
      const heatmap = normalizeHeatmapData(data);
      this.#commitSnapshot(data, { heatmap });

      return;
    }

    if (this.#type === ChartType.TIMESHEET) {
      const timesheet = normalizeTimesheetData(data, this.#colors);
      this.#commitSnapshot(data, { timesheet, labels: timesheet.tasks.map((task) => task.label) });

      return;
    }

    validateSeriesScene(this.#type, data);

    const datasets = normalizeDatasets(data, this.#colors, this.#type);

    if (data.labels !== undefined && !Array.isArray(data.labels)) {
      throw new TypeError("Chart labels must be an array");
    }

    if (data.labels?.some((label) => !this.#isNormalizedLabel(label))) {
      throw new TypeError("Chart labels must contain non-empty strings or generated numbers");
    }

    const pointCount = Math.max(...datasets.map((dataset) => dataset.points.length));

    const labels =
      data.labels ??
      ([ChartType.SCATTER, ChartType.BUBBLE].includes(this.#type)
        ? []
        : Array.from({ length: pointCount }, (_value, index) => index + 1));

    validateChartData(this.#type, datasets, labels);
    const composition = this.#compositionCollections(datasets, labels);
    this.#commitSnapshot(normalizeCartesianSource(data), composition);
  }

  /**
   * Accepts public labels and builder-generated numeric labels.
   *
   * @param {unknown} label - Candidate normalized label.
   * @returns {boolean} Whether the label is valid for the internal scene.
   */
  #isNormalizedLabel(label) {
    if (typeof label === "number") {
      return Number.isFinite(label);
    }

    return typeof label === "string" && label.trim() !== "";
  }

  /**
   * Applies stable maximum-slice aggregation to eligible composition models.
   *
   * @param {Array<object>} datasets - Validated normalized datasets.
   * @param {unknown[]} labels - Validated labels aligned with the first dataset.
   * @returns {{datasets: Array<object>, labels: unknown[]}} Render and lifecycle collections.
   */
  #compositionCollections(datasets, labels) {
    if (!AGGREGATION_TYPES.includes(this.#type) || labels.length <= this.#maxSlices) {
      return { datasets, labels };
    }

    const entries = labels
      .map((label, index) => ({ label, point: datasets[0].points[index] }))
      .toSorted((left, right) => right.point.y - left.point.y);

    const visible = entries.slice(0, this.#maxSlices - 1);
    const remainder = entries.slice(this.#maxSlices - 1);
    const restValue = remainder.reduce((sum, entry) => sum + entry.point.y, 0);
    const points = [...visible.map((entry) => entry.point), { x: visible.length, y: restValue }];

    return {
      datasets: [{ ...datasets[0], points }],
      labels: [...visible.map((entry) => entry.label), "Rest"],
    };
  }

  /**
   * Commits one completely validated normalized snapshot.
   *
   * @param {object} source - Original caller payload retained for lifecycle consistency.
   * @param {object} normalized - Type-specific normalized collections.
   * @param {Array<object>} [normalized.datasets=[]] - Canonical series datasets.
   * @param {unknown[]} [normalized.labels=[]] - Canonical category or task labels.
   * @param {Array<object>} [normalized.heatmap=[]] - Canonical heatmap entries.
   * @param {object | null} [normalized.timesheet=null] - Canonical timesheet model.
   * @returns {void} Previous model state is replaced in place.
   */
  #commitSnapshot(source, { datasets = [], labels = [], heatmap = [], timesheet = null }) {
    this.#source = source;
    this.#datasets = datasets;
    this.#labels = labels;
    this.#heatmap = heatmap;
    this.#timesheet = timesheet;
    this.#selection = new ChartSelection(this.#type, {
      datasets,
      labels,
      heatmap,
      timesheet,
      colors: this.#colors,
    });
  }
}
