import { ChartOrientation, MAJOR_GRID_DIVISIONS, MIN_SECTOR_SWEEP } from "./Constants.js";

/**
 * Finds a numeric extent and expands a degenerate single-value domain.
 *
 * @param {number[]} values - Non-empty numeric sample used to derive the domain.
 * @returns {[number, number]} Ascending minimum and maximum suitable for scaling.
 */
function extent(values) {
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  return minimum === maximum ? [minimum - 1, maximum + 1] : [minimum, maximum];
}

/**
 * Chooses a human-readable grid step near the requested division count.
 *
 * @param {number} span - Positive numeric distance covered by the axis.
 * @param {boolean} integerValues - Whether every source value is an integer.
 * @returns {number} Positive step rounded to a 1, 2, 5, or 10 progression.
 */
function niceStep(span, integerValues) {
  const roughStep = span / MAJOR_GRID_DIVISIONS;
  const power = 10 ** Math.floor(Math.log10(roughStep));
  const error = roughStep / power;
  let factor = 1;
  if (error >= Math.sqrt(50)) {
    factor = 10;
  } else if (error >= Math.sqrt(10)) {
    factor = 5;
  } else if (error >= Math.sqrt(2)) {
    factor = 2;
  }
  const step = factor * power;
  return integerValues ? Math.max(1, step) : step;
}

/**
 * Expands values onto rounded bounds and enumerates their major ticks.
 *
 * @param {number[]} values - Non-empty finite values displayed on an axis.
 * @returns {{domain: [number, number], ticks: number[]}} Rounded domain and inclusive tick sequence.
 */
function niceValueScale(values) {
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  if (minimum === maximum) {
    return { domain: [minimum - 1, maximum + 1], ticks: [minimum - 1, minimum, maximum + 1] };
  }
  const integerValues = values.every((value) => Number.isSafeInteger(value));
  const step = niceStep(maximum - minimum, integerValues);
  const niceMinimum = Math.floor(minimum / step) * step;
  const niceMaximum = Math.ceil(maximum / step) * step;
  const intervals = Math.round((niceMaximum - niceMinimum) / step);
  const ticks = Array.from({ length: intervals + 1 }, (_, index) =>
    Number((niceMinimum + index * step).toPrecision(12)),
  );
  return { domain: [niceMinimum, niceMaximum], ticks };
}

/**
 * Maps a value linearly between a numeric domain and output range.
 *
 * @param {number} value - Input value to project.
 * @param {[number, number]} domain - Input endpoints defining the interpolation ratio.
 * @param {[number, number]} range - Output endpoints receiving the projected value.
 * @returns {number} Linearly projected output value.
 */
