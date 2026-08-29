import { ChartType } from "../support/Constants.js";

/**
 * Produces a collision-resistant key for primitive public identity parts.
 *
 * @param {string} family - Chart-family identity namespace.
 * @param {unknown[]} parts - Required logical identity values.
 * @returns {string | null} Serialized identity, or null when a part is absent.
 */
function identityKey(family, parts) {
  return parts.some((part) => [undefined, null, ""].includes(part))
    ? null
    : JSON.stringify([family, ...parts]);
}

/**
 * Deeply freezes public selection records while leaving dates mutable.
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
 * Resolves the public label participating in logical identity.
 *
 * @param {object} collections - Normalized datasets and labels.
 * @param {number} datasetIndex - Dataset containing the point.
 * @param {number} pointIndex - Point position within that dataset.
 * @returns {unknown} Explicit label or point x coordinate.
 */
function pointLabel(collections, datasetIndex, pointIndex) {
  return collections.labels[pointIndex] ?? collections.datasets[datasetIndex]?.points[pointIndex]?.x;
}

/**
 * Builds one normalized series point for a public payload.
 *
 * @param {string} type - Immutable chart type.
 * @param {object} collections - Normalized datasets and labels.
 * @param {object} identity - Dataset and point coordinates.
 * @returns {object} Complete public selection point.
 */
function selectionPoint(type, collections, identity) {
  const { dataset, datasetIndex, pointIndex } = identity;
  const point = dataset?.points[pointIndex];
  const label = identity.label ?? collections.labels[pointIndex];

  return Object.freeze({
    datasetIndex,
    dataset: dataset.name,
    label: label ?? point.x,
    x: point.x,
    y: point.y,
    ...(type === ChartType.BUBBLE && { r: point.r }),
  });
}

/**
 * Creates one standard Cartesian point payload.
 *
 * @param {string} type - Immutable chart type.
 * @param {object} identity - Dataset and point coordinates.
 * @param {object} point - Selected normalized point.
 * @returns {object} Public Cartesian point payload.
 */
function seriesPayload(type, identity, point) {
  return Object.freeze({
    type,
    index: identity.pointIndex,
    datasetIndex: identity.datasetIndex,
    dataset: identity.dataset.name,
    label: point.label,
    x: point.x,
    y: point.y,
    value: point.y,
    values: [point.y],
    points: [point],
  });
}

/**
 * Creates one aligned category payload.
 *
 * @param {string} type - Immutable chart type.
 * @param {number} index - Shared category position.
 * @param {object} collections - Normalized datasets and labels.
 * @returns {object} Public multi-series category payload.
 */
function categoryPayload(type, index, collections) {
  const points = collections.datasets.map((dataset, datasetIndex) =>
    selectionPoint(type, collections, { dataset, datasetIndex, pointIndex: index }),
  );

  const first = points[0];

  return Object.freeze({
    type,
    index,
    label: collections.labels[index],
    datasetIndex: first.datasetIndex,
    dataset: first.dataset,
    x: first.x,
    y: first.y,
    value: first.y,
    values: collections.datasets.map((dataset) => dataset.points[index]?.y),
    points,
  });
}

/**
 * Creates one composition payload.
 *
 * @param {string} type - Immutable chart type.
 * @param {number} index - Selected point position.
 * @param {object} collections - Normalized datasets, labels, and colors.
 * @returns {object} Public composition payload.
 */
function compositionPayload(type, index, collections) {
  const point = selectionPoint(type, collections, {
    dataset: collections.datasets[0],
    datasetIndex: 0,
    pointIndex: index,
  });

  return Object.freeze({
    type,
    index,
    label: point.label,
    x: point.x,
    y: point.y,
    value: point.y,
    values: [point.y],
    points: [point],
    color: collections.colors[index % collections.colors.length],
  });
}

/**
 * Creates one complete radar-dataset payload.
 *
 * @param {number} index - Selected dataset position.
 * @param {object} collections - Normalized datasets and labels.
 * @returns {object} Public radar payload.
 */
function radarPayload(index, collections) {
  const dataset = collections.datasets[index];

  const points = dataset.points.map((_point, pointIndex) =>
    selectionPoint(ChartType.RADAR, collections, {
      dataset,
      datasetIndex: index,
      pointIndex,
      label: collections.labels[pointIndex],
    }),
  );

  return Object.freeze({
    type: ChartType.RADAR,
    index,
    label: dataset.name,
    datasetIndex: index,
    dataset: dataset.name,
    x: points[0]?.x,
    y: points[0]?.y,
    value: points[0]?.y,
    values: points.map((point) => point.y),
    points,
  });
}

/**
 * Resolves one heatmap cell color from the complete intensity scale.
 *
 * @param {number} index - Selected heatmap entry.
 * @param {object} collections - Normalized heatmap and colors.
 * @returns {string} Effective cell color.
 */
function heatmapColor(index, collections) {
  const values = collections.heatmap.map((point) => point.value);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const value = collections.heatmap[index].value;
  const last = collections.colors.length - 1;

  if (minimum === maximum) {
    return collections.colors[value === 0 ? 0 : last];
  }

  const level = Math.min(
    last,
    Math.floor(((value - minimum) / (maximum - minimum)) * collections.colors.length),
  );

  return collections.colors[level];
}

