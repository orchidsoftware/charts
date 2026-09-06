import { markMetadata } from "../support/ChartMark.js";
import { svg, titled } from "../support/Dom.js";

/**
 * Owns append-only access to the SVG root used during one rendering pass.
 */
export default class SvgSurface {
  #root;

  /**
   * Captures the SVG element owned by the chart lifecycle.
   *
   * @param {SVGSVGElement} root - Existing chart SVG that receives rendered nodes.
   */
  constructor(root) {
    this.#root = root;
  }

  /**
   * Appends either an existing SVG node or a newly created element.
   *
   * @param {SVGElement | string} node - Existing node or SVG tag name.
   * @param {Record<string, string | number>} [attributes={}] - Attributes used when a tag name is supplied.
   * @returns {SVGElement} Appended SVG element.
   */
  append(node, attributes = {}) {
    const element = typeof node === "string" ? svg(node, attributes) : node;
    this.#root.append(element);

    return element;
  }

  /**
   * Creates and appends one interactive data mark with source metadata.
   *
   * @param {string} name - SVG tag name for the mark.
   * @param {Record<string, string | number>} attributes - Visual and geometric attributes.
   * @param {object} metadata - Source coordinates and accessible title.
   * @param {number} metadata.dataset - Zero-based dataset position.
   * @param {number} metadata.point - Zero-based point position.
   * @param {string | object} metadata.title - Accessible text and structured tooltip content.
   * @param {string} [metadata.kind="point"] - Explicit model mark kind.
   * @returns {SVGElement} Appended interactive mark.
   */
  mark(name, attributes, metadata) {
    const { dataset, point, title, kind = "point", visualElement, tooltip, anchor, inspection } = metadata;
    const element = typeof name === "string" ? svg(name, attributes) : name;
    const label = typeof title === "string" ? title : title.text;
    const content = tooltip ?? (typeof title === "string" ? { heading: title, items: [] } : title);
    markMetadata(element, {
      kind,
      datasetIndex: dataset,
      pointIndex: point,
      visualElement: visualElement ?? element,
      label,
      tooltip: content,
      anchor,
      inspection,
    });

    return this.append(titled(element, label));
  }

  /**
   * Creates and appends one text node with explicit content.
   *
   * @param {unknown} value - Content converted to text.
   * @param {Record<string, string | number>} attributes - SVG positioning and presentation attributes.
   * @returns {SVGElement} Appended text element.
   */
  text(value, attributes) {
    const element = svg("text", attributes);
    element.textContent = String(value);
    this.#root.append(element);

    return element;
  }

  /**
   * Applies the actual dimensions resolved by the family layout.
   *
   * @param {object} dimensions - Logical SVG width and height.
   * @param {number} dimensions.width - Logical width.
   * @param {number} dimensions.height - Logical height.
   * @returns {void} Updates the detached surface consistently.
   */
  size({ width, height }) {
    this.#root.setAttribute("viewBox", `0 0 ${width} ${height}`);
    this.#root.setAttribute("height", String(height));
  }
}
