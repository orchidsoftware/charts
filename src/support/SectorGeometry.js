import { MIN_SECTOR_SWEEP } from "./Constants.js";

const DEGREES_PER_CIRCLE = 360;

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
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  };
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
 * @param {object} geometry - Center, radius, and angular interval.
 * @param {{x: number, y: number}} geometry.center - Circle center.
 * @param {number} geometry.radius - Distance from center to boundary.
 * @param {{start: number, end: number}} geometry.angles - Angular interval in radians.
 * @returns {string} Closed SVG path data for the sector.
 */
function arcPath({ center, radius, angles }) {
  const start = polarPoint({ cx: center.x, cy: center.y, radius, angle: angles.start });
  const end = polarPoint({ cx: center.x, cy: center.y, radius, angle: angles.end });

  return `M${center.x},${center.y} L${start.x},${start.y} A${radius},${radius} 0 0 1 ${end.x},${end.y} Z`;
}

/**
 * Builds a closed annular sector with independently adjustable inner angles.
 *
 * @param {object} geometry - Center, radii, and independent angular intervals.
 * @param {{x: number, y: number}} geometry.center - Circle center.
 * @param {{outer: number, inner: number}} geometry.radii - Ring boundary radii.
 * @param {{start: number, end: number}} geometry.outerAngles - Outer angular interval.
 * @param {{start: number, end: number}} [geometry.innerAngles=geometry.outerAngles] - Inner angular interval.
 * @returns {string} Closed SVG path data for the ring segment.
 */
function ringPath({ center, radii, outerAngles, innerAngles = outerAngles }) {
  const outerStart = polarPoint({
    cx: center.x,
    cy: center.y,
    radius: radii.outer,
    angle: outerAngles.start,
  });

  const outerEnd = polarPoint({ cx: center.x, cy: center.y, radius: radii.outer, angle: outerAngles.end });

  const innerStart = polarPoint({
    cx: center.x,
    cy: center.y,
    radius: radii.inner,
    angle: innerAngles.start,
  });

  const innerEnd = polarPoint({ cx: center.x, cy: center.y, radius: radii.inner, angle: innerAngles.end });
  const outerLarge = outerAngles.end - outerAngles.start > Math.PI ? 1 : 0;
  const innerLarge = innerAngles.end - innerAngles.start > Math.PI ? 1 : 0;

  return `M${outerStart.x},${outerStart.y} A${radii.outer},${radii.outer} 0 ${outerLarge} 1 ${outerEnd.x},${outerEnd.y} L${innerEnd.x},${innerEnd.y} A${radii.inner},${radii.inner} 0 ${innerLarge} 0 ${innerStart.x},${innerStart.y} Z`;
}

/**
 * Rounds the two outer corners of a solid circular sector.
 *
 * @param {object} geometry - Center, radius, interval, and corner policy.
 * @param {{x: number, y: number}} geometry.center - Circle center.
 * @param {number} geometry.radius - Distance from center to boundary.
 * @param {{start: number, end: number}} geometry.angles - Angular interval.
 * @param {number} geometry.cornerRadius - Requested corner radius.
 * @returns {string} Closed SVG path data for the rounded solid sector.
 */
function roundedSolidSectorPath({ center, radius, angles, cornerRadius }) {
  const outerStart = polarPoint({ cx: center.x, cy: center.y, radius, angle: angles.start });
  const outerEnd = polarPoint({ cx: center.x, cy: center.y, radius, angle: angles.end });
  const appliedRadius = Math.min(cornerRadius, radius / 2, (radius * (angles.end - angles.start)) / 2);

  if (appliedRadius <= 0) {
    return arcPath({ center, radius, angles });
  }

  const outerDelta = Math.asin(Math.min(1, appliedRadius / radius));
  const arcStart = polarPoint({ cx: center.x, cy: center.y, radius, angle: angles.start + outerDelta });
  const arcEnd = polarPoint({ cx: center.x, cy: center.y, radius, angle: angles.end - outerDelta });
  const startSide = pointToward(outerStart, center, appliedRadius);
  const endSide = pointToward(outerEnd, center, appliedRadius);
  const large = angles.end - angles.start - outerDelta * 2 > Math.PI ? 1 : 0;

  return `M${center.x},${center.y}L${startSide.x},${startSide.y}Q${outerStart.x},${outerStart.y} ${arcStart.x},${arcStart.y}A${radius},${radius} 0 ${large} 1 ${arcEnd.x},${arcEnd.y}Q${outerEnd.x},${outerEnd.y} ${endSide.x},${endSide.y}L${center.x},${center.y}Z`;
}

