import { formatContext, formatterText } from "../../support/presentation/Formatting.js";
import { labelElement } from "../../support/presentation/TextLayout.js";

const ANNOTATION_EDGE_INSET = 8;
const ANNOTATION_MARKER_GAP = 6;

/**
Owns Cartesian annotation geometry and its two drawing layers.
 */
export default class CartesianAnnotationsRenderer {
  #chart;
  #layout;
  #surface;

  /**
   * Captures the normalized scene and drawing collaborators.
   *
   * @param {object} rendering - Chart, layout, and surface.
   * @param {object} rendering.chart - Normalized chart scene.
   * @param {object} rendering.layout - Shared scales and frame.
   * @param {object} rendering.surface - Owned drawing surface.
   */
  constructor({ chart, layout, surface }) {
    this.#chart = chart;
    this.#layout = layout;
    this.#surface = surface;
  }

  /**
   * Draws regions and marker lines behind data.
   *
   * @returns {void} Background geometry is appended.
   */
  renderBackground() {
    this.#renderRegions();
    this.#renderMarkerLines();
  }

  /**
   * Draws annotation labels above data.
   *
   * @returns {void} Foreground labels are appended.
   */
  renderForeground() {
    this.#renderRegionLabels();
    this.#renderMarkerLabels();
  }

  /**
   * Renders configured value ranges behind Cartesian data marks.
   *
   * @returns {void} Region rectangles are appended to the chart SVG.
   */
  // eslint-disable-next-line max-lines-per-function -- Array layout lines do not add behavior.
  #renderRegions() {
    const { bottom, left, right, top } = this.#layout.frame;
    const regions = this.#chart.source.yRegions;

