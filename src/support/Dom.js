import { SVG_NS } from "./Constants.js";

/**
 * Creates an SVG element and serializes its initial attributes.
 *
 * @param {string} name - SVG tag name to create within the SVG namespace.
 * @param {Record<string, string | number>} [attributes={}] - Initial attributes applied to the element.
 * @returns {SVGElement} Newly created, detached SVG element.
 */
function svg(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);

  for (const [
    key,
    value,
  ] of Object.entries(attributes)) {
    element.setAttribute(key, String(value));
  }

  return element;
}

/**
 * Adds both a native SVG title and tooltip metadata to an element.
 *
 * @param {SVGElement} element - SVG node that should expose supplementary text.
 * @param {string} text - Accessible title.
 * @returns {SVGElement} The original element after enrichment.
 */
function titled(element, text) {
  const title = svg("title");
  title.textContent = text;
  element.append(title);

  return element;
}

/**
 * Resolves a caller-supplied selector or validates an existing host element.
 *
 * @param {string | Element} parent - CSS selector or concrete chart host.
 * @returns {Element} Valid DOM element that can own generated chart markup.
 * @throws {TypeError} When a selector has no match or the value is not an element.
 */
function resolveParent(parent) {
  const element = typeof parent === "string" ? document.querySelector(parent) : parent;

  if (!(element instanceof Element)) {
    throw new TypeError("Chart parent must be an element or a valid selector");
  }

  return element;
}

/**
 * Measures the untransformed content box that contains the full-width SVG.
 *
 * @param {Element} parent - Chart host whose content box is measured.
 * @param {number} [fallback=640] - Width used for hidden elements and DOM test environments.
 * @returns {number} Positive finite layout width in CSS pixels.
 */
function measureParentWidth(parent, fallback = 640) {
  if (parent.getClientRects().length === 0) {
    return fallback;
  }

  const style = getComputedStyle(parent);
  let width = Number(style.width.replace("px", ""));

  if (style.boxSizing === "border-box") {
    const decorationWidth = [
      "padding-left",
      "padding-right",
      "border-left-width",
      "border-right-width",
    ].reduce((sum, property) => sum + Number(style.getPropertyValue(property).replace("px", "")), 0);

    width -= decorationWidth;
  }

  if (Number.isFinite(width) && width > 0) {
    return width;
  }

  return fallback;
}

export { svg, titled, resolveParent, measureParentWidth };
