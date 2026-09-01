import { labelElement, markMetadata, svg, titled } from "../../support/Dom.js";
import { polarPoint } from "../../support/geometry/Math.js";
import { formatLabel, formatValue } from "../../support/presentation/Formatting.js";
import { datasetSummary, legendLayout } from "../../support/presentation/Presentation.js";
import LegendRenderer from "../LegendRenderer.js";

const LEGEND_TOP = 20;
const LEGEND_ROW_HEIGHT = 20;
const RADAR_RADIUS_RATIO = 0.38;
const LABEL_OFFSET = 12;
const MINIMUM_LABEL_WIDTH = 54;
const LABEL_WIDTH_RATIO = 0.16;

/**
 * Resolves the vertical space consumed by an optional radar legend.
 *
 * @param {object} chart - Frozen radar data and options.
 * @param {Array<object>} items - Legend items for the datasets.
 * @returns {number} Top edge of the drawable radar region.
 */
function radarContentTop(chart, items) {
  if (!chart.options.legend || chart.datasets.length < 2) {
    return 0;
  }

  return LEGEND_TOP + legendLayout(chart.options.width, items).rows * LEGEND_ROW_HEIGHT;
}

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
    const { height, width } = this.#chart.options;

    const legendItems = this.#chart.datasets.map((dataset) => ({
      label: dataset.name,
      color: dataset.color,
    }));

    const contentTop = radarContentTop(this.#chart, legendItems);
    const contentHeight = height - contentTop;
    const center = { x: width / 2, y: contentTop + contentHeight / 2 };

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
      this.#surface.append("line", {
        x1: centerX,
        y1: centerY,
        x2: point.x,
        y2: point.y,
        class: "charts2-grid",
      });
    }
  }

  /**
   * Draws every normalized dataset as one interactive radar polygon.
   *
   * @param {{x: number, y: number}} center - Shared radial center.
   * @param {object} scale - Radius, maximum value, and axis count.
   * @returns {void} Dataset polygons and tooltip metadata are appended.
   */
  #renderDatasets(center, scale) {
    for (const [
      datasetIndex,
      dataset,
    ] of this.#chart.datasets.entries()) {
      const shape = dataset.points.map((point, index) =>
        polarPoint({
          cx: center.x,
          cy: center.y,
          radius: (scale.radius * Math.max(0, point.y)) / scale.maximum,
          angle: -Math.PI / 2 + (index / scale.count) * Math.PI * 2,
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
        datasetSummary(dataset, this.#chart.labels, { options: this.#chart.options, datasetIndex }),
      );

      polygon.dataset.tooltipHeading = dataset.name;
      polygon.dataset.tooltipItems = JSON.stringify(this.#tooltipItems(dataset));
      this.#surface.append(polygon);
    }
  }

  /**
   * Formats the category values exposed by a radar dataset tooltip.
   *
   * @param {object} dataset - Normalized radar dataset.
   * @returns {Array<object>} Display-ready tooltip rows.
   */
  #tooltipItems(dataset) {
    return dataset.points.map((point, index) => ({
      name: formatLabel(this.#chart.options, this.#chart.labels[index], {
        target: "tooltip",
        datasetIndex: this.#chart.datasets.indexOf(dataset),
        index,
        point,
      }),
      value: formatValue(this.#chart.options, point.y, {
        target: "tooltip",
        dataset,
        datasetIndex: this.#chart.datasets.indexOf(dataset),
        index,
        label: this.#chart.labels[index],
        point,
      }),
      color: dataset.color,
    }));
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
      this.#surface.append(
        labelElement({
          value: formatLabel(this.#chart.options, this.#chart.labels[index], {
            target: "value-label",
            index,
          }),
          attributes: {
            x: point.x + (directionX / length) * LABEL_OFFSET,
            y: point.y + (directionY / length) * LABEL_OFFSET,
            class: "charts2-label",
            "text-anchor": radarAnchor(directionX),
          },
          measurement: { maxWidth: Math.max(MINIMUM_LABEL_WIDTH, width * LABEL_WIDTH_RATIO) },
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
  new LegendRenderer(rendering).render();
}

export { renderRadarChart };
