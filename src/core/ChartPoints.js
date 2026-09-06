import { ChartType } from "../support/Constants.js";

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
 * Reads one aligned category without exposing internal arrays.
 *
 * @param {object} collections - Normalized datasets and labels.
 * @param {number} index - Category position.
 * @returns {object | undefined} Defensive category snapshot.
 */
function categoryPointAt(collections, index) {
  const { datasets, labels } = collections;

  if (datasets.every((dataset) => dataset.points[index] === undefined)) {
    return;
  }

  return Object.freeze({
    index,
    label: labels[index],
    values: Object.freeze(datasets.map((dataset) => dataset.points[index]?.y)),
  });
}

/**
 * Finds an independent point without rebuilding a flattened dataset on every read.
 *
 * @param {string} type - Immutable chart type.
 * @param {object} collections - Normalized datasets and labels.
 * @param {number} index - Flattened navigation position.
 * @returns {object | undefined} Defensive independent point snapshot.
 */
function independentPointAt(type, collections, index) {
  let offset = 0;

  for (const [
    datasetIndex,
    dataset,
  ] of collections.datasets.entries()) {
    const pointIndex = index - offset;
    const point = dataset.points[pointIndex];

    if (point) {
      return seriesMarkSnapshot({
        dataset,
        datasetIndex,
        point,
        pointIndex,
        index,
        label: collections.labels[pointIndex],
        chartType: type === ChartType.AXIS_MIXED ? dataset.chartType : undefined,
      });
    }

    offset += dataset.points.length;
  }
}

/**
 * Copies a heatmap entry including its mutable date.
 *
 * @param {object[]} entries - Normalized daily entries.
 * @param {number} index - Daily entry position.
 * @returns {object | undefined} Defensive daily snapshot.
 */
function heatmapPointAt(entries, index) {
  const point = entries[index];

  return point && Object.freeze({ ...point, date: new Date(point.date) });
}

/**
 * Copies a task including both mutable dates.
 *
 * @param {object[]} tasks - Normalized tasks.
 * @param {number} index - Task position.
 * @returns {object | undefined} Defensive task snapshot.
 */
function timesheetPointAt(tasks, index) {
  const task = tasks[index];

  return task && Object.freeze({ ...task, start: new Date(task.start), end: new Date(task.end) });
}

export { categoryPointAt, independentPointAt, heatmapPointAt, timesheetPointAt };

/**
 * Resolves a renderer address independently of DOM navigation order.
 *
 * @param {string} type - Chart family.
 * @param {object} collections - Normalized model collections.
 * @param {object} mark - Dataset and point address.
 * @returns {object | undefined} Defensive public snapshot of the addressed data.
 */
function seriesPointFor(type, collections, mark) {
  if (mark.kind === "dataset") {
    const dataset = collections.datasets[mark.datasetIndex];

    return Object.freeze({
      index: mark.datasetIndex,
      label: dataset.name,
      values: Object.freeze(dataset.points.map((point) => point.y)),
    });
  }

  if (
    [
      ChartType.SCATTER,
      ChartType.BUBBLE,
      ChartType.AXIS_MIXED,
    ].includes(type)
  ) {
    const offset = collections.datasets
      .slice(0, mark.datasetIndex)
      .reduce((sum, dataset) => sum + dataset.points.length, 0);

    return independentPointAt(type, collections, offset + mark.pointIndex);
  }

  return categoryPointAt(collections, mark.pointIndex);
}

export { seriesPointFor };
