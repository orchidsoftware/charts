import { polarPoint } from "../../support/geometry/Math.js";
import { formatLabel } from "../../support/presentation/Formatting.js";
import { seriesContentLayout } from "../../support/presentation/Presentation.js";
import { labelElement } from "../../support/presentation/TextLayout.js";
import { renderLegend } from "../LegendRendering.js";

import RadarInspectorRenderer from "./RadarInspectorRenderer.js";

const DEFAULT_RADAR_OPACITY = 0.28;
const RADAR_RADIUS_RATIO = 0.38;
const LABEL_OFFSET = 12;
const LABEL_EDGE_GAP = 4;

/**
 * Resolves the text anchor for one radar label direction.
 *
 * @param {number} directionX - Horizontal vector from chart center to frame point.
 * @returns {"start" | "middle" | "end"} SVG text alignment for the label.
 */
function radarAnchor(directionX) {
  if (Math.abs(directionX) < 1) {
    return "middle";
  }

  return directionX < 0 ? "end" : "start";
}

/**
 * Keeps labels within the viewport without needlessly shortening centered text.
 *
 * @param {object} position - Label x coordinate, alignment and chart width.
 * @param {number} position.x - Label horizontal coordinate.
 * @param {string} position.anchor - SVG text alignment.
 * @param {number} position.width - Available chart width.
 * @returns {number} Available horizontal label space.
 */
function radarLabelWidth({ x, anchor, width }) {
  if (anchor === "middle") {
    return Math.max(1, 2 * Math.min(x, width - x) - LABEL_EDGE_GAP);
  }

  return Math.max(1, (anchor === "start" ? width - x : x) - LABEL_EDGE_GAP);
}

/**
 * Renders comparable datasets as concentric radial axes and closed polygons.
 */
class RadarRenderer {
  #chart;
  #surface;

  /**
   * Creates a radar renderer bound to one frozen render snapshot.
   *
   * @param {object} rendering - Collaborators for one radar pass.
   * @param {object} rendering.chart - Frozen radar data and options.
   * @param {import("../SvgSurface.js").default} rendering.surface - Owned SVG drawing surface.
   */
  constructor({ chart, surface }) {
    this.#chart = chart;
    this.#surface = surface;
  }

  /**
   * Draws the radar grid, datasets, labels, and interaction metadata.
   *
   * @returns {void} Radar content is appended to the chart SVG.
   */
  render() {
    const { width } = this.#chart.options;
    const { contentHeight } = seriesContentLayout(this.#chart);
    const center = { x: width / 2, y: contentHeight / 2 };

    const scale = {
      radius: Math.min(width, contentHeight) * RADAR_RADIUS_RATIO,
      count: this.#chart.datasets[0].points.length,
      maximum: Math.max(
        ...this.#chart.datasets.flatMap((dataset) => dataset.points.map((point) => point.y)),
        1,
      ),
    };

    const frame = Array.from({ length: scale.count }, (_, index) =>
      polarPoint({
        cx: center.x,
        cy: center.y,
        radius: scale.radius,
        angle: -Math.PI / 2 + (index / scale.count) * Math.PI * 2,
      }),
    );

    this.#renderFrame({ frame, centerX: center.x, centerY: center.y });
    this.#renderDatasets(center, scale);
    this.#renderLabels({ frame, centerX: center.x, centerY: center.y, width });
    new RadarInspectorRenderer({ chart: this.#chart, surface: this.#surface }).render(center, scale);
  }

  /**
   * Draws the polygon boundary and center-to-vertex guide lines.
   *
   * @param {object} geometry - Resolved radar frame geometry.
   * @param {Array<{x: number, y: number}>} geometry.frame - Outer radar vertices.
   * @param {number} geometry.centerX - Horizontal radial center.
   * @param {number} geometry.centerY - Vertical radial center.
   * @returns {void} Grid elements are appended to the SVG.
   */
  #renderFrame({ frame, centerX, centerY }) {
    this.#surface.append("polygon", {
      points: frame.map((point) => `${point.x},${point.y}`).join(" "),
      class: "orchid-charts-grid orchid-charts-radar-frame",
    });
    for (const point of frame) {
      this.#surface.append("line", {
        x1: centerX,
        y1: centerY,
        x2: point.x,
        y2: point.y,
        class: "orchid-charts-grid",
      });
    }
  }

  /**
   * Draws every normalized dataset as a non-interactive radar profile.
   *
   * @param {{x: number, y: number}} center - Shared radial center.
   * @param {object} scale - Radius, maximum value, and axis count.
   * @returns {void} Dataset polygons are appended beneath the category inspection targets.
   */
  #renderDatasets(center, scale) {
    for (const dataset of this.#chart.datasets) {
      const shape = dataset.points.map((point, index) =>
        polarPoint({
          cx: center.x,
          cy: center.y,
          radius: (scale.radius * Math.max(0, point.y)) / scale.maximum,
          angle: -Math.PI / 2 + (index / scale.count) * Math.PI * 2,
        }),
      );

      this.#surface.append("polygon", {
        points: shape.map((point) => `${point.x},${point.y}`).join(" "),
        fill: dataset.color,
        stroke: dataset.color,
        "stroke-width": this.#chart.options.strokeWidth,
        "stroke-linejoin": "round",
        "stroke-linecap": "round",
        opacity: dataset.opacity ?? DEFAULT_RADAR_OPACITY,
        class: "orchid-charts-radar",
      });
    }
  }

  /**
   * Places category labels outside the radar frame when labels are available.
   *
   * @param {object} geometry - Frame and viewport geometry used for label placement.
   * @param {Array<{x: number, y: number}>} geometry.frame - Outer radar vertices.
   * @param {number} geometry.centerX - Horizontal radial center.
   * @param {number} geometry.centerY - Vertical radial center.
   * @param {number} geometry.width - Total chart width.
   * @returns {void} Category labels are appended when present.
   */
  #renderLabels({ frame, centerX, centerY, width }) {
    for (const [
      index,
      point,
    ] of frame.slice(0, this.#chart.labels.length).entries()) {
      const directionX = point.x - centerX;
      const directionY = point.y - centerY;
      const length = Math.hypot(directionX, directionY);
      const x = point.x + (directionX / length) * LABEL_OFFSET;
      const anchor = radarAnchor(directionX);
      this.#surface.append(
        labelElement({
          value: formatLabel(this.#chart.options, this.#chart.labels[index], {
            target: "value-label",
            index,
          }),
          attributes: {
            x,
            y: point.y + (directionY / length) * LABEL_OFFSET,
            class: "orchid-charts-label",
            "text-anchor": anchor,
          },
          measurement: { maxWidth: radarLabelWidth({ x, anchor, width }) },
        }),
      );
    }
  }
}

/**
 * Renders one radar chart and its optional series legend.
 *
 * @param {object} rendering - Frozen chart snapshot and owned SVG surface.
 * @returns {void} Radar content is appended to the chart SVG.
 */
function renderRadarChart(rendering) {
  new RadarRenderer(rendering).render();
  renderLegend(rendering);
}

export { renderRadarChart };
