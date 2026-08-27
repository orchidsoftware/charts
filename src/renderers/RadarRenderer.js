import { formatNumber, labelElement, markMetadata, svg, titled } from "../support/Dom.js";
import { polarPoint } from "../support/Math.js";
import { datasetSummary, legendLayout } from "../support/Presentation.js";

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
 * Renders comparable datasets as concentric radial axes and closed polygons.
 */
export default class RadarRenderer {
  #chart;
  #surface;

  /**
   * Creates a radar renderer bound to one frozen render snapshot.
   *
   * @param {object} rendering - Collaborators for one radar pass.
   * @param {object} rendering.chart - Frozen radar data and options.
   * @param {import("./SvgSurface.js").default} rendering.surface - Owned SVG drawing surface.
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
    const { height, width } = this.#chart.options;
    const legendItems = this.#chart.datasets.map((dataset) => ({ label: dataset.name, color: dataset.color }));
    const legendRows =
      this.#chart.options.showLegend && this.#chart.datasets.length >= 2 ? legendLayout(width, legendItems).rows : 0;
    const contentTop = legendRows > 0 ? 20 + legendRows * 20 : 0;
    const contentHeight = height - contentTop;
    const centerX = width / 2;
    const centerY = contentTop + contentHeight / 2;
    const radius = Math.min(width, contentHeight) * 0.38;
    const count = this.#chart.datasets[0].points.length;
    const maximum = Math.max(...this.#chart.datasets.flatMap((dataset) => dataset.points.map((point) => point.y)), 1);
    const frame = Array.from({ length: count }, (_, index) =>
      polarPoint({
        cx: centerX,
        cy: centerY,
        radius,
        angle: -Math.PI / 2 + (index / count) * Math.PI * 2,
      }),
    );
    this.#renderFrame({ frame, centerX, centerY });
    this.#renderDatasets({ frame, centerX, centerY, radius, maximum, count });
    this.#renderLabels({ frame, centerX, centerY, width });
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
      class: "charts2-grid charts2-radar-frame",
    });
    for (const point of frame) {
      this.#surface.append("line", { x1: centerX, y1: centerY, x2: point.x, y2: point.y, class: "charts2-grid" });
    }
  }

  /**
   * Draws every normalized dataset as one interactive radar polygon.
   *
   * @param {object} geometry - Scale and center shared by all datasets.
   * @param {number} geometry.centerX - Horizontal radial center.
   * @param {number} geometry.centerY - Vertical radial center.
   * @param {number} geometry.radius - Maximum polygon radius.
   * @param {number} geometry.maximum - Maximum normalized dataset value.
   * @param {number} geometry.count - Number of axes in every dataset.
   * @returns {void} Dataset polygons and tooltip metadata are appended.
   */
  #renderDatasets({ centerX, centerY, radius, maximum, count }) {
    for (const [datasetIndex, dataset] of this.#chart.datasets.entries()) {
      const shape = dataset.points.map((point, index) =>
        polarPoint({
          cx: centerX,
          cy: centerY,
          radius: (radius * Math.max(0, point.y)) / maximum,
          angle: -Math.PI / 2 + (index / count) * Math.PI * 2,
        }),
      );
      const polygon = titled(
        markMetadata(
          svg("polygon", {
            points: shape.map((point) => `${point.x},${point.y}`).join(" "),
            fill: dataset.color,
            stroke: dataset.color,
            "stroke-linejoin": "round",
            "stroke-linecap": "round",
            opacity: 0.28,
            class: "charts2-radar charts2-mark",
          }),
          datasetIndex,
          0,
        ),
        datasetSummary(dataset, this.#chart.labels),
      );
      polygon.dataset.tooltipHeading = dataset.name;
      polygon.dataset.tooltipItems = JSON.stringify(
        dataset.points.map((point, index) => ({
          name: this.#chart.labels[index] ?? `Value ${index + 1}`,
          value: formatNumber(point.y),
          color: dataset.color,
        })),
      );
      this.#surface.append(polygon);
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
    if (this.#chart.labels.length === 0) {
      return;
    }
    for (const [index, point] of frame.slice(0, this.#chart.labels.length).entries()) {
      const directionX = point.x - centerX;
      const directionY = point.y - centerY;
      const length = Math.hypot(directionX, directionY);
      this.#surface.append(
        labelElement({
          value: this.#chart.labels[index],
          attributes: {
            x: point.x + (directionX / length) * 12,
            y: point.y + (directionY / length) * 12,
            class: "charts2-label",
            "text-anchor": radarAnchor(directionX),
          },
          maxWidth: Math.max(54, width * 0.16),
        }),
      );
    }
  }
}