/**
 * Creates the four endpoints of an annular sector.
 *
 * @param {object} geometry - Center, radii, and inner and outer intervals.
 * @param {{x: number, y: number}} geometry.center - Circle center.
 * @param {{outer: number, inner: number}} geometry.radii - Ring boundary radii.
 * @param {{start: number, end: number}} geometry.outerAngles - Outer interval.
 * @param {{start: number, end: number}} geometry.innerAngles - Inner interval.
 * @returns {object} Inner and outer start and end points.
 */
function ringPoints({ center, radii, outerAngles, innerAngles }) {
  return {
    outerStart: polarPoint({ cx: center.x, cy: center.y, radius: radii.outer, angle: outerAngles.start }),
    outerEnd: polarPoint({ cx: center.x, cy: center.y, radius: radii.outer, angle: outerAngles.end }),
    innerStart: polarPoint({ cx: center.x, cy: center.y, radius: radii.inner, angle: innerAngles.start }),
    innerEnd: polarPoint({ cx: center.x, cy: center.y, radius: radii.inner, angle: innerAngles.end }),
  };
}

/**
 * Constrains a requested ring corner radius to the available geometry.
 *
 * @param {object} state - Ring geometry and its resolved endpoints.
 * @param {object} state.geometry - Ring radii, angles, and corner request.
 * @param {object} state.points - Inner and outer sector endpoints.
 * @returns {number} Non-overlapping corner radius.
 */
function ringCornerRadius({ geometry, points }) {
  const startSide = Math.hypot(
    points.outerStart.x - points.innerStart.x,
    points.outerStart.y - points.innerStart.y,
  );

  const endSide = Math.hypot(points.outerEnd.x - points.innerEnd.x, points.outerEnd.y - points.innerEnd.y);

  return Math.min(
    geometry.cornerRadius,
    startSide / 2,
    endSide / 2,
    (geometry.radii.outer * (geometry.angles.outer.end - geometry.angles.outer.start)) / 2,
    (geometry.radii.inner * (geometry.angles.inner.end - geometry.angles.inner.start)) / 2,
  );
}

/**
 * Resolves rounded arc endpoints for an annular sector.
 *
 * @param {object} geometry - Complete rounded ring geometry.
 * @param {number} appliedRadius - Constrained corner radius.
 * @returns {object} Rounded arc endpoints and angular deltas.
 */
function roundedRingArcs(geometry, appliedRadius) {
  const outerDelta = Math.asin(Math.min(1, appliedRadius / geometry.radii.outer));
  const innerDelta = Math.asin(Math.min(1, appliedRadius / geometry.radii.inner));

  return {
    outerDelta,
    innerDelta,
    outerStart: polarPoint({
      cx: geometry.center.x,
      cy: geometry.center.y,
      radius: geometry.radii.outer,
      angle: geometry.angles.outer.start + outerDelta,
    }),
    outerEnd: polarPoint({
      cx: geometry.center.x,
      cy: geometry.center.y,
      radius: geometry.radii.outer,
      angle: geometry.angles.outer.end - outerDelta,
    }),
    innerEnd: polarPoint({
      cx: geometry.center.x,
      cy: geometry.center.y,
      radius: geometry.radii.inner,
      angle: geometry.angles.inner.end - innerDelta,
    }),
    innerStart: polarPoint({
      cx: geometry.center.x,
      cy: geometry.center.y,
      radius: geometry.radii.inner,
      angle: geometry.angles.inner.start + innerDelta,
    }),
  };
}

/**
 * Builds a radius-aware rounded annular sector.
 *
 * @param {object} geometry - Complete rounded ring geometry.
 * @returns {string} Closed rounded ring path.
 */
