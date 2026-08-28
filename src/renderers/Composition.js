import { ChartType, DEFAULT_SECTOR_CORNER_RADIUS } from "../support/Constants.js";
import { paddedSector, roundedSectorPath } from "../support/Math.js";

const DEGREES_PER_HALF_CIRCLE = 180;
const DEFAULT_MAXIMUM_SLICES = 20;
const DONUT_STROKE_RADIUS_RATIO = 0.72;
const DONUT_STROKE_WIDTH_RATIO = 0.56;
const DONUT_INNER_RADIUS_RATIO = 0.48;

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
   * @param {{x: number, y: number}} center - Radial center.
   * @param {number} radius - Maximum sector radius.
   * @param {object} presentation - Chart type and cyclic palette.
   * @returns {Array<object>} Ordered circle or path descriptors for positive parts.
   */
  sectors(center, radius, presentation) {
    let angle = -Math.PI / 2 + ((this.#chart.options.startAngle ?? 0) * Math.PI) / DEGREES_PER_HALF_CIRCLE;
    const positiveCount = this.parts.filter((part) => part.value > 0).length;
    const sectors = [];

    for (const [index, part] of this.parts.entries()) {
      const next = angle + this.shareOf(part) * Math.PI * 2;

      if (part.value > 0) {
        const identity = { part, index };
        const geometry = { center, radius, angles: { start: angle, end: next }, positiveCount };

        sectors.push(this.#sector(identity, geometry, presentation));
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

    const maximum = this.#chart.options.maxSlices ?? DEFAULT_MAXIMUM_SLICES;

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
   * @param {object} identity - Composition part and stable index.
   * @param {object} geometry - Center, radius, interval, and positive count.
   * @param {object} presentation - Chart type and cyclic palette.
   * @returns {object} SVG-independent sector descriptor.
   */
  #sector(identity, geometry, presentation) {
    const color = presentation.colors[identity.index % presentation.colors.length];
    const circle = { center: geometry.center, radius: geometry.radius, color };

    if (presentation.type === ChartType.DONUT && this.parts.length === 1) {
      return this.#donutCircle(identity, circle);
    }

    if (presentation.type === ChartType.PIE && geometry.positiveCount === 1) {
      return this.#pieCircle(identity, circle);
    }

    return this.#pathSector(identity, geometry, { type: presentation.type, color });
  }

  /**
   * Describes a multi-part pie or donut sector as a padded path.
   *
   * @param {object} identity - Composition part and stable index.
   * @param {object} geometry - Center, radius, interval, and positive count.
   * @param {object} presentation - Chart type and resolved color.
   * @returns {object} SVG-independent path descriptor.
   */
  #pathSector(identity, geometry, presentation) {
    const innerRadius = presentation.type === ChartType.DONUT ? geometry.radius * DONUT_INNER_RADIUS_RATIO : 0;
    const radii = { outer: geometry.radius, inner: innerRadius };

    const sector = paddedSector({
      angles: geometry.angles,
      radii,
      padding: { angle: this.#chart.options.padAngle, count: geometry.positiveCount },
    });

    const d = roundedSectorPath({
      center: geometry.center,
      radii,
      angles: { outer: sector.outer, inner: sector.inner },
      cornerRadius: this.#chart.options.sectorOptions?.cornerRadius ?? DEFAULT_SECTOR_CORNER_RADIUS,
    });

    return { part: identity.part, index: identity.index, name: "path", attributes: { d, fill: presentation.color } };
  }

  /**
   * Describes the single-part donut as one stroked circle.
   *
   * @param {object} identity - Composition part and stable index.
   * @param {object} circle - Center, radius, and resolved color.
   * @returns {object} SVG-independent circle descriptor.
   */
  #donutCircle(identity, circle) {
    return {
      part: identity.part,
      index: identity.index,
      name: "circle",
      attributes: {
        cx: circle.center.x,
        cy: circle.center.y,
        r: circle.radius * DONUT_STROKE_RADIUS_RATIO,
        fill: "none",
        stroke: circle.color,
        "stroke-width": circle.radius * DONUT_STROKE_WIDTH_RATIO,
      },
    };
  }

  /**
   * Describes the single-part pie as a filled circle.
   *
   * @param {object} identity - Composition part and stable index.
   * @param {object} circle - Center, radius, and resolved color.
   * @returns {object} SVG-independent circle descriptor.
   */
  #pieCircle(identity, circle) {
    return {
      part: identity.part,
      index: identity.index,
      name: "circle",
      attributes: { cx: circle.center.x, cy: circle.center.y, r: circle.radius, fill: circle.color },
    };
  }
}
