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

const MINIMUM_POLAR_RADIUS = 8;
const POLAR_RADIUS_RATIO = 0.42;

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
 * Names the shared scale and viewport geometry of a polar-area render.
 */
class PolarAreaLayout {
  /**
   * Resolves the radial frame from one frozen chart snapshot.
   *
   * @param {object} chart - Frozen polar-area chart data and options.
   */
  constructor(chart) {
    this.width = chart.options.width;
    this.height = chart.options.height;
    this.values = chart.datasets[0].points;
    this.maximum = Math.max(...this.values.map((point) => point.y), 1);
    this.center = { x: this.width / 2, y: this.height / 2 };

    const radiusLimits = {
      horizontal: this.width / 2 - POLAR_LABEL_EDGE_INSET - POLAR_LABEL_GAP - POLAR_LABEL_MIN_WIDTH,
      vertical: this.height / 2 - POLAR_LABEL_EDGE_INSET - POLAR_LABEL_GAP,
    };

    this.maximumRadius = Math.max(
      MINIMUM_POLAR_RADIUS,
      Math.min(Math.min(this.width, this.height) * POLAR_RADIUS_RATIO, radiusLimits.horizontal, radiusLimits.vertical),
    );
    this.slice = (Math.PI * 2) / this.values.length;
  }
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
    const layout = new PolarAreaLayout(this.#chart);

    for (const [index, point] of layout.values.entries()) {
      this.#renderSector(point, index, layout);
    }
  }

  /**
   * Draws one polar sector and its optional category label.
   *
   * @param {{y: number}} point - Normalized polar value.
   * @param {number} index - Zero-based sector index.
   * @param {PolarAreaLayout} layout - Shared radial frame and scale.
   * @returns {void} One interactive sector and optional label are appended.
   */
  #renderSector(point, index, layout) {
    const radius = layout.maximumRadius * Math.sqrt(Math.max(0, point.y) / layout.maximum);
    const start = -Math.PI / 2 + index * layout.slice;

    const sector = paddedSector({
      angles: { start, end: start + layout.slice },
      radii: { outer: radius, inner: 0 },
      padding: { angle: this.#chart.options.padAngle, count: layout.values.length },
    });

    const cornerRadius = this.#chart.options.sectorOptions?.cornerRadius ?? DEFAULT_SECTOR_CORNER_RADIUS;

    const sectorElement = this.#sectorElement(layout, { radius, sector, cornerRadius });

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
    this.#renderLabel(index, { start, slice: layout.slice }, layout);
  }

  /**
   * Creates the primitive representing one polar-area value.
   *
   * @param {PolarAreaLayout} layout - Shared radial frame and scale.
   * @param {object} shape - Sector radius, padded angles, and corner radius.
   * @returns {SVGElement} Circle for a sole value, otherwise a sector path.
   */
  #sectorElement(layout, shape) {
    if (layout.values.length === 1) {
      return svg("circle", { cx: layout.center.x, cy: layout.center.y, r: shape.radius });
    }

    return svg("path", {
      d: roundedSectorPath({
        center: layout.center,
        radii: { outer: shape.radius, inner: 0 },
        angles: { outer: shape.sector.outer, inner: shape.sector.inner },
        cornerRadius: shape.cornerRadius,
      }),
    });
  }

  /**
   * Places one category label within the radial viewport bounds.
   *
   * @param {number} index - Zero-based sector index.
   * @param {object} angles - Sector start and sweep angles.
   * @param {PolarAreaLayout} layout - Shared radial frame and viewport.
   * @returns {void} A label is appended only when the category exists.
   */
  #renderLabel(index, angles, layout) {
    if (this.#chart.labels[index] === undefined) {
      return;
    }

    const point = polarPoint({
      cx: layout.center.x,
      cy: layout.center.y,
      radius: layout.maximumRadius + POLAR_LABEL_GAP,
      angle: angles.start + angles.slice / 2,
    });

    const labelX = Math.min(layout.width - POLAR_LABEL_EDGE_INSET, Math.max(POLAR_LABEL_EDGE_INSET, point.x));
    const labelY = Math.min(layout.height - POLAR_LABEL_EDGE_INSET, Math.max(POLAR_LABEL_EDGE_INSET, point.y));
    const anchor = radialAnchor(labelX, layout.center.x);
    this.#surface.append(
      labelElement({
        value: this.#chart.labels[index],
        attributes: { x: labelX, y: labelY, class: "charts2-label charts2-polar-label", "text-anchor": anchor },
        measurement: { maxWidth: Math.max(1, polarLabelWidth({ labelX, anchor, width: layout.width })) },
      }),
    );
  }
}
