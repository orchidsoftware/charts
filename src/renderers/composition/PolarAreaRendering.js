import {
  DEFAULT_SECTOR_CORNER_RADIUS,
  POLAR_LABEL_EDGE_INSET,
  POLAR_LABEL_GAP,
  POLAR_LABEL_MIN_WIDTH,
} from "../../support/Constants.js";
import { svg } from "../../support/Dom.js";
import { paddedSector, polarPoint, roundedSectorPath } from "../../support/geometry/Math.js";
import { formatLabel, seriesContext } from "../../support/presentation/Formatting.js";
import { tooltipContent, seriesContentLayout } from "../../support/presentation/Presentation.js";
import { labelElement } from "../../support/presentation/TextLayout.js";
import { renderLegend } from "../LegendRendering.js";

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
 * Resolves the shared scale and viewport geometry of a polar-area render.
 *
 * @param {object} chart - Frozen polar-area chart data and options.
 * @returns {object} Complete radial geometry.
 */
function polarAreaLayout(chart) {
  const width = chart.options.width;
  const height = seriesContentLayout(chart).contentHeight;
  const values = chart.datasets[0].points;

  const radiusLimits = {
    horizontal: width / 2 - POLAR_LABEL_EDGE_INSET - POLAR_LABEL_GAP - POLAR_LABEL_MIN_WIDTH,
    vertical: height / 2 - POLAR_LABEL_EDGE_INSET - POLAR_LABEL_GAP,
  };

  return Object.freeze({
    width,
    height,
    values,
    maximum: Math.max(...values.map((point) => point.y), 1),
    center: { x: width / 2, y: height / 2 },
    maximumRadius: Math.max(
      MINIMUM_POLAR_RADIUS,
      Math.min(Math.min(width, height) * POLAR_RADIUS_RATIO, radiusLimits.horizontal, radiusLimits.vertical),
    ),
    slice: (Math.PI * 2) / values.length,
  });
}

/**
 * Renders equal-angle polar sectors whose radii encode normalized values.
 */
class PolarAreaRenderer {
  #chart;
  #surface;

  /**
   * Creates a polar-area renderer bound to one frozen render snapshot.
   *
   * @param {object} rendering - Collaborators for one polar-area pass.
   * @param {object} rendering.chart - Frozen polar-area data and options.
   * @param {import("../SvgSurface.js").default} rendering.surface - Owned SVG drawing surface.
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
    const layout = polarAreaLayout(this.#chart);

    for (const [
      index,
      point,
    ] of layout.values.entries()) {
      this.#renderSector(point, index, layout);
    }
  }

  /**
   * Draws one polar sector and its optional category label.
   *
   * @param {{y: number}} point - Normalized polar value.
   * @param {number} index - Zero-based sector index.
   * @param {object} layout - Shared radial frame and scale.
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

    const cornerRadius = this.#chart.options.cornerRadius ?? DEFAULT_SECTOR_CORNER_RADIUS;

    const sectorElement = this.#sectorElement(layout, { radius, sector, cornerRadius });

    const colors = this.#chart.options.colors;
    sectorElement.setAttribute("fill", colors[index % colors.length]);
    sectorElement.classList.add("charts2-polar-area", "charts2-mark");
    this.#surface.mark(
      sectorElement,
      {},
      {
        dataset: 0,
        point: index,
        title: tooltipContent({
          ...seriesContext(this.#chart, 0, index),
          options: this.#chart.options,
          color: colors[index % colors.length],
          value: point.y,
        }),
      },
    );
    this.#renderLabel(index, { start, slice: layout.slice }, layout);
  }

  /**
   * Creates the primitive representing one polar-area value.
   *
   * @param {object} layout - Shared radial frame and scale.
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
   * @param {object} layout - Shared radial frame and viewport.
   * @returns {void} A label is appended only when the category exists.
   */
  #renderLabel(index, angles, layout) {
    const point = polarPoint({
      cx: layout.center.x,
      cy: layout.center.y,
      radius: layout.maximumRadius + POLAR_LABEL_GAP,
      angle: angles.start + angles.slice / 2,
    });

    const labelX = Math.min(layout.width - POLAR_LABEL_EDGE_INSET, Math.max(POLAR_LABEL_EDGE_INSET, point.x));

    const labelY = Math.min(
      layout.height - POLAR_LABEL_EDGE_INSET,
      Math.max(POLAR_LABEL_EDGE_INSET, point.y),
    );

    const anchor = radialAnchor(labelX, layout.center.x);
    this.#surface.append(
      labelElement({
        value: formatLabel(this.#chart.options, this.#chart.labels[index], { target: "value-label", index }),
        attributes: {
          x: labelX,
          y: labelY,
          class: "charts2-label charts2-polar-label",
          "text-anchor": anchor,
        },
        measurement: { maxWidth: Math.max(1, polarLabelWidth({ labelX, anchor, width: layout.width })) },
      }),
    );
  }
}

/**
 * Renders one polar-area chart and its optional series legend.
 *
 * @param {object} rendering - Frozen chart snapshot and owned SVG surface.
 * @returns {void} Polar-area content is appended to the chart SVG.
 */
function renderPolarAreaChart(rendering) {
  new PolarAreaRenderer(rendering).render();
  renderLegend(rendering);
}

export { renderPolarAreaChart };
