import { chartMark } from "../support/ChartMark.js";

const TOOLTIP_ANCHOR_OFFSET = 8;
const TOOLTIP_EDGE_GAP = 4;
const TOOLTIP_MINIMUM_VIEWPORT_WIDTH = 24;

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
   * @param {object} dimensions - Current chart dimensions used for SVG anchor projection.
   * @param {number} dimensions.width - Current logical SVG width.
   * @param {number} dimensions.height - Current logical SVG height.
   * @returns {void} Tooltip content, visibility, and position are updated together.
   */
  show(mark, { width, height }) {
    const hostBox = this.#host.getBoundingClientRect();
    const markBox = mark.getBoundingClientRect();

    this.#renderContent(mark);

    const hasAnchor = mark.dataset.tooltipAnchorX !== undefined;
    const svgBox = hasAnchor ? this.#svg.getBoundingClientRect() : null;
    const placement = mark.dataset.tooltipPlacement;

    if (hasAnchor && placement) {
      const anchorLeft =
        svgBox.left -
        hostBox.left +
        this.#host.scrollLeft +
        (Number(mark.dataset.tooltipAnchorX) / width) * svgBox.width;

      const anchorTop =
        svgBox.top -
        hostBox.top +
        this.#host.scrollTop +
        (Number(mark.dataset.tooltipAnchorY) / height) * svgBox.height;

      this.#positionBesideTarget({ left: anchorLeft, top: anchorTop, placement }, hostBox);

      return;
    }

    this.#element.style.removeProperty("transform");
    const anchor = { mark, hasSvgCoordinates: hasAnchor };
    const boxes = { host: hostBox, mark: markBox, svg: svgBox };
    const requestedLeft = this.#requestedLeft(anchor, boxes, width);
    const requestedTop = this.#requestedTop(anchor, boxes, height);

    this.#positionWithinViewport(requestedLeft, requestedTop, hostBox);
  }

  /**
   * Places a radial tooltip outside its sector without obscuring the chart.
   *
   * @param {object} anchor - Projected outer-arc coordinates and preferred side.
   * @param {DOMRect} hostBox - Current chart-host viewport bounds.
   * @returns {void} Tooltip receives clamped top-left coordinates.
   */
  #positionBesideTarget(anchor, hostBox) {
    this.#element.hidden = false;
    this.#element.style.transform = "none";
    const bounds = this.#element.getBoundingClientRect();

    const size = {
      width: Math.max(this.#element.offsetWidth, bounds.width),
      height: Math.max(this.#element.offsetHeight, bounds.height),
    };

    const origin = this.#besideOrigin(anchor, size);
    const position = this.#clampedOrigin(origin, size, hostBox);

    this.#element.style.left = `${position.left}px`;
    this.#element.style.top = `${position.top}px`;
  }

  /**
   * Resolves the top-left tooltip origin for one outer-arc side.
   *
   * @param {object} anchor - Projected coordinates and preferred placement.
   * @param {{width: number, height: number}} size - Measured tooltip dimensions.
   * @returns {{left: number, top: number}} Unclamped top-left coordinates.
   */
  #besideOrigin(anchor, size) {
    switch (anchor.placement) {
      case "top": {
        return {
          left: anchor.left - size.width / 2,
          top: anchor.top - size.height - TOOLTIP_ANCHOR_OFFSET,
        };
      }

      case "right": {
        return {
          left: anchor.left + TOOLTIP_ANCHOR_OFFSET,
          top: anchor.top - size.height / 2,
        };
      }

      case "bottom": {
        return {
          left: anchor.left - size.width / 2,
          top: anchor.top + TOOLTIP_ANCHOR_OFFSET,
        };
      }

      default: {
        return {
          left: anchor.left - size.width - TOOLTIP_ANCHOR_OFFSET,
          top: anchor.top - size.height / 2,
        };
      }
    }
  }

  /**
   * Clamps a top-left origin to the currently visible chart viewport.
   *
   * @param {{left: number, top: number}} origin - Requested tooltip origin.
   * @param {{width: number, height: number}} size - Measured tooltip dimensions.
   * @param {DOMRect} hostBox - Current chart-host viewport bounds.
   * @returns {{left: number, top: number}} Visible top-left coordinates.
   */
  #clampedOrigin(origin, size, hostBox) {
    const viewport = {
      left: this.#host.scrollLeft + TOOLTIP_EDGE_GAP,
      top: this.#host.scrollTop + TOOLTIP_EDGE_GAP,
    };

    const maximumLeft = Math.max(
      viewport.left,
      this.#host.scrollLeft + hostBox.width - size.width - TOOLTIP_EDGE_GAP,
    );

    const maximumTop = Math.max(
      viewport.top,
      this.#host.scrollTop + hostBox.height - size.height - TOOLTIP_EDGE_GAP,
    );

    return {
      left: Math.min(maximumLeft, Math.max(viewport.left, origin.left)),
      top: Math.min(maximumTop, Math.max(viewport.top, origin.top)),
    };
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
   * @returns {void} Existing tooltip children are replaced with safe text nodes.
   */
  #renderContent(mark) {
    const content = chartMark(mark).tooltip;
    const items = content.items;
    const headingText = content.heading;
    const children = items.map((item) => tooltipRow(item));

    if (headingText) {
      children.unshift(tooltipHeading(headingText));
    }

    this.#element.replaceChildren(...children);
  }
}