function scale(value, domain, range) {
  return range[0] + ((value - domain[0]) / (domain[1] - domain[0])) * (range[1] - range[0]);
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
  const slopes = intervals.map((interval, index) => (points[index + 1].y - points[index].y) / interval);
  const tangents = points.map((_point, index) => {
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

  let path = `M${points[0].x},${points[0].y}`;
  for (const [index, point] of points.slice(1).entries()) {
    const previous = points[index];
    const interval = intervals[index];
    const firstControl = { x: previous.x + interval / 3, y: previous.y + (tangents[index] * interval) / 3 };
    const secondControl = { x: point.x - interval / 3, y: point.y - (tangents[index + 1] * interval) / 3 };
    path += ` C${firstControl.x},${firstControl.y} ${secondControl.x},${secondControl.y} ${point.x},${point.y}`;
  }
  return path;
}

/**
 * Builds a bar outline with rounding only on the end representing its value.
 *
 * @param {object} geometry - Rectangle and rounding geometry for one bar.
 * @param {number} geometry.x - Left edge in SVG coordinates.
 * @param {number} geometry.y - Top edge in SVG coordinates.
 * @param {number} geometry.width - Non-negative bar width.
 * @param {number} geometry.height - Non-negative bar height.
 * @param {"horizontal" | "vertical"} geometry.orientation - Direction in which the value grows.
 * @param {number} geometry.value - Signed value that determines the rounded edge.
 * @param {number} geometry.radius - Requested corner radius in pixels.
 * @param {boolean} [geometry.shouldRoundValueEnd=true] - Disables rounding when false.
 * @returns {string} Closed SVG path data for the bar.
 */
function roundedBarPath({ x, y, width, height, orientation, value, radius, shouldRoundValueEnd = true }) {
  const appliedRadius = shouldRoundValueEnd ? Math.min(radius, width / 2, height / 2) : 0;
  if (width <= 0 || height <= 0) {
    return `M${x},${y}Z`;
  }
  if (appliedRadius <= 0) {
    return `M${x},${y}H${x + width}V${y + height}H${x}Z`;
  }

  const right = x + width;
  const bottom = y + height;
  if (orientation === ChartOrientation.HORIZONTAL && value >= 0) {
    return `M${x},${y}H${right - appliedRadius}Q${right},${y} ${right},${y + appliedRadius}V${bottom - appliedRadius}Q${right},${bottom} ${right - appliedRadius},${bottom}H${x}Z`;
  }
  if (orientation === ChartOrientation.HORIZONTAL) {
    return `M${right},${y}H${x + appliedRadius}Q${x},${y} ${x},${y + appliedRadius}V${bottom - appliedRadius}Q${x},${bottom} ${x + appliedRadius},${bottom}H${right}Z`;
  }
  if (value >= 0) {
    return `M${x},${bottom}V${y + appliedRadius}Q${x},${y} ${x + appliedRadius},${y}H${right - appliedRadius}Q${right},${y} ${right},${y + appliedRadius}V${bottom}Z`;
  }
  return `M${x},${y}V${bottom - appliedRadius}Q${x},${bottom} ${x + appliedRadius},${bottom}H${right - appliedRadius}Q${right},${bottom} ${right},${bottom - appliedRadius}V${y}Z`;
}

/**
 * Converts polar coordinates into an SVG Cartesian point.
 *
 * @param {object} coordinate - Polar coordinate to project.
 * @param {number} coordinate.cx - Circle center x coordinate.
 * @param {number} coordinate.cy - Circle center y coordinate.
 * @param {number} coordinate.radius - Distance from the center.
 * @param {number} coordinate.angle - Direction in radians.
 * @returns {{x: number, y: number}} Cartesian point on the requested ray.
 */
function polarPoint({ cx, cy, radius, angle }) {
  return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
}

/**
 * Moves from one point toward another by an exact Euclidean distance.
 *
 * @param {{x: number, y: number}} from - Starting coordinate.
 * @param {{x: number, y: number}} to - Target coordinate defining the direction.
 * @param {number} distance - Distance to travel from the starting coordinate.
 * @returns {{x: number, y: number}} Point located on the directed segment.
 */
function pointToward(from, to, distance) {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  return {
    x: from.x + ((to.x - from.x) / length) * distance,
    y: from.y + ((to.y - from.y) / length) * distance,
  };
}

/**
 * Builds a closed circular sector from the center to two radial endpoints.
 *
 * @param {object} geometry - Solid sector geometry.
 * @param {number} geometry.cx - Circle center x coordinate.
 * @param {number} geometry.cy - Circle center y coordinate.
 * @param {number} geometry.radius - Outer sector radius.
 * @param {number} geometry.startAngle - Inclusive start angle in radians.
 * @param {number} geometry.endAngle - Inclusive end angle in radians.
 * @returns {string} Closed SVG path data for the sector.
 */
function arcPath({ cx, cy, radius, startAngle, endAngle }) {
  const start = polarPoint({ cx, cy, radius, angle: startAngle });
  const end = polarPoint({ cx, cy, radius, angle: endAngle });
  return `M${cx},${cy} L${start.x},${start.y} A${radius},${radius} 0 0 1 ${end.x},${end.y} Z`;
}

/**
 * Builds a closed annular sector with independently adjustable inner angles.
 *
 * @param {object} geometry - Annular sector geometry.
 * @param {number} geometry.cx - Ring center x coordinate.
 * @param {number} geometry.cy - Ring center y coordinate.
 * @param {number} geometry.outerRadius - Radius of the outer arc.
 * @param {number} geometry.innerRadius - Radius of the inner arc.
 * @param {number} geometry.outerStartAngle - Outer arc start angle in radians.
 * @param {number} geometry.outerEndAngle - Outer arc end angle in radians.
 * @param {number} [geometry.innerStartAngle=geometry.outerStartAngle] - Inner arc start angle in radians.
 * @param {number} [geometry.innerEndAngle=geometry.outerEndAngle] - Inner arc end angle in radians.
 * @returns {string} Closed SVG path data for the ring segment.
 */
function ringPath({
  cx,
  cy,
  outerRadius,
  innerRadius,
  outerStartAngle,
  outerEndAngle,
  innerStartAngle = outerStartAngle,
  innerEndAngle = outerEndAngle,
}) {
  const outerStart = polarPoint({ cx, cy, radius: outerRadius, angle: outerStartAngle });
  const outerEnd = polarPoint({ cx, cy, radius: outerRadius, angle: outerEndAngle });
  const innerStart = polarPoint({ cx, cy, radius: innerRadius, angle: innerStartAngle });
  const innerEnd = polarPoint({ cx, cy, radius: innerRadius, angle: innerEndAngle });
  const outerLarge = outerEndAngle - outerStartAngle > Math.PI ? 1 : 0;
  const innerLarge = innerEndAngle - innerStartAngle > Math.PI ? 1 : 0;
  return `M${outerStart.x},${outerStart.y} A${outerRadius},${outerRadius} 0 ${outerLarge} 1 ${outerEnd.x},${outerEnd.y} L${innerEnd.x},${innerEnd.y} A${innerRadius},${innerRadius} 0 ${innerLarge} 0 ${innerStart.x},${innerStart.y} Z`;
}

/**
 * Rounds the two outer corners of a solid circular sector.
 *
 * @param {object} geometry - Values describing one solid sector.
 * @param {number} geometry.cx - Sector center x coordinate.
 * @param {number} geometry.cy - Sector center y coordinate.
 * @param {number} geometry.outerRadius - Radius of the outer arc.
 * @param {number} geometry.outerStartAngle - Outer arc start angle in radians.
 * @param {number} geometry.outerEndAngle - Outer arc end angle in radians.
 * @param {number} geometry.cornerRadius - Requested corner radius.
 * @returns {string} Closed SVG path data for the rounded solid sector.
 */
function roundedSolidSectorPath({ cx, cy, outerRadius, outerStartAngle, outerEndAngle, cornerRadius }) {
  const outerStart = polarPoint({ cx, cy, radius: outerRadius, angle: outerStartAngle });
  const outerEnd = polarPoint({ cx, cy, radius: outerRadius, angle: outerEndAngle });
  const appliedRadius = Math.min(cornerRadius, outerRadius / 2, (outerRadius * (outerEndAngle - outerStartAngle)) / 2);
  if (appliedRadius <= 0) {
    return arcPath({ cx, cy, radius: outerRadius, startAngle: outerStartAngle, endAngle: outerEndAngle });
  }
  const outerDelta = Math.asin(Math.min(1, appliedRadius / outerRadius));
  const arcStart = polarPoint({ cx, cy, radius: outerRadius, angle: outerStartAngle + outerDelta });
  const arcEnd = polarPoint({ cx, cy, radius: outerRadius, angle: outerEndAngle - outerDelta });
  const center = { x: cx, y: cy };
  const startSide = pointToward(outerStart, center, appliedRadius);
  const endSide = pointToward(outerEnd, center, appliedRadius);
  const large = outerEndAngle - outerStartAngle - outerDelta * 2 > Math.PI ? 1 : 0;
  return `M${cx},${cy}L${startSide.x},${startSide.y}Q${outerStart.x},${outerStart.y} ${arcStart.x},${arcStart.y}A${outerRadius},${outerRadius} 0 ${large} 1 ${arcEnd.x},${arcEnd.y}Q${outerEnd.x},${outerEnd.y} ${endSide.x},${endSide.y}L${cx},${cy}Z`;
}

/**
 * Builds a sector or ring segment with radius-aware rounded corners.
 *
 * @param {object} geometry - Values describing one rounded sector.
 * @param {number} geometry.cx - Sector center x coordinate.
 * @param {number} geometry.cy - Sector center y coordinate.
 * @param {number} geometry.outerRadius - Radius of the outer arc.
 * @param {number} geometry.innerRadius - Radius of the inner arc, or zero for a solid sector.
 * @param {number} geometry.outerStartAngle - Outer arc start angle in radians.
 * @param {number} geometry.outerEndAngle - Outer arc end angle in radians.
 * @param {number} geometry.innerStartAngle - Inner arc start angle in radians.
 * @param {number} geometry.innerEndAngle - Inner arc end angle in radians.
 * @param {number} geometry.cornerRadius - Requested corner radius constrained by available geometry.
 * @returns {string} Closed SVG path data with non-overlapping rounded corners.
 */
function roundedSectorPath({
  cx,
  cy,
  outerRadius,
  innerRadius,
  outerStartAngle,
  outerEndAngle,
  innerStartAngle,
  innerEndAngle,
  cornerRadius,
}) {
  if (cornerRadius <= 0) {
    return innerRadius > 0
      ? ringPath({ cx, cy, outerRadius, innerRadius, outerStartAngle, outerEndAngle, innerStartAngle, innerEndAngle })
      : arcPath({ cx, cy, radius: outerRadius, startAngle: outerStartAngle, endAngle: outerEndAngle });
  }

  if (innerRadius <= 0) {
    return roundedSolidSectorPath({ cx, cy, outerRadius, outerStartAngle, outerEndAngle, cornerRadius });
  }

  const outerStart = polarPoint({ cx, cy, radius: outerRadius, angle: outerStartAngle });
  const outerEnd = polarPoint({ cx, cy, radius: outerRadius, angle: outerEndAngle });
  const innerStart = polarPoint({ cx, cy, radius: innerRadius, angle: innerStartAngle });
  const innerEnd = polarPoint({ cx, cy, radius: innerRadius, angle: innerEndAngle });
  const startSideLength = Math.hypot(outerStart.x - innerStart.x, outerStart.y - innerStart.y);
  const endSideLength = Math.hypot(outerEnd.x - innerEnd.x, outerEnd.y - innerEnd.y);
  const appliedRadius = Math.min(
    cornerRadius,
    startSideLength / 2,
    endSideLength / 2,
    (outerRadius * (outerEndAngle - outerStartAngle)) / 2,
    (innerRadius * (innerEndAngle - innerStartAngle)) / 2,
  );
  const outerDelta = Math.asin(Math.min(1, appliedRadius / outerRadius));
  const innerDelta = Math.asin(Math.min(1, appliedRadius / innerRadius));
  const outerArcStart = polarPoint({ cx, cy, radius: outerRadius, angle: outerStartAngle + outerDelta });
  const outerArcEnd = polarPoint({ cx, cy, radius: outerRadius, angle: outerEndAngle - outerDelta });
  const innerArcEnd = polarPoint({ cx, cy, radius: innerRadius, angle: innerEndAngle - innerDelta });
  const innerArcStart = polarPoint({ cx, cy, radius: innerRadius, angle: innerStartAngle + innerDelta });
  const outerEndSide = pointToward(outerEnd, innerEnd, appliedRadius);
  const innerEndSide = pointToward(innerEnd, outerEnd, appliedRadius);
  const innerStartSide = pointToward(innerStart, outerStart, appliedRadius);
  const outerStartSide = pointToward(outerStart, innerStart, appliedRadius);
  const outerLarge = outerEndAngle - outerStartAngle - outerDelta * 2 > Math.PI ? 1 : 0;
  const innerLarge = innerEndAngle - innerStartAngle - innerDelta * 2 > Math.PI ? 1 : 0;
  return `M${outerArcStart.x},${outerArcStart.y}A${outerRadius},${outerRadius} 0 ${outerLarge} 1 ${outerArcEnd.x},${outerArcEnd.y}Q${outerEnd.x},${outerEnd.y} ${outerEndSide.x},${outerEndSide.y}L${innerEndSide.x},${innerEndSide.y}Q${innerEnd.x},${innerEnd.y} ${innerArcEnd.x},${innerArcEnd.y}A${innerRadius},${innerRadius} 0 ${innerLarge} 0 ${innerArcStart.x},${innerArcStart.y}Q${innerStart.x},${innerStart.y} ${innerStartSide.x},${innerStartSide.y}L${outerStartSide.x},${outerStartSide.y}Q${outerStart.x},${outerStart.y} ${outerArcStart.x},${outerArcStart.y}Z`;
}

/**
 * Insets a sector's arcs to create a stable visual gap between neighbours.
 *
 * @param {object} geometry - Source sector and padding geometry.
 * @param {number} geometry.startAngle - Original sector start angle in radians.
 * @param {number} geometry.endAngle - Original sector end angle in radians.
 * @param {number} geometry.padAngle - Requested angular gap in degrees.
 * @param {number} geometry.outerRadius - Radius used to derive the outer inset.
 * @param {number} geometry.innerRadius - Radius used to derive the inner inset.
 * @param {number} geometry.sectorCount - Number of adjacent sectors in the chart.
 * @returns {{outerStart: number, outerEnd: number, innerStart: number, innerEnd: number}} Insets constrained to preserve a visible sweep.
 */
function paddedSector({ startAngle, endAngle, padAngle, outerRadius, innerRadius, sectorCount }) {
  const sweep = endAngle - startAngle;
  if (sectorCount <= 1 || padAngle === 0 || sweep <= 0) {
    return { outerStart: startAngle, outerEnd: endAngle, innerStart: startAngle, innerEnd: endAngle };
  }
  const halfPad = (padAngle * Math.PI) / 360;
  const padRadius = Math.hypot(outerRadius, innerRadius);
  const radiusInset = (radius) => {
    if (radius <= 0) {
      return 0;
    }
    return Math.asin(Math.min(1, (padRadius / radius) * Math.sin(halfPad)));
  };
  const maximumInset = Math.max(0, (sweep - MIN_SECTOR_SWEEP) / 2);
  const outerInset = Math.min(radiusInset(outerRadius), maximumInset);
  const innerInset = Math.min(radiusInset(innerRadius), maximumInset);
  return {
    outerStart: startAngle + outerInset,
    outerEnd: endAngle - outerInset,
    innerStart: startAngle + innerInset,
    innerEnd: endAngle - innerInset,
  };
}

export {
  extent,
  niceStep,
  niceValueScale,
  scale,
  linePath,
  roundedBarPath,
  polarPoint,
  pointToward,
  arcPath,
  ringPath,
  roundedSectorPath,
  paddedSector,
};
