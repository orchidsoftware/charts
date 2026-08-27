import { ChartType } from "../support/Constants.js";
import {
  normalizeDatasets,
  normalizeHeatmapData,
  normalizeTimesheetData,
  validateChartData,
} from "../support/Normalize.js";

import ChartSelection from "./ChartSelection.js";

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
  #selection;

  /**
   * Creates a normalized data model for one immutable chart type.
   *
   * @param {string} type - Validated chart type that determines normalization rules.
   * @param {object} data - Initial caller-controlled data payload.
   * @throws {TypeError} When the payload violates its chart type's invariants.
   */
  constructor(type, data) {
    this.#type = type;
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
   * Replaces the payload only after complete normalization succeeds.
   *
   * @param {object} data - New payload compatible with the immutable chart type.
   * @returns {void} Normalized state is atomically replaced in place.
   * @throws {TypeError} When the replacement payload is invalid.
   */
  update(data) {
    this.#replaceData(data);
  }

  /**
   * Reads one type-appropriate normalized value without exposing mutable internals.
   *
   * @param {number} index - Requested point, heatmap entry, or timesheet task index.
   * @returns {object | undefined} Public-facing data at the requested index.
   */
  pointAt(index) {
    if (this.#type === ChartType.HEATMAP) {
      return this.#heatmap[index];
    }
    if (this.#type === ChartType.TIMESHEET) {
      return this.#timesheet.tasks[index];
    }
    return { index, label: this.#labels[index], values: this.#datasets.map((dataset) => dataset.points[index]?.y) };
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
      const timesheet = normalizeTimesheetData(data);
      this.#commitSnapshot(data, { timesheet, labels: timesheet.tasks.map((task) => task.label) });
      return;
    }
    const datasets = normalizeDatasets(data);
    const pointCount = Math.max(...datasets.map((dataset) => dataset.points.length));
    const labels = data.labels ?? Array.from({ length: pointCount }, (_, index) => String(index + 1));
    validateChartData(this.#type, datasets, labels);
    this.#commitSnapshot(data, { datasets, labels });
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
    this.#selection = new ChartSelection({ type: this.#type, datasets, labels, heatmap, timesheet });
  }
}
