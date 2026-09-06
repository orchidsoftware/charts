const marks = new WeakMap();

/**
 * Associates an element with explicit model coordinates and presentation peers.
 *
 * @param {SVGElement} element - Rendered data element.
 * @param {object} source - Mark kind and model coordinates.
 * @returns {SVGElement} The same element, ready for appending.
 */
function markMetadata(element, source) {
  marks.set(element, { ...source, visualElement: element });
  Object.assign(element.dataset, {
    datasetIndex: String(source.datasetIndex),
    pointIndex: String(source.pointIndex),
  });

  return element;
}

/**
 * Reads the explicit record attached by a family renderer.
 *
 * @param {SVGElement} element - Rendered data element.
 * @returns {object | undefined} Registered source and presentation record.
 */
function chartMark(element) {
  return marks.get(element);
}

/**
 * Attaches structured tooltip content without reconstructing it from text.
 *
 * @param {SVGElement} element - Registered data element.
 * @param {object} content - Heading and ordered tooltip items.
 * @returns {void} Tooltip presentation is associated with the mark.
 */
function markTooltip(element, content) {
  chartMark(element).tooltip = content;
  Object.assign(element.dataset, {
    tooltipHeading: content.heading,
    tooltipItems: JSON.stringify(content.items),
  });
}

/**
 * Associates accessible text with a mark without parsing its punctuation.
 *
 * @param {SVGElement} element - Element that may represent chart data.
 * @param {string} text - Complete accessible description.
 * @returns {void} Registered marks receive text and a heading-only default tooltip.
 */
function markDescription(element, text) {
  const record = chartMark(element);

  if (record) {
    record.label = text;
    record.tooltip ??= { heading: text, items: [] };
  }
}

export { markDescription, chartMark, markMetadata, markTooltip };
