import { svg } from "../../support/Dom.js";
import { polarPoint, ringPath } from "../../support/geometry/Math.js";
import { formatLabel, formatValue, seriesContext } from "../../support/presentation/Formatting.js";

const CENTER_DEAD_ZONE = 10;
const INSPECTION_RADIUS_RATIO = 1.28;
const VERTICAL_AXIS_THRESHOLD = 0.5;
const CENTER_RADIUS_RATIO = 0.25;

/**
 * Chooses the outward side of a radar axis for its shared tooltip anchor.
 *
 * @param {number} angle - Axis direction in radians.
 * @returns {string} Preferred tooltip placement.
 */
function axisPlacement(angle) {
  if (Math.abs(Math.cos(angle)) < VERTICAL_AXIS_THRESHOLD) {
    return Math.sin(angle) < 0 ? "top" : "bottom";
  }

  return Math.cos(angle) < 0 ? "left" : "right";
}

/**
 * Inspects each radar measure across all series using generous angular sectors.
 */
export default class RadarInspectorRenderer {
  #chart;
  #surface;

  /**
   * Captures the immutable chart snapshot and its drawing surface.
   *
   * @param {object} rendering - Chart and SVG surface for the current render pass.
   * @param {object} rendering.chart - Normalized radar data and options.
   * @param {import("../SvgSurface.js").default} rendering.surface - Owned SVG drawing surface.
   */
  constructor({ chart, surface }) {
    this.#chart = chart;
    this.#surface = surface;
  }

  /**
   * Covers every axis with a sector independent of the visible profile sizes.
   *
   * @param {object} center - Radar center coordinates.
   * @param {object} scale - Shared radius, maximum and category count.
   * @returns {void} Inspectable categories are appended in label order.
   */
  render(center, scale) {
    for (let index = 0; index < scale.count; index += 1) {
      this.#renderAxis(index, center, scale);
    }
  }

  /**
   * Builds one axis target, its visual feedback, and the usual series tooltip.
   *
   * @param {number} index - Category index shared by all profiles.
   * @param {object} center - Radar center coordinates.
   * @param {object} scale - Shared radial scale.
   * @returns {void} One category group is appended.
   */
  #renderAxis(index, center, scale) {
    const angle = -Math.PI / 2 + (index / scale.count) * Math.PI * 2;
    const endpoint = polarPoint({ cx: center.x, cy: center.y, radius: scale.radius, angle });
    const group = svg("g", { class: "orchid-charts-radar-axis orchid-charts-mark" });
    group.append(this.#target(center, scale, angle));
    group.append(this.#guide(index, { center, scale, endpoint }));
    const items = this.#itemsAt(index);
    const context = { ...seriesContext(this.#chart, 0, index), target: "tooltip" };
    const heading = String(formatLabel(this.#chart.options, context.label, context));
    const summary = items.map((item) => `${item.name}: ${item.value}`).join(" · ");

    this.#surface.mark(
      group,
      {},
      {
        kind: "category",
        dataset: 0,
        point: index,
        title: `${heading} — ${summary}`,
        tooltip: { heading, items, wrapNames: true },
        anchor: {
          ...endpoint,
          placement: axisPlacement(angle),
          contentHeight: center.y * 2,
          fallback: {
            x: center.x * 2 - endpoint.x,
            y: center.y * 2 - endpoint.y,
            placement: axisPlacement(angle + Math.PI),
          },
        },
      },
    );
  }

  /**
   * Builds a transparent annular sector with a quiet center to avoid angle jitter.
   *
   * @param {object} center - Radar center coordinates.
   * @param {object} scale - Shared radius and axis count.
   * @param {number} angle - Axis direction in radians.
   * @returns {SVGElement} Hit path covering both sides of the axis.
   */
  #target(center, scale, angle) {
    const half = Math.PI / scale.count;

    const radii = {
      outer: scale.radius * INSPECTION_RADIUS_RATIO,
      inner: Math.min(CENTER_DEAD_ZONE, scale.radius * CENTER_RADIUS_RATIO),
    };

    // Two halves also cover the complete ring for a single-measure chart.
    const d = [
      { start: angle - half, end: angle },
      { start: angle, end: angle + half },
    ]
      .map((outerAngles) => ringPath({ center, radii, outerAngles }))
      .join(" ");

    return svg("path", { d, class: "orchid-charts-radar-hit" });
  }

  /**
   * Provides a subtle axis guide and a marker for each compared value.
   *
   * @param {number} index - Active measure index.
   * @param {object} geometry - Center, scale and outer endpoint of the axis.
   * @param {object} geometry.center - Radar center coordinates.
   * @param {object} geometry.scale - Shared maximum value.
   * @param {object} geometry.endpoint - Outer endpoint of the axis.
   * @returns {SVGElement} Initially hidden visual feedback.
   */
  #guide(index, { center, scale, endpoint }) {
    const guide = svg("g", { class: "orchid-charts-radar-guide", "aria-hidden": "true" });
    guide.append(svg("line", { x1: center.x, y1: center.y, x2: endpoint.x, y2: endpoint.y }));
    for (const dataset of this.#chart.datasets) {
      const ratio = dataset.points[index].y / scale.maximum;
      guide.append(
        svg("circle", {
          cx: center.x + (endpoint.x - center.x) * ratio,
          cy: center.y + (endpoint.y - center.y) * ratio,
          r: 3,
          stroke: dataset.color,
        }),
      );
    }

    return guide;
  }

  /**
   * Formats the same measure for every series using their original identities.
   *
   * @param {number} index - Shared measure index.
   * @returns {object[]} Standard tooltip rows in legend order.
   */
  #itemsAt(index) {
    return this.#chart.datasets.map((dataset, datasetIndex) => ({
      name: dataset.name,
      value: formatValue(this.#chart.options, dataset.points[index].y, {
        ...seriesContext(this.#chart, datasetIndex, index),
        target: "tooltip",
      }),
      color: dataset.color,
    }));
  }
}
