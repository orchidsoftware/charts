import { CHART_HEATMAP, DEFAULT_COLORS, HEATMAP_COLORS } from "./Constants.js";

/**
 * Resolves the palette once using chart-family defaults.
 *
 * @param {string} type - Chart family.
 * @param {string[] | undefined} colors - Caller palette override.
 * @returns {string[]} Effective ordered colors.
 */
function chartColors(type, colors) {
  return colors ?? (type === CHART_HEATMAP ? HEATMAP_COLORS : DEFAULT_COLORS);
}

/**
 * Maps one heatmap value onto the complete ordered intensity palette.
 *
 * @param {number} value - Normalized heatmap value.
 * @param {[number, number]} domain - Complete data minimum and maximum.
 * @param {number} colorCount - Number of supplied intensity colors.
 * @returns {number} Bounded zero-based palette bucket.
 */
function intensityLevel(
  value,
  [
    minimum,
    maximum,
  ],
  colorCount,
) {
  if (minimum === maximum) {
    return value === 0 ? 0 : colorCount - 1;
  }

  const ratio = (value - minimum) / (maximum - minimum);

  return Math.min(colorCount - 1, Math.floor(ratio * colorCount));
}

/**
 * Resolves one shared heatmap scale for rendering and selection.
 *
 * @param {object[]} points - Normalized heatmap entries.
 * @param {string[]} colors - Effective chart palette.
 * @returns {object} Palette and value-to-color projection.
 */
function heatmapPalette(points, colors) {
  const values = points.map((point) => point.value);

  const domain = [
    Math.min(...values),
    Math.max(...values),
  ];

  return Object.freeze({
    colors,
    colorFor: (value) => colors[intensityLevel(value, domain, colors.length)],
  });
}

export { chartColors, heatmapPalette, intensityLevel };
