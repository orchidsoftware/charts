import { chartMark, markMetadata } from "../support/ChartMark.js";
import { svg, titled } from "../support/Dom.js";

/**
 * Owns append-only access to the SVG root used during one rendering pass.
 */
export default class SvgSurface {
  #root;
  #visuals = new Map();

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
    this.#linkMark(element);
    this.#root.append(element);

    return element;
  }

  /**
   * Links hit targets to visual peers using renderer-provided model coordinates.
   *
   * @param {SVGElement} element - Newly appended data element.
   * @returns {void} The explicit mark record receives its visual peer.
   */
  #linkMark(element) {
    const record = chartMark(element);

    if (!record) {
      return;
    }

    const key = `${record.datasetIndex}:${record.pointIndex}`;

    if (record.kind === "visual") {
      this.#visuals.set(key, element);
    }

    record.visualElement = this.#visuals.get(key) ?? element;
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
  mark(name, attributes, { dataset, point, title, kind = "point" }) {
    const element = titled(
      markMetadata(svg(name, attributes), { kind, datasetIndex: dataset, pointIndex: point }),
      title,
    );

    return this.append(element);
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
   * Updates one attribute on the owned SVG root.
   *
   * @param {string} name - Root attribute name.
   * @param {string | number} value - Serializable attribute value.
   * @returns {void} The existing root is updated in place.
   */
  attribute(name, value) {
    this.#root.setAttribute(name, String(value));
  }

  /**
   * Applies a bounded set of inline styles to the owned SVG root.
   *
   * @param {Record<string, string>} properties - CSS property names and values.
   * @returns {void} Root style declarations are updated in place.
   */
  styles(properties) {
    Object.assign(this.#root.style, properties);
  }
}