    for (const region of regions) {
      const [
        rangeStart,
        rangeEnd,
      ] = region.range;

      const start = this.#layout.valueAt(rangeStart);
      const end = this.#layout.valueAt(rangeEnd);

      if (!region.includeInDomain && !this.#overlapsPlot(start, end)) {
        continue;
      }

      const boundedStart = this.#boundedValuePosition(start);
      const boundedEnd = this.#boundedValuePosition(end);

      const attributes = this.#layout.isHorizontal
        ? {
            x: Math.min(boundedStart, boundedEnd),
            y: top,
            width: Math.abs(boundedEnd - boundedStart),
            height: bottom - top,
          }
        : {
            x: left,
            y: Math.min(boundedStart, boundedEnd),
            width: right - left,
            height: Math.abs(boundedEnd - boundedStart),
          };

      this.#surface.append("rect", {
        ...attributes,
        fill: region.color,
        opacity: region.opacity,
        class: "orchid-charts-region",
        "aria-hidden": "true",
      });
    }
  }

  /**
   * Renders configured reference lines over Cartesian data marks.
   *
   * @returns {void} Marker lines and optional labels are appended to the chart SVG.
   */
  #renderMarkerLines() {
    const { bottom, left, right, top } = this.#layout.frame;
    const markers = this.#chart.source.yMarkers;

    for (const marker of markers) {
      const position = this.#layout.valueAt(marker.value);

      if (!marker.includeInDomain && !this.#insidePlot(position)) {
        continue;
      }

      const attributes = this.#layout.isHorizontal
        ? { x1: position, y1: top, x2: position, y2: bottom }
        : { x1: left, y1: position, x2: right, y2: position };

      this.#surface.append("line", {
        ...attributes,
        stroke: marker.color,
        opacity: marker.opacity,
        "stroke-width": marker.width,
        "stroke-dasharray": marker.dash.join(" "),
        "vector-effect": "non-scaling-stroke",
        class: "orchid-charts-marker",
      });
    }
  }

  /**
   * Renders region labels after datasets in stable call order.
   *
   * @returns {void} Visible region labels remain inside the plot.
   */
  #renderRegionLabels() {
    const regions = this.#chart.source.yRegions;

    for (const region of regions) {
      const positions = region.range.map((value) => this.#layout.valueAt(value));

      if (!region.includeInDomain && !this.#overlapsPlot(...positions)) {
        continue;
      }

      const label = region.formatLabel
        ? formatterText(
            region.formatLabel(
              region.label,
              Object.freeze([
                ...region.range,
              ]),
              formatContext(this.#chart.options, "accessibility"),
            ),
            "Region label",
          )
        : region.label;

      this.#renderAnnotationLabel({
        kind: "region",
        label,
        positions,
        annotation: region,
      });
    }
  }

  /**
   * Renders marker labels after region labels in stable call order.
   *
   * @returns {void} Visible marker labels remain inside the plot.
   */
  #renderMarkerLabels() {
    const markers = this.#chart.source.yMarkers;

    for (const marker of markers) {
      const position = this.#layout.valueAt(marker.value);

      if (!marker.includeInDomain && !this.#insidePlot(position)) {
        continue;
      }

      const label = marker.formatLabel
        ? formatterText(
            marker.formatLabel(
              marker.label,
              marker.value,
              formatContext(this.#chart.options, "accessibility"),
            ),
            "Marker label",
          )
        : marker.label;

      this.#renderAnnotationLabel({
        kind: "marker",
        label,
        positions: [
          position,
        ],
        annotation: marker,
      });
    }
  }

  /**
   * Renders one visually secondary annotation label without a surrounding container.
   *
   * @param {object} tag - Complete static annotation presentation.
   * @param {"marker" | "region"} tag.kind - Annotation role used for semantic styling.
   * @param {string} tag.label - Visible annotation text.
   * @param {number[]} tag.positions - Scaled marker or region coordinates.
   * @param {object} tag.annotation - Normalized marker or region presentation.
   * @returns {void} The annotation text is appended to the surface.
   */
  #renderAnnotationLabel({ kind, label, positions, annotation }) {
    const { left, right } = this.#layout.frame;
    const className = `orchid-charts-annotation orchid-charts-${kind}-label`;
    const typography = this.#chart.typography.forClass(className);

    const element = labelElement({
      value: label,
      attributes: { class: className, style: `fill: ${annotation.labelColor}` },
      measurement: {
        maxWidth: Math.max(0, right - left - 2 * ANNOTATION_EDGE_INSET),
        widthOf: typography.widthOf,
      },
    });

    const bounds = typography.boundsOf(element.firstChild.textContent);

    const placement = this.#annotationLabelAttributes(kind, {
      placement: annotation.labelPosition,
      values: positions,
      height: bounds.height,
    });

    const attributes = this.#boundedLabelAttributes(bounds, placement);

    for (const [
      name,
      value,
    ] of Object.entries(attributes)) {
      element.setAttribute(name, String(value));
    }

    this.#surface.append(element);
  }

  /**
   * Keeps the measured glyph box inside the plot while retaining its native anchor.
   *
   * @param {object} bounds - Browser glyph bounds relative to an alphabetic baseline.
   * @param {object} placement - Logical annotation anchor and visual center.
   * @returns {object} SVG coordinates and anchor.
   */
  #boundedLabelAttributes(bounds, placement) {
    const { bottom, left, right, top } = this.#layout.frame;

    const offset = this.#placementCoordinate(
      [
        0,
        bounds.advance / 2,
        bounds.advance,
      ],
      placement.anchor === "middle" ? "center" : placement.anchor,
    );

    const x = Math.max(
      left - bounds.x + offset,
      Math.min(placement.x, right - bounds.x - bounds.width + offset),
    );

    const y = Math.max(
      top - bounds.y,
      Math.min(placement.y - bounds.y - bounds.height / 2, bottom - bounds.y - bounds.height),
    );

    return {
      x,
      y,
      "text-anchor": placement.anchor,
    };
  }

  /**
   * Resolves one logical annotation-label position for either orientation.
   *
   * @param {"marker" | "region"} kind - Annotation semantic controlling value-axis placement.
   * @param {object} coordinates - Logical placement, scaled values, and measured glyph height.
   * @param {string} coordinates.placement - Logical category-axis alignment.
   * @param {number[]} coordinates.values - Scaled marker or region endpoints.
   * @param {number} coordinates.height - Actual glyph box height.
   * @returns {object} Bounded SVG text attributes.
   */
  // eslint-disable-next-line max-lines-per-function -- Array layout lines do not add behavior.
  #annotationLabelAttributes(kind, { placement, values, height }) {
    const { bottom, left, right, top } = this.#layout.frame;
    const boundedValues = values.map((value) => this.#boundedValuePosition(value));
    const value = boundedValues.reduce((sum, item) => sum + item, 0) / boundedValues.length;

    if (this.#layout.isHorizontal) {
      const y = this.#placementCoordinate(
        [
          bottom - height / 2,
          (top + bottom) / 2,
          top + height / 2,
        ],
        placement,
      );

      if (kind === "region") {
        return {
          x: value,
          y,
          anchor: "middle",
        };
      }

      const isNearRightEdge = value > (left + right) / 2;

      return {
        x: value + (isNearRightEdge ? -ANNOTATION_MARKER_GAP : ANNOTATION_MARKER_GAP),
        y,
        anchor: isNearRightEdge ? "end" : "start",
      };
    }

    const x = this.#placementCoordinate(
      [
        left + ANNOTATION_EDGE_INSET,
        (left + right) / 2,
        right - ANNOTATION_EDGE_INSET,
      ],
      placement,
    );

    const anchor = this.#placementCoordinate(
      [
        "start",
        "middle",
        "end",
      ],
      placement,
    );

    if (kind === "region") {
      return {
        x,
        y: value,
        anchor,
      };
    }

    return {
      x,
      y: Math.max(top + height / 2, value - ANNOTATION_MARKER_GAP - height / 2),
      anchor,
    };
  }

  /**
   * Maps a logical annotation placement without coupling it to one orientation.
   *
   * @param {unknown[]} values - Physical values for start, center, and end.
   * @param {string} placement - Logical placement.
   * @returns {unknown} Selected physical value.
   */
  #placementCoordinate(
    [
      start,
      center,
      end,
    ],
    placement,
  ) {
    if (placement === "start") {
      return start;
    }

    return placement === "center" ? center : end;
  }

  /**
   * Tests a value-axis coordinate against the current plot bounds.
   *
   * @param {number} position - Scaled value-axis position.
   * @returns {boolean} Whether the position falls inside the plot.
   */
  #insidePlot(position) {
    const { maximum, minimum } = this.#valueAxisBounds();

    return position >= minimum && position <= maximum;
  }

  /**
   * Tests whether a scaled interval intersects the plot.
   *
   * @param {number} start - First scaled endpoint.
   * @param {number} end - Second scaled endpoint.
   * @returns {boolean} Whether any portion of the interval is visible.
   */
  #overlapsPlot(start, end) {
    const { maximum, minimum } = this.#valueAxisBounds();

    return Math.max(start, end) >= minimum && Math.min(start, end) <= maximum;
  }

  /**
   * Clamps one value-axis coordinate to the plot.
   *
   * @param {number} position - Scaled value-axis coordinate.
   * @returns {number} Coordinate inside the plot bounds.
   */
  #boundedValuePosition(position) {
    const { maximum, minimum } = this.#valueAxisBounds();

    return Math.min(maximum, Math.max(minimum, position));
  }

  /**
   * Resolves the physical value-axis interval for the active orientation.
   *
   * @returns {{minimum: number, maximum: number}} Ascending plot bounds.
   */
  #valueAxisBounds() {
    const { bottom, left, right, top } = this.#layout.frame;

    if (this.#layout.isHorizontal) {
      return {
        minimum: left,
        maximum: right,
      };
    }

    return {
      minimum: top,
      maximum: bottom,
    };
  }
}
