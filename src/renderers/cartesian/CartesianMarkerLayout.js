import { scale } from "../../support/geometry/Math.js";
import { formatContext, formatterText } from "../../support/presentation/Formatting.js";
import { truncateText } from "../../support/presentation/TextLayout.js";

const GAP = 8;
const LABEL_GAP = 6;
const MINIMUM_PLOT_HEIGHT = 120;
const MAXIMUM_RAIL_WIDTH = 160;
const RAIL_WIDTH_RATIO = 0.25;
const MIDPOINT = 0.5;
const POSITION_TOLERANCE = 0.5;
const PLOT_WIDTH_RATIO = 0.5;
const MINIMUM_GAP = 1;
const VALUE_BASELINE_OFFSET = 7;

/**
 * Owns measured reference labels and their space outside the data frame.
 */
export default class CartesianMarkerLayout {
  /**
   * Measures visible marker labels once in the chart's CSS context.
   *
   * @param {object} chart - Render snapshot with contextual typography.
   * @param {object} state - Orientation and final value domain.
   */
  constructor(chart, state) {
    this.horizontal = state.isHorizontal;
    this.typography = chart.markerTypography;
    this.width = chart.options.width;
    this.originalWidth = chart.options.width;

    const [
      minimum,
      maximum,
    ] = state.values.domain;

    this.markers = chart.source.yMarkers
      .filter((marker) => marker.includeInDomain || (marker.value >= minimum && marker.value <= maximum))
      .map((marker) => {
        const label = marker.formatLabel
          ? formatterText(
              marker.formatLabel(marker.label, marker.value, formatContext(chart.options, "accessibility")),
              "Marker label",
            )
          : marker.label;

        return {
          marker,
          label,
          metrics: this.typography.measure(label),
        };
      });
    this.bottomClearance = this.#bottomClearance(chart, state);
    this.rowHeight = Math.max(0, ...this.markers.map(({ metrics }) => metrics.height)) + LABEL_GAP;
    this.rails = { start: 0, end: 0 };
    this.rows = new Map();
    this.gap = GAP;
    this.labelWidth = Math.max(1, Math.min(MAXIMUM_RAIL_WIDTH, this.width * RAIL_WIDTH_RATIO));
  }

  /**
   * Clears numeric tick descenders below a horizontal plot.
   *
   * @param {object} chart - Scoped axis typography and visibility.
   * @param {object} state - Formatted numeric ticks.
   * @returns {number} Additional bottom rail footprint.
   */
  #bottomClearance(chart, state) {
    const hasStartLabels = this.markers.some(
      ({ marker, label }) => label && marker.labelPosition === "start",
    );

    if (!this.horizontal || !hasStartLabels || !chart.options.valueLabels) {
      return 0;
    }

    const descents = [
      ...state.values.labels.values(),
    ].map((label) => {
      const metrics = chart.axisTypography.measure(label);

      return metrics.y + metrics.height;
    });

