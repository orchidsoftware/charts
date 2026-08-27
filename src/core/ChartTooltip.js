import { DEFAULT_COLORS } from "../support/Constants.js";

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
    const requestedLeft = hasAnchor
      ? svgBox.left -
        hostBox.left +
        this.#host.scrollLeft +
        (Number(mark.dataset.tooltipAnchorX) / width) * svgBox.width
      : markBox.left - hostBox.left + this.#host.scrollLeft + markBox.width / 2;
    let requestedTop = Math.max(0, markBox.top - hostBox.top + this.#host.scrollTop - 8);
    if (hasAnchor) {
      requestedTop = Math.max(
        0,
        svgBox.top -
          hostBox.top +
          this.#host.scrollTop +
          (Number(mark.dataset.tooltipAnchorY) / height) * svgBox.height -
          8,
      );
    } else if (mark.classList.contains("charts2-x-hit")) {
      requestedTop = markBox.top - hostBox.top + this.#host.scrollTop + markBox.height / 2;
    }
    this.#positionWithinViewport(requestedLeft, requestedTop, hostBox);
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
    const halfWidth = Math.max(this.#element.offsetWidth, tooltipBounds.width) / 2;
    const viewportLeft = this.#host.scrollLeft;
    const left =
      hostBox.width > 24
        ? Math.min(viewportLeft + hostBox.width - halfWidth - 4, Math.max(viewportLeft + halfWidth + 4, requestedLeft))
        : requestedLeft;
    const tooltipHeight = Math.max(this.#element.offsetHeight, tooltipBounds.height);
    const viewportTop = this.#host.scrollTop;
    const minimumTop = viewportTop + tooltipHeight + 4;
    const maximumTop = Math.max(minimumTop, viewportTop + hostBox.height - 4);
    const top =
      hostBox.height > tooltipHeight + 8 ? Math.min(maximumTop, Math.max(minimumTop, requestedTop)) : minimumTop;
    this.#element.style.left = `${left}px`;
    this.#element.style.top = `${top}px`;
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
    const separator = rawLabel.lastIndexOf(": ");
    const fallbackItems =
      separator === -1
        ? []
        : [
            {
              name: rawLabel.slice(0, separator),
              value: rawLabel.slice(separator + 2),
              color: this.#colorForMark(mark),
            },
          ];
    const items = mark.dataset.tooltipItems ? JSON.parse(mark.dataset.tooltipItems) : fallbackItems;
    const headingText = mark.dataset.tooltipHeading ?? (separator === -1 ? rawLabel : "");
    const heading = headingText ? document.createElement("div") : null;
    if (heading) {
      heading.className = "charts2-tooltip-heading";
      heading.textContent = headingText;
    }
    const rows = items.map((item) => {
      const row = document.createElement("div");
      row.className = "charts2-tooltip-row";
      const swatch = document.createElement("i");
      swatch.className = "charts2-series-swatch";
      swatch.setAttribute("aria-hidden", "true");
      swatch.style.background = item.color;
      const value = document.createElement("strong");
      value.textContent = item.value;
      const name = document.createElement("span");
      name.textContent = item.name;
      row.append(swatch, name, value);
      return row;
    });
    this.#element.replaceChildren(...(heading ? [heading] : []), ...rows);
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