function roundedRingPath(geometry) {
  const points = ringPoints({
    center: geometry.center,
    radii: geometry.radii,
    outerAngles: geometry.angles.outer,
    innerAngles: geometry.angles.inner,
  });

  const appliedRadius = ringCornerRadius({ geometry, points });
  const arcs = roundedRingArcs(geometry, appliedRadius);

  const sides = {
    outerEnd: pointToward(points.outerEnd, points.innerEnd, appliedRadius),
    innerEnd: pointToward(points.innerEnd, points.outerEnd, appliedRadius),
    innerStart: pointToward(points.innerStart, points.outerStart, appliedRadius),
    outerStart: pointToward(points.outerStart, points.innerStart, appliedRadius),
  };

  const outerLarge =
    geometry.angles.outer.end - geometry.angles.outer.start - arcs.outerDelta * 2 > Math.PI ? 1 : 0;

  const innerLarge =
    geometry.angles.inner.end - geometry.angles.inner.start - arcs.innerDelta * 2 > Math.PI ? 1 : 0;

  return `M${arcs.outerStart.x},${arcs.outerStart.y}A${geometry.radii.outer},${geometry.radii.outer} 0 ${outerLarge} 1 ${arcs.outerEnd.x},${arcs.outerEnd.y}Q${points.outerEnd.x},${points.outerEnd.y} ${sides.outerEnd.x},${sides.outerEnd.y}L${sides.innerEnd.x},${sides.innerEnd.y}Q${points.innerEnd.x},${points.innerEnd.y} ${arcs.innerEnd.x},${arcs.innerEnd.y}A${geometry.radii.inner},${geometry.radii.inner} 0 ${innerLarge} 0 ${arcs.innerStart.x},${arcs.innerStart.y}Q${points.innerStart.x},${points.innerStart.y} ${sides.innerStart.x},${sides.innerStart.y}L${sides.outerStart.x},${sides.outerStart.y}Q${points.outerStart.x},${points.outerStart.y} ${arcs.outerStart.x},${arcs.outerStart.y}Z`;
}

/**
 * Builds a sector or ring segment with radius-aware rounded corners.
 *
 * @param {object} geometry - Values describing one rounded sector.
 * @returns {string} Closed SVG path data with non-overlapping rounded corners.
 */
function roundedSectorPath(geometry) {
  if (geometry.cornerRadius <= 0 && geometry.radii.inner > 0) {
    return ringPath({
      center: geometry.center,
      radii: geometry.radii,
      outerAngles: geometry.angles.outer,
      innerAngles: geometry.angles.inner,
    });
  }

  if (geometry.cornerRadius <= 0) {
    return arcPath({
      center: geometry.center,
      radius: geometry.radii.outer,
      angles: geometry.angles.outer,
    });
  }

  if (geometry.radii.inner <= 0) {
    return roundedSolidSectorPath({
      center: geometry.center,
      radius: geometry.radii.outer,
      angles: geometry.angles.outer,
      cornerRadius: geometry.cornerRadius,
    });
  }

  return roundedRingPath(geometry);
}

/**
 * Insets a sector's arcs to create a stable visual gap between neighbours.
 *
 * @param {object} geometry - Angular interval, radii, and padding policy.
 * @param {{start: number, end: number}} geometry.angles - Unpadded interval.
 * @param {{outer: number, inner: number}} geometry.radii - Sector boundary radii.
 * @param {{angle: number, count: number}} geometry.padding - Gap and neighbour count.
 * @returns {{outer: {start: number, end: number}, inner: {start: number, end: number}}} Insets constrained to preserve a visible sweep.
 */
function paddedSector({ angles, radii, padding }) {
  const sweep = angles.end - angles.start;

  if (padding.count <= 1 || padding.angle === 0 || sweep <= 0) {
    return {
      outer: { ...angles },
      inner: { ...angles },
    };
  }

  const halfPad = (padding.angle * Math.PI) / DEGREES_PER_CIRCLE;
  const padRadius = Math.hypot(radii.outer, radii.inner);

  const radiusInset = (radius) => {
    if (radius <= 0) {
      return 0;
    }

    return Math.asin(Math.min(1, (padRadius / radius) * Math.sin(halfPad)));
  };

  const maximumInset = Math.max(0, (sweep - MIN_SECTOR_SWEEP) / 2);
  const outerInset = Math.min(radiusInset(radii.outer), maximumInset);
  const innerInset = Math.min(radiusInset(radii.inner), maximumInset);

  return {
    outer: { start: angles.start + outerInset, end: angles.end - outerInset },
    inner: { start: angles.start + innerInset, end: angles.end - innerInset },
  };
}

export { arcPath, paddedSector, pointToward, polarPoint, ringPath, roundedSectorPath };
