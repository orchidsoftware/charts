import { AGGREGATION_TYPES, ChartType } from "../support/Constants.js";

/**
 * Translates renderer mark metadata into stable public selection payloads.
 * It reads one normalized model snapshot and owns no update or rendering state.
 */
export default class ChartSelection {
  #type;
  #datasets;
  #labels;
  #heatmap;
  #timesheet;

  /**
   * Captures the normalized collections required to resolve one selection.
   *
   * @param {object} model - Current normalized chart model snapshot.
   * @param {string} model.type - Immutable chart type controlling payload shape.
   * @param {Array<object>} model.datasets - Normalized series datasets.
   * @param {unknown[]} model.labels - Normalized category labels.
   * @param {Array<object>} model.heatmap - Normalized heatmap entries.
   * @param {object | null} model.timesheet - Normalized timesheet state.
   */
  constructor({ type, datasets, labels, heatmap, timesheet }) {
    this.#type = type;
    this.#datasets = datasets;
    this.#labels = labels;
    this.#heatmap = heatmap;
    this.#timesheet = timesheet;
  }

  /**
   * Resolves one renderer mark into its chart-family-specific public payload.
   *
   * @param {SVGElement} mark - Rendered mark carrying dataset and point indices.
   * @returns {object} Payload suitable for callbacks and `data-select` events.
   */
  from(mark) {
    const pointIndex = Number(mark.dataset.pointIndex);
    const datasetIndex = Number(mark.dataset.datasetIndex);
    if (this.#type === ChartType.HEATMAP) {
      return this.#selectHeatmap(mark, pointIndex);
    }
    if (this.#type === ChartType.TIMESHEET) {
      return this.#selectTimesheet(pointIndex);
    }
    if (datasetIndex === -1) {
      return this.#selectCategory(pointIndex);
    }
    if (this.#type === ChartType.RADAR) {
      return this.#selectRadarDataset(datasetIndex);
    }
    if (AGGREGATION_TYPES.includes(this.#type) || this.#type === ChartType.POLAR_AREA) {
      return this.#selectAggregation(pointIndex);
    }
    return this.#selectSeriesPoint(datasetIndex, pointIndex);
  }

  /**
   * Builds one normalized series point for a public selection payload.
   *
   * @param {object} selection - Coordinates identifying one normalized point.
   * @param {object | undefined} selection.dataset - Source dataset containing the requested point.
   * @param {number} selection.datasetIndex - Zero-based dataset position.
   * @param {number} selection.pointIndex - Zero-based point position.
   * @param {unknown} [selection.label=this.#labels[selection.pointIndex]] - Category label overriding the x value.
   * @returns {object | null} Selection point, or null when the source point is absent.
   */
  #buildPoint({ dataset, datasetIndex, pointIndex, label = this.#labels[pointIndex] }) {
    const point = dataset?.points[pointIndex];
    if (!point) {
      return null;
    }
    return {
      datasetIndex,
      dataset: dataset.name,
      label: label ?? point.x,
      x: point.x,
      y: point.y,
      ...(this.#type === ChartType.BUBBLE && { r: point.r }),
    };
  }

  /**
   * Builds a heatmap cell or inspected week selection.
   *
   * @param {SVGElement} mark - Heatmap mark containing optional range metadata.
   * @param {number} pointIndex - First selected heatmap entry index.
   * @returns {object} Public heatmap selection payload.
   */
  #selectHeatmap(mark, pointIndex) {
    const rangeLength = Number(mark.dataset.heatmapRangeLength ?? 0);
    if (rangeLength <= 0) {
      return { type: ChartType.HEATMAP, index: pointIndex, ...this.#heatmap[pointIndex] };
    }
    const points = this.#heatmap.slice(pointIndex, pointIndex + rangeLength);
    return {
      type: ChartType.HEATMAP,
      index: pointIndex,
      key: points[0].key,
      value: points[0].value,
      values: points.map((point) => point.value),
      points,
      range: { start: points[0].key, end: points.at(-1).key },
    };
  }

  /**
   * Builds a timesheet task selection with defensive Date instances.
   *
   * @param {number} pointIndex - Selected task index.
   * @returns {object} Public timesheet selection payload.
   */
  #selectTimesheet(pointIndex) {
    const task = this.#timesheet.tasks[pointIndex];
    return {
      type: ChartType.TIMESHEET,
      index: pointIndex,
      label: task.label,
      start: new Date(task.start),
      end: new Date(task.end),
      duration: task.end - task.start,
      group: task.group,
      color: task.color,
      task: { ...task },
    };
  }

  /**
   * Aggregates every series at one inspected category.
   *
   * @param {number} pointIndex - Selected category index.
   * @returns {object} Multi-series category selection payload.
   */
  #selectCategory(pointIndex) {
    const points = this.#datasets
      .map((dataset, datasetIndex) => this.#buildPoint({ dataset, datasetIndex, pointIndex }))
      .filter(Boolean);
    return {
      type: this.#type,
      index: pointIndex,
      label: this.#labels[pointIndex] ?? this.#datasets[0].points[pointIndex]?.x,
      x: points[0]?.x,
      values: this.#datasets.map((dataset) => dataset.points[pointIndex]?.y),
      points,
    };
  }

  /**
   * Aggregates every point in one selected radar dataset.
   *
   * @param {number} datasetIndex - Selected radar dataset index.
   * @returns {object} Whole-series radar selection payload.
   */
  #selectRadarDataset(datasetIndex) {
    const dataset = this.#datasets[datasetIndex];
    const points = dataset.points.map((_point, pointIndex) =>
      this.#buildPoint({
        dataset,
        datasetIndex,
        pointIndex,
        label: this.#labels[pointIndex],
      }),
    );
    return {
      type: ChartType.RADAR,
      index: datasetIndex,
      label: dataset.name,
      datasetIndex,
      dataset: dataset.name,
      values: points.map((point) => point.y),
      points,
    };
  }

  /**
   * Builds a single-value selection for an aggregation sector.
   *
   * @param {number} pointIndex - Selected aggregation item index.
   * @returns {object} Public aggregation selection payload.
   */
  #selectAggregation(pointIndex) {
    const point = this.#buildPoint({ dataset: this.#datasets[0], datasetIndex: 0, pointIndex });
    return {
      type: this.#type,
      index: pointIndex,
      label: point.label,
      x: point.x,
      y: point.y,
      value: point.y,
      values: [point.y],
      points: [point],
    };
  }

  /**
   * Builds a standard single-point series selection.
   *
   * @param {number} datasetIndex - Selected dataset index.
   * @param {number} pointIndex - Selected point index.
   * @returns {object} Public Cartesian series selection payload.
   */
  #selectSeriesPoint(datasetIndex, pointIndex) {
    const dataset = this.#datasets[datasetIndex];
    const point = this.#buildPoint({ dataset, datasetIndex, pointIndex });
    return {
      type: this.#type,
      index: pointIndex,
      datasetIndex,
      dataset: dataset?.name,
      label: point.label,
      x: point.x,
      y: point.y,
      value: point.y,
      values: [point.y],
      points: [point],
    };
  }
}
