import {
  DEFAULT_COLORS,
  DEFAULT_SECTOR_CORNER_RADIUS,
  POLAR_LABEL_EDGE_INSET,
  POLAR_LABEL_GAP,
  POLAR_LABEL_MIN_WIDTH,
} from "../support/Constants.js";
import { labelElement, markMetadata, svg, titled } from "../support/Dom.js";
import { paddedSector, polarPoint, roundedSectorPath } from "../support/Math.js";
import { tooltipText } from "../support/Presentation.js";

/**
 * Chooses text alignment from a label's position relative to the radial center.
 *
 * @param {number} labelX - Clamped horizontal label coordinate.
 * @param {number} centerX - Horizontal chart center.
 * @returns {"start" | "middle" | "end"} SVG text anchor for the label.
 */
function radialAnchor(labelX, centerX) {
  if (labelX < centerX - 2) {
    return "end";
  }
  if (labelX > centerX + 2) {
    return "start";
  }
  return "middle";
}

/**
 * Calculates horizontal space available to a clamped polar label.
 *
 * @param {object} placement - Label position, alignment, and viewport width.
 * @param {number} placement.labelX - Clamped horizontal label coordinate.
 * @param {"start" | "middle" | "end"} placement.anchor - SVG text anchor.
 * @param {number} placement.width - Total chart width.
 * @returns {number} Positive width budget before the nearest chart edge.
 */
function polarLabelWidth({ labelX, anchor, width }) {
  if (anchor === "end") {
    return labelX - POLAR_LABEL_EDGE_INSET;
  }
  if (anchor === "start") {
    return width - POLAR_LABEL_EDGE_INSET - labelX;
  }
  return 2 * Math.min(labelX - POLAR_LABEL_EDGE_INSET, width - POLAR_LABEL_EDGE_INSET - labelX);
}

/**
 * Renders equal-angle polar sectors whose radii encode normalized values.
 */
export default class PolarAreaRenderer {
  #chart;
  #surface;

  /**
   * Creates a polar-area renderer bound to one frozen render snapshot.
   *
   * @param {object} rendering - Collaborators for one polar-area pass.
   * @param {object} rendering.chart - Frozen polar-area data and options.
   * @param {import("./SvgSurface.js").default} rendering.surface - Owned SVG drawing surface.
   */
  constructor({ chart, surface }) {
    this.#chart = chart;
    this.#surface = surface;
  }

  /**
   * Draws sectors and their bounded category labels.
   *
   * @returns {void} Polar-area content is appended to the chart SVG.
   */
  render() {
    const { height, width } = this.#chart.options;
    const values = this.#chart.datasets[0].points;
    const maximum = Math.max(...values.map((point) => point.y), 1);
    const centerX = width / 2;
    const centerY = height / 2;
    const horizontalRadius = width / 2 - POLAR_LABEL_EDGE_INSET - POLAR_LABEL_GAP - POLAR_LABEL_MIN_WIDTH;
    const verticalRadius = height / 2 - POLAR_LABEL_EDGE_INSET - POLAR_LABEL_GAP;
    const maximumRadius = Math.max(8, Math.min(Math.min(width, height) * 0.42, horizontalRadius, verticalRadius));
    const slice = (Math.PI * 2) / values.length;
    for (const [index, point] of values.entries()) {
      this.#renderSector({ point, index, values, maximum, centerX, centerY, maximumRadius, slice, width, height });
    }
  }

  /**
   * Draws one polar sector and its optional category label.
   *
   * @param {object} state - Geometry and data required for one sector.
   * @param {{y: number}} state.point - Normalized polar value.
   * @param {number} state.index - Zero-based sector index.
   * @param {Array<object>} state.values - Complete normalized polar dataset.
   * @param {number} state.maximum - Maximum positive scale value.
   * @param {number} state.centerX - Horizontal radial center.
   * @param {number} state.centerY - Vertical radial center.
   * @param {number} state.maximumRadius - Largest permitted sector radius.
   * @param {number} state.slice - Angle allocated to every category.
   * @param {number} state.width - Total chart width.
   * @param {number} state.height - Total chart height.
   * @returns {void} One interactive sector and optional label are appended.
   */
  #renderSector({ point, index, values, maximum, centerX, centerY, maximumRadius, slice, width, height }) {
    const radius = maximumRadius * Math.sqrt(Math.max(0, point.y) / maximum);
    const start = -Math.PI / 2 + index * slice;
    const sector = paddedSector({
      startAngle: start,
      endAngle: start + slice,
      padAngle: this.#chart.options.padAngle,
      outerRadius: radius,
      innerRadius: 0,
      sectorCount: values.length,
    });
    const cornerRadius = this.#chart.options.sectorOptions?.cornerRadius ?? DEFAULT_SECTOR_CORNER_RADIUS;
    const sectorElement =
      values.length === 1
        ? svg("circle", { cx: centerX, cy: centerY, r: radius })
        : svg("path", {
            d: roundedSectorPath({
              cx: centerX,
              cy: centerY,
              outerRadius: radius,
              innerRadius: 0,
              outerStartAngle: sector.outerStart,
              outerEndAngle: sector.outerEnd,
              innerStartAngle: sector.innerStart,
              innerEndAngle: sector.innerEnd,
              cornerRadius,
            }),
          });
    sectorElement.setAttribute("fill", DEFAULT_COLORS[index % DEFAULT_COLORS.length]);
    sectorElement.classList.add("charts2-polar-area", "charts2-mark");
    this.#surface.append(
      titled(
        markMetadata(sectorElement, 0, index),
        tooltipText({
          options: this.#chart.options,
          label: this.#chart.labels[index] ?? index + 1,
          value: point.y,
        }),
      ),
    );
    this.#renderLabel({ index, start, slice, centerX, centerY, maximumRadius, width, height });
  }

  /**
   * Places one category label within the radial viewport bounds.
   *
   * @param {object} state - Sector and viewport geometry used for label placement.
   * @param {number} state.index - Zero-based sector index.
   * @param {number} state.start - Sector start angle in radians.
   * @param {number} state.slice - Sector sweep angle in radians.
   * @param {number} state.centerX - Horizontal radial center.
   * @param {number} state.centerY - Vertical radial center.
   * @param {number} state.maximumRadius - Outer label reference radius.
   * @param {number} state.width - Total chart width.
   * @param {number} state.height - Total chart height.
   * @returns {void} A label is appended only when the category exists.
   */
  #renderLabel({ index, start, slice, centerX, centerY, maximumRadius, width, height }) {
    if (this.#chart.labels[index] === undefined) {
      return;
    }
    const point = polarPoint({
      cx: centerX,
      cy: centerY,
      radius: maximumRadius + POLAR_LABEL_GAP,
      angle: start + slice / 2,
    });
    const labelX = Math.min(width - POLAR_LABEL_EDGE_INSET, Math.max(POLAR_LABEL_EDGE_INSET, point.x));
    const labelY = Math.min(height - POLAR_LABEL_EDGE_INSET, Math.max(POLAR_LABEL_EDGE_INSET, point.y));
    const anchor = radialAnchor(labelX, centerX);
    this.#surface.append(
      labelElement({
        value: this.#chart.labels[index],
        attributes: { x: labelX, y: labelY, class: "charts2-label charts2-polar-label", "text-anchor": anchor },
        maxWidth: Math.max(1, polarLabelWidth({ labelX, anchor, width })),
      }),
    );
  }
}
