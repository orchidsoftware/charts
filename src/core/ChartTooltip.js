import { chartMark } from "../support/ChartMark.js";

const TOOLTIP_ANCHOR_OFFSET = 8;
const TOOLTIP_EDGE_GAP = 4;

/**
 * Creates one text-only tooltip heading.
 *
 * @param {string} text - Heading content supplied by normalized metadata.
 * @returns {HTMLDivElement} Safe heading node.
 */
function tooltipHeading(text) {
  const heading = document.createElement("div");

  heading.className = "orchid-charts-tooltip-heading";
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

  row.className = "orchid-charts-tooltip-row";
  swatch.className = "orchid-charts-series-swatch";
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
    this.#element.className = "orchid-charts-tooltip";
    this.#element.hidden = true;
    this.#element.setAttribute("role", "status");
    this.#element.id = `orchid-charts-tooltip-${chartId}`;
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
  show(mark, dimensions) {
    const hostBox = this.#host.getBoundingClientRect();
    this.#renderContent(mark);
    this.#element.hidden = false;
    this.#element.style.transform = "none";
    const bounds = this.#element.getBoundingClientRect();

    const size = {
      width: bounds.width,
      height: bounds.height,
    };

    const anchor = this.#anchor(mark, dimensions, hostBox);
    const position = this.#position(anchor, size, hostBox);
    this.#element.style.left = `${position.left}px`;
    this.#element.style.top = `${position.top}px`;
  }

  /**
   * Projects either an explicit SVG anchor or the mark's bounds into host coordinates.
   *
   * @param {SVGElement} mark - Current target.
   * @param {object} dimensions - Actual SVG dimensions.
   * @param {DOMRect} hostBox - Current host bounds.
   * @returns {object} Host-relative anchor and preferred placement.
   */
  #anchor(mark, dimensions, hostBox) {
    const record = chartMark(mark);
    const anchor = record.anchor;
    const box = anchor ? this.#svg.getBoundingClientRect() : mark.getBoundingClientRect();
    const left = box.left - hostBox.left + this.#host.scrollLeft;
    const top = box.top - hostBox.top + this.#host.scrollTop;

    if (anchor) {
      const project = (point) => ({
        left: left + (point.x / dimensions.width) * box.width,
        top: top + (point.y / dimensions.height) * box.height,
        placement: point.placement ?? "top",
      });

      return {
        ...project(anchor),
        contentHeight:
          anchor.contentHeight === undefined
            ? hostBox.height
            : (anchor.contentHeight / dimensions.height) * box.height,
        fallback: anchor.fallback && project(anchor.fallback),
      };
    }

    return {
      left: left + box.width / 2,
      top: record.kind === "category" ? top + box.height / 2 + TOOLTIP_ANCHOR_OFFSET : top,
      placement: "top",
    };
  }

  /**
   * Keeps radial details off the active axis when the outward side has no room.
   *
   * @param {object} anchor - Projected anchor with optional fallback and content height.
   * @param {object} size - Measured tooltip dimensions.
   * @param {object} hostBox - Visible chart viewport.
   * @returns {object} Clamped origin outside any reserved legend space.
   */
  #position(anchor, size, hostBox) {
    const viewport = { width: hostBox.width, height: anchor.contentHeight ?? hostBox.height };
    const preferred = this.#besideOrigin(anchor, size);
    const clamped = this.#clampedOrigin(preferred, size, viewport);

    if (anchor.fallback && (preferred.left !== clamped.left || preferred.top !== clamped.top)) {
      return this.#clampedOrigin(this.#besideOrigin(anchor.fallback, size), size, viewport);
    }

    return clamped;
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
   * Builds safe DOM nodes from structured or fallback tooltip metadata.
   *
   * @param {SVGElement} mark - Mark containing serialized tooltip fields.
   * @returns {void} Existing tooltip children are replaced with safe text nodes.
   */
  #renderContent(mark) {
    const content = chartMark(mark).tooltip;
    this.#element.classList.toggle("orchid-charts-tooltip-wrap", Boolean(content.wrapNames));
    const items = content.items;
    const headingText = content.heading;
    const children = items.map((item) => tooltipRow(item));

    if (headingText) {
      children.unshift(tooltipHeading(headingText));
    }

    this.#element.replaceChildren(...children);
  }
}
