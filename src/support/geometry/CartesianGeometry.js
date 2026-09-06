import { ORIENTATION_HORIZONTAL } from "../Constants.js";

const CUBIC_CONTROL_DIVISOR = 3;

/**
 * Calculates monotone tangents for ordered screen-space points.
 *
 * @param {Array<{x: number, y: number}>} points - Strictly increasing coordinates.
 * @param {Float64Array} intervals - Horizontal distance between adjacent points.
 * @returns {Float64Array} Tangent slope at every point.
 */
// The indexed loops here avoid callback and iterator allocation on very large paths.
// eslint-disable-next-line max-statements
function monotoneTangents(points, intervals) {
  const slopes = new Float64Array(intervals.length);
  const tangents = new Float64Array(points.length);
  let slopeIndex = 0;

  while (slopeIndex < intervals.length) {
    slopes[slopeIndex] = (points[slopeIndex + 1].y - points[slopeIndex].y) / intervals[slopeIndex];
    slopeIndex += 1;
  }

  tangents[0] = slopes[0];
  tangents[tangents.length - 1] = slopes.at(-1);

  let tangentIndex = 1;

  while (tangentIndex < points.length - 1) {
    const before = slopes[tangentIndex - 1];
    const after = slopes[tangentIndex];

    if (before === 0 || after === 0 || Math.sign(before) !== Math.sign(after)) {
      tangents[tangentIndex] = 0;
      tangentIndex += 1;
      continue;
    }

    const beforeInterval = intervals[tangentIndex - 1];
    const afterInterval = intervals[tangentIndex];
    const firstWeight = 2 * afterInterval + beforeInterval;
    const secondWeight = afterInterval + 2 * beforeInterval;

    tangents[tangentIndex] = (firstWeight + secondWeight) / (firstWeight / before + secondWeight / after);
    tangentIndex += 1;
  }

  return tangents;
}

/**
 * Serializes monotone cubic control points into one SVG path.
 *
 * @param {Array<{x: number, y: number}>} points - Ordered coordinates.
 * @param {Float64Array} intervals - Horizontal distances between points.
 * @param {Float64Array} tangents - Monotone tangent at every point.
 * @returns {string} Smooth SVG path data.
 */
function smoothLinePath(points, intervals, tangents) {
  let path = `M${points[0].x},${points[0].y}`;
  let index = 1;

  while (index < points.length) {
    const point = points[index];
    const previous = points[index - 1];
    const interval = intervals[index - 1];
    const controlOffset = interval / CUBIC_CONTROL_DIVISOR;
    const firstControlX = previous.x + controlOffset;
    const firstControlY = previous.y + tangents[index - 1] * controlOffset;
    const secondControlX = point.x - controlOffset;
    const secondControlY = point.y - tangents[index] * controlOffset;

    path += ` C${firstControlX},${firstControlY} ${secondControlX},${secondControlY} ${point.x},${point.y}`;
    index += 1;
  }

  return path;
}

/**
 * Builds an SVG path through ordered points using monotone cubic smoothing.
 *
 * @param {Array<{x: number, y: number}>} points - Ordered screen-space coordinates.
 * @param {boolean} [isSmooth=true] - Enables smoothing when x coordinates are strictly increasing.
 * @returns {string} SVG path data that passes through every supplied point.
 */
// eslint-disable-next-line max-statements
function linePath(points, isSmooth = true) {
  if (points.length === 1) {
    return `M${points[0].x},${points[0].y}`;
  }

  let hasIncreasingX = true;
  let pointIndex = 1;

  while (pointIndex < points.length) {
    if (points[pointIndex].x <= points[pointIndex - 1].x) {
      hasIncreasingX = false;
      break;
    }

    pointIndex += 1;
  }

  if (!isSmooth || !hasIncreasingX) {
    let path = `M${points[0].x},${points[0].y}`;
    let pathIndex = 1;

    while (pathIndex < points.length) {
      path += ` L${points[pathIndex].x},${points[pathIndex].y}`;
      pathIndex += 1;
    }

    return path;
  }

  const intervals = new Float64Array(points.length - 1);
  let intervalIndex = 0;

  while (intervalIndex < intervals.length) {
    intervals[intervalIndex] = points[intervalIndex + 1].x - points[intervalIndex].x;
    intervalIndex += 1;
  }

  const tangents = monotoneTangents(points, intervals);

  return smoothLinePath(points, intervals, tangents);
}

/**
 * Builds a bar outline with rounding only on the end representing its value.
 *
 * @param {object} bar - Named rectangle, direction, and rounding policies.
 * @param {object} bar.rectangle - Non-negative SVG rectangle geometry.
 * @param {object} bar.direction - Orientation and signed value direction.
 * @param {object} bar.rounding - Radius and exposed-edge rounding policy.
 * @returns {string} Closed SVG path data for the bar.
 */
function roundedBarPath({ rectangle, direction, rounding }) {
  const { x, y, width, height } = rectangle;
  const appliedRadius = rounding.shouldRoundValueEnd ? Math.min(rounding.radius, width / 2, height / 2) : 0;

  if (width <= 0 || height <= 0) {
    return `M${x},${y}Z`;
  }

  if (appliedRadius <= 0) {
    return `M${x},${y}H${x + width}V${y + height}H${x}Z`;
  }

  const right = x + width;
  const bottom = y + height;

  if (direction.orientation === ORIENTATION_HORIZONTAL && direction.value >= 0) {
    return `M${x},${y}H${right - appliedRadius}Q${right},${y} ${right},${y + appliedRadius}V${bottom - appliedRadius}Q${right},${bottom} ${right - appliedRadius},${bottom}H${x}Z`;
  }

  if (direction.orientation === ORIENTATION_HORIZONTAL) {
    return `M${right},${y}H${x + appliedRadius}Q${x},${y} ${x},${y + appliedRadius}V${bottom - appliedRadius}Q${x},${bottom} ${x + appliedRadius},${bottom}H${right}Z`;
  }

  if (direction.value >= 0) {
    return `M${x},${bottom}V${y + appliedRadius}Q${x},${y} ${x + appliedRadius},${y}H${right - appliedRadius}Q${right},${y} ${right},${y + appliedRadius}V${bottom}Z`;
  }

  return `M${x},${y}V${bottom - appliedRadius}Q${x},${bottom} ${x + appliedRadius},${bottom}H${right - appliedRadius}Q${right},${bottom} ${right},${bottom - appliedRadius}V${y}Z`;
}

export { linePath, roundedBarPath };
