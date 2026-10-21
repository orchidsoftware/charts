import { labelElement } from "../support/presentation/TextLayout.js";

import SvgSurface from "./SvgSurface.js";

const MINIMUM_CONTENT_HEIGHT = 8;

/**
 * Renders one validated snapshot through its chart-family strategy.
 *
 * @param {object} snapshot - Validated chart state and owned SVG surface.
 * @param {(rendering: object) => void} render - Family renderer selected by the public definition.
 * @returns {object} Actual SVG dimensions including its measured title.
 * @throws {TypeError} When no renderer class is registered for the type.
 */
function renderChart(snapshot, render) {
  if (typeof render !== "function") {
    throw new TypeError("Chart render implementation must be a function");
  }

  const { element, data, options, id, typography } = snapshot;
  const title = options.title ? chartTitle(options, typography) : null;

  const plotOptions = title
    ? { ...options, height: Math.max(MINIMUM_CONTENT_HEIGHT, options.height - title.height) }
    : options;

  const chart = Object.freeze({ ...data, options: plotOptions, id, typography });
  const surface = new SvgSurface(element);

  const dimensions = render({ chart, surface }) ?? { width: plotOptions.width, height: plotOptions.height };
  surface.size(dimensions);

  if (!title) {
    return Object.freeze(dimensions);
  }

  surface.append(title.element);
  const result = { width: dimensions.width, height: dimensions.height + title.height };
  element.setAttribute("viewBox", `0 ${-title.height} ${result.width} ${result.height}`);
  element.setAttribute("height", String(result.height));

  return Object.freeze(result);
}

/**
 * Measures a separate title band using its rendered CSS.
 *
 * @param {object} options - Requested chart size and visible title.
 * @param {object} typography - Render-scoped SVG font measurements.
 * @returns {object} Positioned title and reserved band height.
 */
function chartTitle(options, typography) {
  const inset = 16;
  const gap = 8;
  const font = typography.forClass("orchid-charts-title");

  const title = labelElement({
    value: options.title,
    attributes: { class: "orchid-charts-title" },
    measurement: { maxWidth: Math.max(0, options.width - inset * 2), widthOf: font.widthOf },
  });

  const bounds = font.boundsOf(title.firstChild.textContent);
  const bandHeight = Math.max(bounds.height, font.lineHeight) + gap * 2;
  title.setAttribute("x", String(inset - bounds.x));
  title.setAttribute("y", String(-gap - bounds.y - bounds.height));

  return {
    element: title,
    height: bandHeight,
  };
}

export { renderChart };