    return Math.max(0, Math.max(...descents) - VALUE_BASELINE_OFFSET + MINIMUM_GAP);
  }

  /**
   * Reserves bounded rails without changing the caller's typography.
   *
   * @param {object} frame - Frame after numeric or category gutters.
   * @param {number[]} domain - Value domain used for horizontal row packing.
   * @returns {number} Minimum plot height for complete visible labels.
   */
  reserve(frame, domain) {
    this.#railBudget(frame);

    const counts = [
      "start",
      "end",
    ].map((side) => this.#reserveSide(side, frame, domain));

    const hasRail = counts.some((count) => count > 0);

    if (!hasRail) {
      return 0;
    }

    return this.horizontal
      ? MINIMUM_PLOT_HEIGHT
      : Math.max(MINIMUM_PLOT_HEIGHT, Math.max(...counts) * this.rowHeight);
  }

  /**
   * Budgets both side rails jointly after the axis gutter.
   *
   * @param {object} frame - Mutable frame before final scale binding.
   * @returns {void} Bounded label width, gaps and intrinsic width are resolved.
   */
  #railBudget(frame) {
    if (this.horizontal) {
      this.#horizontalBudget(frame);

      return;
    }

    const sides = new Set(
      this.markers
        .filter(({ marker, label }) => label && marker.labelPosition !== "center")
        .map(({ marker }) => marker.labelPosition),
    );

    if (sides.size === 0) {
      return;
    }

    const glyphWidth = this.typography.measure("…").width;
    const minimumRails = sides.size * (glyphWidth + 2 * MINIMUM_GAP);
    const available = frame.right - frame.left;
    const growth = Math.max(0, minimumRails + MINIMUM_GAP - available);
    this.width += growth;

    const railWidth = Math.max(
      glyphWidth + 2 * MINIMUM_GAP,
      ((available + growth) * (1 - PLOT_WIDTH_RATIO)) / sides.size,
    );

    this.gap = Math.min(GAP, Math.max(MINIMUM_GAP, (railWidth - glyphWidth) / 2));
    this.labelWidth = Math.max(glyphWidth, Math.min(this.labelWidth, railWidth - 2 * this.gap));
  }

  /**
   * Keeps horizontal callouts and their routing corridor within the frame.
   *
   * @param {object} frame - Plot width after category labels.
   * @returns {void} Minimal intrinsic width and bounded label width are resolved.
   */
  #horizontalBudget(frame) {
    const hasLabels = this.markers.some(({ marker, label }) => label && marker.labelPosition !== "center");

    if (!hasLabels) {
      return;
    }

    const glyphWidth = this.typography.measure("…").width;
    const available = frame.right - frame.left;
    const growth = Math.max(0, glyphWidth + 2 * GAP - available);
    this.width += growth;
    this.labelWidth = Math.max(glyphWidth, Math.min(this.labelWidth, available + growth - 2 * GAP));
  }

  /**
   * Measures and reserves one named rail.
   *
   * @param {string} side - Requested outside edge.
   * @param {object} frame - Frame with axis gutters.
   * @param {number[]} domain - Final numeric domain.
   * @returns {number} Number of visible labels on this rail.
   */
  #reserveSide(side, frame, domain) {
    const labels = this.markers.filter(({ marker, label }) => marker.labelPosition === side && label);
    const maximumWidth = this.labelWidth;

    for (const item of labels) {
      Object.assign(item, this.#fitLabel(item, maximumWidth));
    }

    if (labels.length === 0) {
      return 0;
    }

    this.rails[side] = this.horizontal
      ? this.#horizontalRows(
          labels,
          { ...frame, right: frame.right + this.width - this.originalWidth },
          domain,
        ) *
          this.rowHeight +
        GAP
      : Math.max(...labels.map(({ metrics }) => metrics.width)) + 2 * this.gap;

    this.rails[side] += side === "start" ? this.bottomClearance : 0;

    return labels.length;
  }

  /**
   * Fits measured glyphs to their available width and preserves full source text.
   *
   * @param {object} item - Formatted reference label.
   * @param {number} maximumWidth - Available glyph width.
   * @returns {object} Visible text and metrics resolved together.
   */
  #fitLabel(item, maximumWidth) {
    const visible = truncateText(item.label, maximumWidth, (value) => this.typography.measure(value).width);
    const metrics = this.typography.measure(visible);

    if (metrics.width <= maximumWidth) {
      return {
        ...item,
        visible,
        metrics,
      };
    }

    return {
      ...item,
      visible: "…",
      metrics: this.typography.measure("…"),
    };
  }

  /**
   * Packs horizontal labels into nonoverlapping outside rows.
   *
   * @param {object[]} labels - Measured labels on one side.
   * @param {object} frame - Available plot width.
   * @param {number[]} domain - Final numeric domain.
   * @returns {number} Number of required rows.
   */
  #horizontalRows(labels, frame, domain) {
    const rows = [];
    const ordered = labels.toSorted((a, b) => a.marker.value - b.marker.value);

    for (const item of ordered) {
      const position = scale(item.marker.value, domain, [
        frame.left,
        frame.right,
      ]);

      const x = Math.min(
        frame.right - GAP - item.metrics.width,
        Math.max(frame.left + GAP, position - item.metrics.width / 2),
      );

      const availableRow = rows.findIndex((end) => end + GAP <= x);
      const row = availableRow === 0 ? 0 : rows.length;
      rows[row] = x + item.metrics.width;
      this.rows.set(item, { row, x });
    }

    return rows.length;
  }

  /**
   * Produces immutable coordinates after scales and rail bounds are final.
   *
   * @param {object} layout - Final frame, axes and coordinate mapping.
   * @returns {object[]} Final labels with optional outside leader paths.
   */
  placements(layout) {
    return Object.freeze(
      [
        "start",
        "end",
        "center",
      ].flatMap((side) => {
        const items = this.markers.filter(({ marker, label }) => marker.labelPosition === side && label);

        if (side === "center") {
          return items.map((item) => this.#centerLabel(item, layout));
        }

        if (this.horizontal) {
          return items.map((item) => this.#horizontalLabel(item, layout, side));
        }

        return this.#verticalLabels(items, layout, side);
      }),
    );
  }

  /**
   * Resolves the explicit inside placement.
   *
   * @param {object} item - Measured reference label.
   * @param {object} layout - Final scales and frame.
   * @returns {object} Immutable inside label.
   */
  #centerLabel(item, layout) {
    const { frame } = layout;

    const fitted = this.#fitLabel(
      item,
      Math.max(this.typography.measure("…").width, frame.right - frame.left - 2 * GAP),
    );

    const position = layout.valueAt(item.marker.value);

    const horizontalX =
      position > (frame.left + frame.right) / 2 ? position - GAP - fitted.metrics.width : position + GAP;

    const preferredX = this.horizontal ? horizontalX : (frame.left + frame.right - fitted.metrics.width) / 2;
    const x = Math.min(frame.right - fitted.metrics.width, Math.max(frame.left, preferredX));

    const center = this.horizontal
      ? (frame.top + frame.bottom) / 2
      : Math.max(frame.top + fitted.metrics.height / 2, position - GAP - fitted.metrics.height / 2);

    return this.#label(fitted, { x, center });
  }

  /**
   * Places a horizontal reference label in its measured row.
   *
   * @param {object} item - Measured reference label.
   * @param {object} layout - Final scales and frame.
   * @param {string} side - Requested outside edge.
   * @returns {object} Immutable outside label.
   */
  #horizontalLabel(item, layout, side) {
    const { frame } = layout;
    const { row, x } = this.rows.get(item);

    const center =
      side === "end"
        ? frame.top - GAP - (row + MIDPOINT) * this.rowHeight
        : frame.bottom + frame.padding + this.bottomClearance + GAP + (row + MIDPOINT) * this.rowHeight;

    const position = layout.valueAt(item.marker.value);
    const edge = side === "end" ? frame.top : frame.bottom + frame.padding + this.bottomClearance;
    const geometry = { row, x, center, position, edge, side };
    const leader = this.#horizontalLeader(item, layout, geometry);

    return this.#label(item, { x, center, leader });
  }

  /**
   * Routes displaced labels through the empty outside corridor.
   *
   * @param {object} item - Measured reference label.
   * @param {object} layout - Final frame.
   * @param {object} geometry - Label row and true reference endpoint.
   * @returns {string | null} Leader path ending before the glyph edge.
   */
  #horizontalLeader(item, layout, geometry) {
    const { row, x, center, position, edge, side } = geometry;
    const corridor = layout.frame.left + GAP / 2;

    if (row > 0) {
      return `M ${position} ${edge} L ${corridor} ${edge} L ${corridor} ${center} L ${x - LABEL_GAP / 2} ${center}`;
    }

    if (Math.abs(x + item.metrics.width / 2 - position) <= POSITION_TOLERANCE) {
      return null;
    }

    const nearEdge =
      side === "end"
        ? center + item.metrics.height / 2 + LABEL_GAP / 2
        : center - item.metrics.height / 2 - LABEL_GAP / 2;

    return `M ${position} ${edge} L ${x + item.metrics.width / 2} ${nearEdge}`;
  }

  /**
   * Packs vertical label centers while preserving value order.
   *
   * @param {object[]} items - Measured labels on one side.
   * @param {object} layout - Final scales and frame.
   * @param {string} side - Requested outside edge.
   * @returns {object[]} Immutable outside labels.
   */
  #verticalLabels(items, layout, side) {
    const ordered = items.toSorted((a, b) => layout.valueAt(a.marker.value) - layout.valueAt(b.marker.value));
    const centers = ordered.map((item) => layout.valueAt(item.marker.value));
    const { frame } = layout;

    for (let index = 0; index < centers.length; index += 1) {
      centers[index] = Math.max(
        frame.top + this.rowHeight / 2,
        centers[index],
        index ? centers[index - 1] + this.rowHeight : 0,
      );
    }

    for (let index = centers.length - 1; index >= 0; index -= 1) {
      const following = index < centers.length - 1 ? centers[index + 1] - this.rowHeight : Infinity;
      centers[index] = Math.min(frame.bottom - this.rowHeight / 2, centers[index], following);
    }

    return ordered.map((item, index) => this.#verticalLabel(item, layout, { side, center: centers[index] }));
  }

  /**
   * Places a reference label beyond its axis gutter.
   *
   * @param {object} item - Measured reference label.
   * @param {object} layout - Final scales and frame.
   * @param {object} placement - Outside edge and packed center.
   * @param {string} placement.side - Requested outside edge.
   * @param {number} placement.center - Packed glyph center.
   * @returns {object} Immutable outside label.
   */
  #verticalLabel(item, layout, placement) {
    const { frame } = layout;
    const { side, center } = placement;
    const onAxisSide = side === "end" ? layout.isYAxisRight : !layout.isYAxisRight;
    const axisGutter = onAxisSide ? layout.categories.gutter : 0;
    const edge = side === "end" ? frame.right + axisGutter : frame.left - axisGutter;
    const x = side === "end" ? edge + this.gap : edge - this.gap - item.metrics.width;
    const endpoint = side === "end" ? x - this.gap / 2 : x + item.metrics.width + this.gap / 2;

    const leader =
      Math.abs(center - layout.valueAt(item.marker.value)) > POSITION_TOLERANCE
        ? `M ${edge} ${layout.valueAt(item.marker.value)} L ${endpoint} ${center}`
        : null;

    return this.#label(item, { x, center, leader });
  }

  /**
   * Freezes complete text presentation for the append-only renderer.
   *
   * @param {object} item - Measured marker.
   * @param {object} placement - Physical position and optional leader path.
   * @param {number} placement.x - Physical left edge.
   * @param {number} placement.center - Packed glyph center.
   * @param {string | null} [placement.leader=null] - Optional outside leader.
   * @returns {object} Immutable drawable label.
   */
  #label(item, { x, center, leader = null }) {
    return Object.freeze({
      marker: item.marker,
      label: item.label,
      visible: item.visible,
      x: x - item.metrics.x,
      y: center - item.metrics.y - item.metrics.height / 2,
      leader,
    });
  }
}
