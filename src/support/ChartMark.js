const marks = new WeakMap();

/**
 * Registers one complete renderer-owned mark; DOM attributes are diagnostic projections.
 *
 * @param {SVGElement} element - Visual element or hit target.
 * @param {object} source - Address, accessible text, tooltip, anchor and visual peer.
 * @returns {SVGElement} Registered element.
 */
function markMetadata(element, source) {
  marks.set(element, source);
  Object.assign(element.dataset, {
    datasetIndex: String(source.datasetIndex),
    pointIndex: String(source.pointIndex),
    tooltip: source.label,
    tooltipHeading: source.tooltip.heading,
    tooltipItems: JSON.stringify(source.tooltip.items),
  });
  if (source.anchor) {
    Object.assign(element.dataset, {
      tooltipAnchorX: String(source.anchor.x),
      tooltipAnchorY: String(source.anchor.y),
    });
    if (source.anchor.placement) {
      Object.assign(element.dataset, { tooltipPlacement: source.anchor.placement });
    }
  }

  return element;
}

/**
 * Reads a renderer-owned mark without interpreting diagnostic DOM attributes.
 *
 * @param {SVGElement} element - Registered element.
 * @returns {object | undefined} Complete mark record.
 */
function chartMark(element) {
  return marks.get(element);
}

export { chartMark, markMetadata };
