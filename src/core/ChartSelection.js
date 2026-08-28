import { AGGREGATION_TYPES, ChartType } from "../support/Constants.js";

/**
 * Names one selected heatmap cell.
 */
class HeatmapPointSelection {
  /**
   * Creates a public single-cell payload.
   *
   * @param {number} index - Selected cell index.
   * @param {object} point - Normalized heatmap entry.
   */
  constructor(index, point) {
    this.type = ChartType.HEATMAP;
    this.index = index;
    this.date = point.date;
    this.key = point.key;
    this.value = point.value;
  }
}

/**
 * Names one inspected heatmap range.
 */
class HeatmapRangeSelection {
  /**
   * Creates a public heatmap-range payload.
   *
   * @param {number} index - First selected cell index.
   * @param {Array<object>} points - Range entries.
   */
  constructor(index, points) {
    this.type = ChartType.HEATMAP;
    this.index = index;
    this.key = points[0].key;
    this.value = points[0].value;
    this.values = points.map((point) => point.value);
    this.points = points;
    this.range = { start: points[0].key, end: points.at(-1).key };
  }
}

/**
 * Names one selected timesheet task.
 */
class TimesheetSelection {
  /**
   * Creates a public task payload with defensive dates.
   *
   * @param {number} index - Selected task index.
   * @param {object} task - Normalized task.
   */
  constructor(index, task) {
    this.type = ChartType.TIMESHEET;
    this.index = index;
    this.label = task.label;
    this.start = new Date(task.start);
    this.end = new Date(task.end);
    this.duration = task.end - task.start;
    this.group = task.group;
    this.color = task.color;
    this.task = { ...task };
  }
}

/**
 * Names a multi-series category inspection.
 */
class CategorySelection {
  /**
   * Creates a public category payload.
   *
   * @param {string} type - Chart type.
   * @param {number} index - Position shared by every inspected series.
   * @param {object} category - Category values.
   */
  constructor(type, index, category) {
    this.type = type;
    this.index = index;
    this.label = category.label;
    this.x = category.points[0]?.x;
    this.values = category.values;
    this.points = category.points;
  }
}

/**
 * Names a complete radar dataset selection.
 */
class RadarSelection {
  /**
   * Creates a public radar-dataset payload.
   *
   * @param {number} index - Dataset index.
   * @param {object} dataset - Normalized series supplying the polygon values.
   * @param {Array<object>} points - Selected points.
   */
  constructor(index, dataset, points) {
    this.type = ChartType.RADAR;
    this.index = index;
    this.label = dataset.name;
    this.datasetIndex = index;
    this.dataset = dataset.name;
    this.values = points.map((point) => point.y);
    this.points = points;
  }
}

/**
 * Names a single aggregation selection.
 */
class AggregationSelection {
  /**
   * Creates a public aggregation payload.
   *
   * @param {string} type - Chart type.
   * @param {number} index - Point index.
   * @param {object} point - Selected point.
   */
  constructor(type, index, point) {
    this.type = type;
    this.index = index;
    this.label = point.label;
    this.x = point.x;
    this.y = point.y;
    this.value = point.y;
    this.values = [point.y];
    this.points = [point];
  }
}

/**
 * Names a single Cartesian series-point selection.
 */
class SeriesPointSelection {
  /**
   * Creates a public series-point payload.
   *
   * @param {string} type - Chart type.
   * @param {object} identity - Dataset and point identity.
   * @param {object} point - Selected point.
   */
  constructor(type, identity, point) {
    this.type = type;
    this.index = identity.pointIndex;
    this.datasetIndex = identity.datasetIndex;
    this.dataset = identity.dataset?.name;
    this.label = point.label;
    this.x = point.x;
    this.y = point.y;
    this.value = point.y;
    this.values = [point.y];
    this.points = [point];
  }
}

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
   * @param {string} type - Immutable chart type controlling payload shape.
   * @param {object} collections - Current normalized chart collections.
   */
  constructor(type, collections) {
    this.#type = type;
    this.#datasets = collections.datasets;
    this.#labels = collections.labels;
    this.#heatmap = collections.heatmap;
    this.#timesheet = collections.timesheet;
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
      return new HeatmapPointSelection(pointIndex, this.#heatmap[pointIndex]);
    }

    const points = this.#heatmap.slice(pointIndex, pointIndex + rangeLength);

    return new HeatmapRangeSelection(pointIndex, points);
  }

  /**
   * Builds a timesheet task selection with defensive Date instances.
   *
   * @param {number} pointIndex - Selected task index.
   * @returns {object} Public timesheet selection payload.
   */
  #selectTimesheet(pointIndex) {
    const task = this.#timesheet.tasks[pointIndex];

    return new TimesheetSelection(pointIndex, task);
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

    const label = this.#labels[pointIndex] ?? this.#datasets[0].points[pointIndex]?.x;
    const values = this.#datasets.map((dataset) => dataset.points[pointIndex]?.y);

    return new CategorySelection(this.#type, pointIndex, { label, values, points });
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

    return new RadarSelection(datasetIndex, dataset, points);
  }

  /**
   * Builds a single-value selection for an aggregation sector.
   *
   * @param {number} pointIndex - Selected aggregation item index.
   * @returns {object} Public aggregation selection payload.
   */
  #selectAggregation(pointIndex) {
    const point = this.#buildPoint({ dataset: this.#datasets[0], datasetIndex: 0, pointIndex });

    return new AggregationSelection(this.#type, pointIndex, point);
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

    return new SeriesPointSelection(this.#type, { pointIndex, datasetIndex, dataset }, point);
  }
}