/**
 * Translates mark metadata through one family-specific immutable policy.
 */
export default class ChartSelection {
  #policy;

  /**
   * Captures one family-specific immutable policy.
   *
   * @param {object} policy - Family payload and identity functions.
   */
  constructor(policy) {
    this.#policy = Object.freeze(policy);
  }

  /**
   * Resolves one renderer mark into its public payload.
   *
   * @param {SVGElement} mark - Rendered mark carrying source indices.
   * @returns {object} Frozen callback and event payload.
   */
  from(mark) {
    return freezeSelection(this.#policy.from(mark));
  }

  /**
   * Resolves one renderer mark into its stable lifecycle identity.
   *
   * @param {SVGElement} mark - Rendered mark carrying source indices.
   * @returns {string | null} Stable identity or null when ambiguous.
   */
  identityFor(mark) {
    return this.#policy.identityFor(mark);
  }
}

/**
 * Creates the Cartesian selection presenter.
 *
 * @param {string} type - Concrete Cartesian type.
 * @param {object} collections - Normalized model collections.
 * @returns {ChartSelection} Family-specialized presenter.
 */
function createSeriesSelection(type, collections) {
  return new ChartSelection({
    from: (mark) => {
      const pointIndex = Number(mark.dataset.pointIndex);
      const datasetIndex = Number(mark.dataset.datasetIndex);

      if (datasetIndex === -1) {
        return categoryPayload(type, pointIndex, collections);
      }

      const dataset = collections.datasets[datasetIndex];
      const point = selectionPoint(type, collections, { dataset, datasetIndex, pointIndex });

      return seriesPayload(type, { dataset, datasetIndex, pointIndex }, point);
    },
    identityFor: (mark) => {
      const pointIndex = Number(mark.dataset.pointIndex);
      const datasetIndex = Number(mark.dataset.datasetIndex);

      if (datasetIndex === -1) {
        const names = collections.datasets.map((dataset) => dataset.identityName);

        return identityKey("series-category", [...names, pointLabel(collections, 0, pointIndex)]);
      }

      return identityKey("series", [
        collections.datasets[datasetIndex]?.identityName,
        pointLabel(collections, datasetIndex, pointIndex),
      ]);
    },
  });
}

/**
 * Creates the composition and radial selection presenter.
 *
 * @param {string} type - Concrete composition type.
 * @param {object} collections - Normalized model collections.
 * @returns {ChartSelection} Family-specialized presenter.
 */
function createCompositionSelection(type, collections) {
  return new ChartSelection({
    from: (mark) => {
      const datasetIndex = Number(mark.dataset.datasetIndex);
      const pointIndex = Number(mark.dataset.pointIndex);

      return type === ChartType.RADAR
        ? radarPayload(datasetIndex, collections)
        : compositionPayload(type, pointIndex, collections);
    },
    identityFor: (mark) => {
      const datasetIndex = Number(mark.dataset.datasetIndex);
      const pointIndex = Number(mark.dataset.pointIndex);

      return type === ChartType.RADAR
        ? identityKey("series", [collections.datasets[datasetIndex]?.identityName, "dataset"])
        : identityKey("composition", [pointLabel(collections, 0, pointIndex)]);
    },
  });
}

/**
 * Creates the heatmap selection presenter.
 *
 * @param {object} collections - Normalized model collections.
 * @returns {ChartSelection} Heatmap-specialized presenter.
 */
function createHeatmapSelection(collections) {
  return new ChartSelection({
    from: (mark) => {
      const index = Number(mark.dataset.pointIndex);
      const point = collections.heatmap[index];

      return {
        type: ChartType.HEATMAP,
        index,
        date: new Date(point.date),
        key: point.key,
        value: point.value,
        color: heatmapColor(index, collections),
      };
    },
    identityFor: (mark) =>
      identityKey("heatmap", [collections.heatmap[Number(mark.dataset.pointIndex)]?.key]),
  });
}

/**
 * Creates the timesheet selection presenter.
 *
 * @param {object} collections - Normalized model collections.
 * @returns {ChartSelection} Timesheet-specialized presenter.
 */
function createTimesheetSelection(collections) {
  return new ChartSelection({
    from: (mark) => {
      const index = Number(mark.dataset.pointIndex);
      const task = collections.timesheet.tasks[index];

      return Object.freeze({
        type: ChartType.TIMESHEET,
        index,
        label: task.label,
        start: new Date(task.start),
        end: new Date(task.end),
        duration: task.end - task.start,
        group: task.group,
        color: task.color,
        task: { ...task, start: new Date(task.start), end: new Date(task.end) },
      });
    },
    identityFor: (mark) => {
      const task = collections.timesheet.tasks[Number(mark.dataset.pointIndex)];

      return identityKey("timesheet", [task?.label, task?.start.valueOf(), task?.end.valueOf()]);
    },
  });
}

export {
  createCompositionSelection,
  createHeatmapSelection,
  createSeriesSelection,
  createTimesheetSelection,
};
