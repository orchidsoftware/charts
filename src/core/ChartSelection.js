import { AGGREGATION_TYPES, ChartType } from "../support/Constants.js";

/**
 * Produces a collision-resistant key for primitive public identity parts.
 *
 * @param {string} family - Chart-family identity namespace.
 * @param {unknown[]} parts - Required logical identity values.
 * @returns {string | null} Serialized identity, or null when a part is absent.
 */
function identityKey(family, parts) {
  if (parts.some((part) => [undefined, null, ""].includes(part))) {
    return null;
  }

  return JSON.stringify([family, ...parts]);
}

/**
 * Deeply freezes public selection records while leaving Date instances mutable.
 *
 * @param {unknown} value - Selection value or nested collection.
 * @returns {unknown} The same recursively frozen value.
 */
function freezeSelection(value) {
  if (!value || typeof value !== "object" || value instanceof Date) {
    return value;
  }

  for (const child of Object.values(value)) {
    freezeSelection(child);
  }

  return Object.freeze(value);
}

/**
 * Names one selected heatmap cell.
 */
class HeatmapPointSelection {
  /**
   * Creates a public single-cell payload.
   *
   * @param {number} index - Selected cell index.
   * @param {object} point - Normalized heatmap entry.
   * @param {string} color - Effective intensity color.
   */
  constructor(index, point, color) {
    this.type = ChartType.HEATMAP;
    this.index = index;
    this.date = new Date(point.date);
    this.key = point.key;
    this.value = point.value;
    this.color = color;
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
    this.task = { ...task, start: new Date(task.start), end: new Date(task.end) };
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
    this.datasetIndex = category.points[0].datasetIndex;
    this.dataset = category.points[0].dataset;
    this.x = category.points[0].x;
    this.y = category.points[0].y;
    this.value = category.points[0].y;
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
    this.x = points[0]?.x;
    this.y = points[0]?.y;
    this.value = points[0]?.y;
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
   * @param {object} selection - Selected point and effective item color.
   * @param {object} selection.point - Selected point.
   * @param {string} selection.color - Effective composition item color.
   */
  constructor(type, index, { point, color }) {
    this.type = type;
    this.index = index;
    this.label = point.label;
    this.x = point.x;
    this.y = point.y;
    this.value = point.y;
    this.values = [point.y];
    this.points = [point];
    this.color = color;
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
  #colors;

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
    this.#colors = collections.colors;
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
      return freezeSelection(this.#selectHeatmap(mark, pointIndex));
    }

    if (this.#type === ChartType.TIMESHEET) {
      return freezeSelection(this.#selectTimesheet(pointIndex));
    }

    if (datasetIndex === -1) {
      return freezeSelection(this.#selectCategory(pointIndex));
    }

    if (this.#type === ChartType.RADAR) {
      return freezeSelection(this.#selectRadarDataset(datasetIndex));
    }

    if (AGGREGATION_TYPES.includes(this.#type) || this.#type === ChartType.POLAR_AREA) {
      return freezeSelection(this.#selectAggregation(pointIndex));
    }

    return freezeSelection(this.#selectSeriesPoint(datasetIndex, pointIndex));
  }

  /**
   * Resolves type-specific logical identity used only for lifecycle preservation.
   *
   * @param {SVGElement} mark - Rendered mark carrying dataset and point indices.
   * @returns {string | null} Stable identity, or null when identity is ambiguous.
   */
  identityFor(mark) {
    const pointIndex = Number(mark.dataset.pointIndex);

    if (this.#type === ChartType.HEATMAP) {
      return identityKey("heatmap", [this.#heatmap[pointIndex]?.key]);
    }

    if (this.#type === ChartType.TIMESHEET) {
      const task = this.#timesheet.tasks[pointIndex];

      return identityKey("timesheet", [task?.label, task?.start.valueOf(), task?.end.valueOf()]);
    }

    return this.#seriesIdentity(Number(mark.dataset.datasetIndex), pointIndex);
  }

  /**
   * Resolves series and composition identities from normalized mark coordinates.
   *
   * @param {number} datasetIndex - Selected dataset, or -1 for an aligned category.
   * @param {number} pointIndex - Selected point or category position.
   * @returns {string | null} Stable identity or null for unnamed data.
   */
  #seriesIdentity(datasetIndex, pointIndex) {
    if (datasetIndex === -1) {
      return this.#categoryIdentity(pointIndex);
    }

    if (this.#type === ChartType.RADAR) {
      return identityKey("series", [this.#datasets[datasetIndex]?.identityName, "dataset"]);
    }

    if (AGGREGATION_TYPES.includes(this.#type) || this.#type === ChartType.POLAR_AREA) {
      return identityKey("composition", [this.#pointLabel(0, pointIndex)]);
    }

    return identityKey("series", [
      this.#datasets[datasetIndex]?.identityName,
      this.#pointLabel(datasetIndex, pointIndex),
    ]);
  }

  /**
   * Names an aligned category only when every participating series is explicit.
   *
   * @param {number} pointIndex - Shared category position.
   * @returns {string | null} Stable category identity or null for unnamed data.
   */
  #categoryIdentity(pointIndex) {
    const names = this.#datasets.map((dataset) => dataset.identityName);

    return identityKey("series-category", [...names, this.#pointLabel(0, pointIndex)]);
  }

  /**
   * Resolves the public label participating in logical identity.
   *
   * @param {number} datasetIndex - Dataset containing the selected point.
   * @param {number} pointIndex - Point position within that dataset.
   * @returns {unknown} Explicit category label or point x coordinate.
   */
  #pointLabel(datasetIndex, pointIndex) {
    return this.#labels[pointIndex] ?? this.#datasets[datasetIndex]?.points[pointIndex]?.x;
  }

  /**
   * Builds one normalized series point for a public selection payload.
   *
   * @param {object} selection - Coordinates identifying one normalized point.
   * @param {object | undefined} selection.dataset - Source dataset containing the requested point.
   * @param {number} selection.datasetIndex - Zero-based dataset position.
   * @param {number} selection.pointIndex - Zero-based point position.
   * @param {unknown} [selection.label=this.#labels[selection.pointIndex]] - Category label overriding the x value.
   * @returns {object} Complete selection point for one rendered mark.
   */
  #buildPoint({ dataset, datasetIndex, pointIndex, label = this.#labels[pointIndex] }) {
    const point = dataset?.points[pointIndex];

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
   * @param {SVGElement} _mark - Rendered heatmap cell retained for policy symmetry.
   * @param {number} pointIndex - First selected heatmap entry index.
   * @returns {object} Public heatmap selection payload.
   */
  #selectHeatmap(_mark, pointIndex) {
    return new HeatmapPointSelection(pointIndex, this.#heatmap[pointIndex], this.#heatmapColor(pointIndex));
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
    const points = this.#datasets.map((dataset, datasetIndex) =>
      this.#buildPoint({ dataset, datasetIndex, pointIndex }),
    );

    const label = this.#labels[pointIndex];
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

    return new AggregationSelection(this.#type, pointIndex, {
      point,
      color: this.#colors[pointIndex % this.#colors.length],
    });
  }

  /**
   * Resolves a heatmap cell color from the complete ordered intensity scale.
   *
   * @param {number} pointIndex - Selected normalized heatmap entry.
   * @returns {string} Effective cell color.
   */
  #heatmapColor(pointIndex) {
    const values = this.#heatmap.map((point) => point.value);
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const value = this.#heatmap[pointIndex].value;
    let level = value === 0 ? 0 : this.#colors.length - 1;

    if (minimum !== maximum) {
      level = Math.min(
        this.#colors.length - 1,
        Math.floor(((value - minimum) / (maximum - minimum)) * this.#colors.length),
      );
    }

    return this.#colors[level];
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
