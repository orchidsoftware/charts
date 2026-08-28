import { DEFAULT_COLORS } from "../support/Constants.js";

const TOOLTIP_ANCHOR_OFFSET = 8;
const TOOLTIP_EDGE_GAP = 4;
const TOOLTIP_MINIMUM_VIEWPORT_WIDTH = 24;
const TOOLTIP_SEPARATOR = ": ";
const TOOLTIP_SEPARATOR_LENGTH = TOOLTIP_SEPARATOR.length;

/**
 * Creates one text-only tooltip heading.
 *
 * @param {string} text - Heading content supplied by normalized metadata.
 * @returns {HTMLDivElement} Safe heading node.
 */
function tooltipHeading(text) {
  const heading = document.createElement("div");

  heading.className = "charts2-tooltip-heading";
  heading.textContent = text;

  return heading;
}

/**
 * Creates one structured tooltip row.
 *
 * @param {{name: string, value: string, color: string}} item - Display-ready series item.
 * @returns {HTMLDivElement} Safe row containing swatch, name, and value nodes.
 */
function tooltipRow(item) {
  const row = document.createElement("div");
  const swatch = document.createElement("i");
  const name = document.createElement("span");
  const value = document.createElement("strong");

  row.className = "charts2-tooltip-row";
  swatch.className = "charts2-series-swatch";
  swatch.setAttribute("aria-hidden", "true");
  swatch.style.background = item.color;
  name.textContent = item.name;
  value.textContent = item.value;
  row.append(swatch, name, value);

  return row;
}

/**
 * Owns tooltip DOM, safe content construction, and viewport-aware placement for
 * one chart surface.
 */
export default class ChartTooltip {
  #host;
  #svg;
  #element;

  /**
   * Creates the detached status element associated with one chart SVG.
   *
   * @param {Element} host - Scroll viewport used to clamp tooltip placement.
   * @param {SVGSVGElement} svg - SVG surface containing tooltip anchor marks.
   * @param {number} chartId - Process-local identifier used by accessibility attributes.
   */
  constructor(host, svg, chartId) {
    this.#host = host;
    this.#svg = svg;
    this.#element = document.createElement("div");
    this.#element.className = "charts2-tooltip";
    this.#element.hidden = true;
    this.#element.setAttribute("role", "status");
    this.#element.id = `charts2-tooltip-${chartId}`;
  }

  /**
   * Exposes the owned tooltip element for initial host mounting.
   *
   * @returns {HTMLDivElement} Detached or mounted tooltip status element.
   */
  get element() {
    return this.#element;
  }

  /**
   * Builds safe content and presents it beside one rendered mark.
   *
   * @param {SVGElement} mark - Interactive mark carrying tooltip metadata.
   * @param {string} label - Fallback tooltip label when structured items are unavailable.
   * @param {object} dimensions - Current chart dimensions used for SVG anchor projection.
   * @param {number} dimensions.width - Current logical SVG width.
   * @param {number} dimensions.height - Current logical SVG height.
   * @returns {void} Tooltip content, visibility, and position are updated together.
   */
  show(mark, label, { width, height }) {
    const hostBox = this.#host.getBoundingClientRect();
    const markBox = mark.getBoundingClientRect();

    this.#renderContent(mark, label);

    const hasAnchor = mark.dataset.tooltipAnchorX !== undefined;
    const svgBox = hasAnchor ? this.#svg.getBoundingClientRect() : null;
    const anchor = { mark, hasSvgCoordinates: hasAnchor };
    const boxes = { host: hostBox, mark: markBox, svg: svgBox };
    const requestedLeft = this.#requestedLeft(anchor, boxes, width);
    const requestedTop = this.#requestedTop(anchor, boxes, height);

    this.#positionWithinViewport(requestedLeft, requestedTop, hostBox);
  }

  /**
   * Resolves the preferred horizontal tooltip anchor.
   *
   * @param {object} anchor - Mark and its coordinate-system policy.
   * @param {object} boxes - Measured host, mark, and optional SVG bounds.
   * @param {number} width - Logical SVG width.
   * @returns {number} Preferred horizontal center in host coordinates.
   */
  #requestedLeft(anchor, boxes, width) {
    if (!anchor.hasSvgCoordinates) {
      return boxes.mark.left - boxes.host.left + this.#host.scrollLeft + boxes.mark.width / 2;
    }

    const anchorRatio = Number(anchor.mark.dataset.tooltipAnchorX) / width;
    const projectedAnchor = anchorRatio * boxes.svg.width;

