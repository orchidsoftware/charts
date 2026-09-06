import SvgSurface from "./SvgSurface.js";

/**
 * Renders one validated snapshot through its chart-family strategy.
 *
 * @param {object} snapshot - Validated chart state and owned SVG surface.
 * @param {(rendering: object) => void} render - Family renderer selected by the public definition.
 * @returns {void} Chart content and any shared series legend are appended.
 * @throws {TypeError} When no renderer class is registered for the type.
 */
function renderChart(snapshot, render) {
  if (typeof render !== "function") {
    throw new TypeError("Chart render implementation must be a function");
  }

  const { element, data, options, id } = snapshot;
  const chart = Object.freeze({ ...data, options, id });
  const surface = new SvgSurface(element);

  const dimensions = render({ chart, surface }) ?? { width: options.width, height: options.height };
  surface.size(dimensions);

  return Object.freeze(dimensions);
}

export { renderChart };
