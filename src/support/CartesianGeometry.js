import { ChartOrientation } from "./Constants.js";

const CUBIC_CONTROL_DIVISOR = 3;

/**
 * Calculates monotone tangents for ordered screen-space points.
 *
 * @param {Array<{x: number, y: number}>} points - Strictly increasing coordinates.
 * @param {number[]} intervals - Horizontal distance between adjacent points.
 * @returns {number[]} Tangent slope at every point.
 */
function monotoneTangents(points, intervals) {
  const slopes = intervals.map((interval, index) => (points[index + 1].y - points[index].y) / interval);

  return points.map((_point, index) => {
    if (index === 0) {
      return slopes[0];
    }

    if (index === points.length - 1) {
      return slopes.at(-1);
    }

    const before = slopes[index - 1];
    const after = slopes[index];

    if (before === 0 || after === 0 || Math.sign(before) !== Math.sign(after)) {
      return 0;
    }

    const beforeInterval = intervals[index - 1];
    const afterInterval = intervals[index];
    const firstWeight = 2 * afterInterval + beforeInterval;
    const secondWeight = afterInterval + 2 * beforeInterval;

    return (firstWeight + secondWeight) / (firstWeight / before + secondWeight / after);
  });
}

/**
 * Serializes monotone cubic control points into one SVG path.
 *
 * @param {Array<{x: number, y: number}>} points - Ordered coordinates.
 * @param {number[]} intervals - Horizontal distances between points.
 * @param {number[]} tangents - Monotone tangent at every point.
 * @returns {string} Smooth SVG path data.
 */
function smoothLinePath(points, intervals, tangents) {
  let path = `M${points[0].x},${points[0].y}`;

  for (const [index, point] of points.slice(1).entries()) {
    const previous = points[index];
    const interval = intervals[index];

    const firstControl = {
      x: previous.x + interval / CUBIC_CONTROL_DIVISOR,
      y: previous.y + (tangents[index] * interval) / CUBIC_CONTROL_DIVISOR,
    };

    const secondControl = {
      x: point.x - interval / CUBIC_CONTROL_DIVISOR,
      y: point.y - (tangents[index + 1] * interval) / CUBIC_CONTROL_DIVISOR,
    };

    path += ` C${firstControl.x},${firstControl.y} ${secondControl.x},${secondControl.y} ${point.x},${point.y}`;
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
function linePath(points, isSmooth = true) {
  if (points.length === 1) {
    return `M${points[0].x},${points[0].y}`;
  }

  if (!isSmooth || points.some((point, index) => index > 0 && point.x <= points[index - 1].x)) {
    return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  }

  const intervals = points.slice(1).map((point, index) => point.x - points[index].x);
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

  if (direction.orientation === ChartOrientation.HORIZONTAL && direction.value >= 0) {
    return `M${x},${y}H${right - appliedRadius}Q${right},${y} ${right},${y + appliedRadius}V${bottom - appliedRadius}Q${right},${bottom} ${right - appliedRadius},${bottom}H${x}Z`;
  }

  if (direction.orientation === ChartOrientation.HORIZONTAL) {
    return `M${right},${y}H${x + appliedRadius}Q${x},${y} ${x},${y + appliedRadius}V${bottom - appliedRadius}Q${x},${bottom} ${x + appliedRadius},${bottom}H${right}Z`;
  }

  if (direction.value >= 0) {
    return `M${x},${bottom}V${y + appliedRadius}Q${x},${y} ${x + appliedRadius},${y}H${right - appliedRadius}Q${right},${y} ${right},${y + appliedRadius}V${bottom}Z`;
  }

  return `M${x},${y}V${bottom - appliedRadius}Q${x},${bottom} ${x + appliedRadius},${bottom}H${right - appliedRadius}Q${right},${bottom} ${right},${bottom - appliedRadius}V${y}Z`;
}

export { linePath, roundedBarPath };