    return boxes.svg.left - boxes.host.left + this.#host.scrollLeft + projectedAnchor;
  }

  /**
   * Resolves the preferred vertical tooltip anchor.
   *
   * @param {object} anchor - Mark and its coordinate-system policy.
   * @param {object} boxes - Measured host, mark, and optional SVG bounds.
   * @param {number} height - Logical SVG height.
   * @returns {number} Preferred tooltip bottom edge in host coordinates.
   */
  #requestedTop(anchor, boxes, height) {
    if (anchor.hasSvgCoordinates) {
      const anchorRatio = Number(anchor.mark.dataset.tooltipAnchorY) / height;
      const projectedAnchor = anchorRatio * boxes.svg.height;

      return Math.max(
        0,
        boxes.svg.top - boxes.host.top + this.#host.scrollTop + projectedAnchor - TOOLTIP_ANCHOR_OFFSET,
      );
    }

    if (anchor.mark.classList.contains("charts2-x-hit")) {
      return boxes.mark.top - boxes.host.top + this.#host.scrollTop + boxes.mark.height / 2;
    }

    return Math.max(0, boxes.mark.top - boxes.host.top + this.#host.scrollTop - TOOLTIP_ANCHOR_OFFSET);
  }

  /**
   * Hides tooltip presentation without changing chart selection state.
   *
   * @returns {void} The owned status element becomes hidden.
   */
  hide() {
    this.#element.hidden = true;
  }

  /**
   * Removes the owned tooltip element from its host.
   *
   * @returns {void} Tooltip DOM is detached permanently.
   */
  destroy() {
    this.#element.remove();
  }

  /**
   * Clamps a requested anchor to the host's visible scroll viewport.
   *
   * @param {number} requestedLeft - Preferred horizontal center in host coordinates.
   * @param {number} requestedTop - Preferred bottom edge in host coordinates.
   * @param {DOMRect} hostBox - Current chart-host viewport bounds.
   * @returns {void} Tooltip style coordinates and visibility are updated in place.
   */
  #positionWithinViewport(requestedLeft, requestedTop, hostBox) {
    this.#element.hidden = false;
    const tooltipBounds = this.#element.getBoundingClientRect();
    const left = this.#clampedLeft(requestedLeft, hostBox, tooltipBounds);
    const top = this.#clampedTop(requestedTop, hostBox, tooltipBounds);

    this.#element.style.left = `${left}px`;
    this.#element.style.top = `${top}px`;
  }

  /**
   * Clamps a horizontal tooltip center to the visible host width.
   *
   * @param {number} requestedLeft - Preferred horizontal center.
   * @param {DOMRect} hostBox - Current host bounds.
   * @param {DOMRect} tooltipBounds - Current tooltip bounds.
   * @returns {number} Visible horizontal center in host coordinates.
   */
  #clampedLeft(requestedLeft, hostBox, tooltipBounds) {
    if (hostBox.width <= TOOLTIP_MINIMUM_VIEWPORT_WIDTH) {
      return requestedLeft;
    }

    const halfWidth = Math.max(this.#element.offsetWidth, tooltipBounds.width) / 2;
    const viewportLeft = this.#host.scrollLeft;
    const maximumLeft = viewportLeft + hostBox.width - halfWidth - TOOLTIP_EDGE_GAP;
    const minimumLeft = viewportLeft + halfWidth + TOOLTIP_EDGE_GAP;

    return Math.min(maximumLeft, Math.max(minimumLeft, requestedLeft));
  }

  /**
   * Clamps a vertical tooltip edge to the visible host height.
   *
   * @param {number} requestedTop - Preferred bottom edge.
   * @param {DOMRect} hostBox - Current host bounds.
   * @param {DOMRect} tooltipBounds - Current tooltip bounds.
   * @returns {number} Visible bottom edge in host coordinates.
   */
  #clampedTop(requestedTop, hostBox, tooltipBounds) {
    const tooltipHeight = Math.max(this.#element.offsetHeight, tooltipBounds.height);
    const viewportTop = this.#host.scrollTop;
    const minimumTop = viewportTop + tooltipHeight + TOOLTIP_EDGE_GAP;

    if (hostBox.height <= tooltipHeight + TOOLTIP_ANCHOR_OFFSET) {
      return minimumTop;
    }

    const maximumTop = Math.max(minimumTop, viewportTop + hostBox.height - TOOLTIP_EDGE_GAP);

    return Math.min(maximumTop, Math.max(minimumTop, requestedTop));
  }

  /**
   * Builds safe DOM nodes from structured or fallback tooltip metadata.
   *
   * @param {SVGElement} mark - Mark containing serialized tooltip fields.
   * @param {string} label - Plain-text fallback in `name: value` form.
   * @returns {void} Existing tooltip children are replaced with safe text nodes.
   */
  #renderContent(mark, label) {
    const rawLabel = String(label ?? "");
    const separator = rawLabel.lastIndexOf(TOOLTIP_SEPARATOR);

    const fallbackItems =
      separator === -1
        ? []
        : [
            {
              name: rawLabel.slice(0, separator),
              value: rawLabel.slice(separator + TOOLTIP_SEPARATOR_LENGTH),
              color: this.#colorForMark(mark),
            },
          ];

    const items = mark.dataset.tooltipItems ? JSON.parse(mark.dataset.tooltipItems) : fallbackItems;
    const headingText = mark.dataset.tooltipHeading ?? (separator === -1 ? rawLabel : "");
    const children = items.map((item) => tooltipRow(item));

    if (headingText) {
      children.unshift(tooltipHeading(headingText));
    }

    this.#element.replaceChildren(...children);
  }

  /**
   * Resolves the first visible presentation color available on a mark.
   *
   * @param {SVGElement} mark - Mark whose fill, stroke, or text color represents its series.
   * @returns {string} CSS color used for a tooltip swatch.
   */
  #colorForMark(mark) {
    const candidates = [mark.getAttribute("fill"), mark.getAttribute("stroke"), mark.style.color];

    return candidates.find((color) => color && !["none", "transparent"].includes(color)) ?? DEFAULT_COLORS[0];
  }
}
