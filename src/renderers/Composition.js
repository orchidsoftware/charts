import { ChartType, DEFAULT_SECTOR_CORNER_RADIUS } from "../support/Constants.js";
import { paddedSector, roundedSectorPath } from "../support/Math.js";

/**
 * Owns normalized part-to-whole values and their non-DOM sector geometry.
 */
export default class Composition {
  #chart;

  /**
   * Aggregates chart datasets into a bounded immutable set of positive parts.
   *
   * @param {object} chart - Frozen composition data and options.
   * @throws {TypeError} When the resulting composition has no positive total.
   */
  constructor(chart) {
    this.#chart = chart;
    this.parts = Object.freeze(this.#parts());
    this.total = this.parts.reduce((sum, part) => sum + part.value, 0);
    if (this.total <= 0) {
      throw new TypeError(`${chart.options.type} chart requires a positive total`);
    }
    Object.freeze(this);
  }

  /**
   * Calculates the share of the whole represented by one part.
   *
   * @param {{value: number}} part - Normalized composition part.
   * @returns {number} Ratio between zero and one.
   */
  shareOf(part) {
    return part.value / this.total;
  }

  /**
   * Resolves ordered pie or donut shapes without creating SVG nodes.
   *
   * @param {object} frame - Radial center, radius, type, and palette.
   * @param {number} frame.cx - Horizontal radial center.
   * @param {number} frame.cy - Vertical radial center.
   * @param {number} frame.radius - Maximum sector radius.
   * @param {string} frame.type - Pie or donut chart type.
   * @param {string[]} frame.colors - Cyclic sector palette.
   * @returns {Array<object>} Ordered circle or path descriptors for positive parts.
   */
  sectors({ cx, cy, radius, type, colors }) {
    let angle = -Math.PI / 2 + ((this.#chart.options.startAngle ?? 0) * Math.PI) / 180;
    const positiveCount = this.parts.filter((part) => part.value > 0).length;
    const sectors = [];
    for (const [index, part] of this.parts.entries()) {
      const next = angle + this.shareOf(part) * Math.PI * 2;
      if (part.value > 0) {
        sectors.push(this.#sector({ part, index, angle, next, cx, cy, radius, type, colors, positiveCount }));
      }
      angle = next;
    }
    return sectors;
  }

  /**
   * Aggregates labels across datasets and applies the configured part limit.
   *
   * @returns {Array<{label: string, value: number}>} Display-ready composition parts.
   */
  #parts() {
    const candidates = this.#chart.labels
      .map((label, index) => ({
        label,
        value: this.#chart.datasets.reduce((sum, dataset) => sum + (dataset.points[index]?.y ?? 0), 0),
      }))
      .filter((part) => part.value >= 0);
    const maximum = this.#chart.options.maxSlices ?? 20;
    if (candidates.length <= maximum) {
      return candidates;
    }
    const sorted = candidates.toSorted((left, right) => right.value - left.value);
    const visible = sorted.slice(0, maximum - 1);
    const rest = sorted.slice(maximum - 1).reduce((sum, part) => sum + part.value, 0);
    return [...visible, { label: "Rest", value: rest }];
  }

  /**
   * Resolves one positive part into a circle or rounded path descriptor.
   *
   * @param {object} state - Part, angular, radial, and palette values.
   * @returns {object} SVG-independent sector descriptor.
   */
  #sector(state) {
    const { part, index, angle, next, cx, cy, radius, type, colors, positiveCount } = state;
    const color = colors[index % colors.length];
    if (type === ChartType.DONUT && this.parts.length === 1) {
      return {
        part,
        index,
        name: "circle",
        attributes: { cx, cy, r: radius * 0.72, fill: "none", stroke: color, "stroke-width": radius * 0.56 },
      };
    }
    if (type === ChartType.PIE && positiveCount === 1) {
      return { part, index, name: "circle", attributes: { cx, cy, r: radius, fill: color } };
    }
    const innerRadius = type === ChartType.DONUT ? radius * 0.48 : 0;
    const sector = paddedSector({
      startAngle: angle,
      endAngle: next,
      padAngle: this.#chart.options.padAngle,
      outerRadius: radius,
      innerRadius,
      sectorCount: positiveCount,
    });
    return {
      part,
      index,
      name: "path",
      attributes: {
        d: roundedSectorPath({
          cx,
          cy,
          outerRadius: radius,
          innerRadius,
          outerStartAngle: sector.outerStart,
          outerEndAngle: sector.outerEnd,
          innerStartAngle: sector.innerStart,
          innerEndAngle: sector.innerEnd,
          cornerRadius: this.#chart.options.sectorOptions?.cornerRadius ?? DEFAULT_SECTOR_CORNER_RADIUS,
        }),
        fill: color,
      },
    };
  }
}
