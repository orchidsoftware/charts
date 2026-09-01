import { MAJOR_GRID_DIVISIONS } from "../Constants.js";

const DECIMAL_BASE = 10;
const FIVE_STEP = 5;
const FIVE_STEP_THRESHOLD = 10;
const TEN_STEP = 10;
const TEN_STEP_THRESHOLD = 50;
const TICK_PRECISION = 12;

/**
 * Finds a numeric extent and expands a degenerate single-value domain.
 *
 * @param {number[]} values - Non-empty numeric sample used to derive the domain.
 * @returns {[number, number]} Ascending minimum and maximum suitable for scaling.
 */
function extent(values) {
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);

  return minimum === maximum
    ? [
        minimum - 1,
        maximum + 1,
      ]
    : [
        minimum,
        maximum,
      ];
}

/**
 * Selects the multiplier in a human-readable 1, 2, 5, 10 progression.
 *
 * @param {number} error - Rough step normalized by its decimal power.
 * @returns {number} Progression multiplier.
 */
function niceFactor(error) {
  if (error >= Math.sqrt(TEN_STEP_THRESHOLD)) {
    return TEN_STEP;
  }

  if (error >= Math.sqrt(FIVE_STEP_THRESHOLD)) {
    return FIVE_STEP;
  }

  if (error >= Math.sqrt(2)) {
    return 2;
  }

  return 1;
}

/**
 * Chooses a human-readable grid step near the requested division count.
 *
 * @param {number} span - Positive numeric distance covered by the axis.
 * @param {boolean} integerValues - Whether every source value is an integer.
 * @returns {number} Positive step rounded to a 1, 2, 5, or 10 progression.
 */
function niceStep(span, integerValues) {
  const roughStep = span / MAJOR_GRID_DIVISIONS;
  const power = DECIMAL_BASE ** Math.floor(Math.log10(roughStep));
  const step = niceFactor(roughStep / power) * power;

  return integerValues ? Math.max(1, step) : step;
}

/**
 * Expands values onto rounded bounds and enumerates their major ticks.
 *
 * @param {number[]} values - Non-empty finite values displayed on an axis.
 * @returns {{domain: [number, number], ticks: number[]}} Rounded domain and inclusive tick sequence.
 */
function niceValueScale(values) {
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);

  if (minimum === maximum) {
    return {
      domain: [
        minimum - 1,
        maximum + 1,
      ],
      ticks: [
        minimum - 1,
        minimum,
        maximum + 1,
      ],
    };
  }

  const integerValues = values.every((value) => Number.isSafeInteger(value));
  const step = niceStep(maximum - minimum, integerValues);
  const niceMinimum = Math.floor(minimum / step) * step;
  const niceMaximum = Math.ceil(maximum / step) * step;
  const intervals = Math.round((niceMaximum - niceMinimum) / step);

  const ticks = Array.from({ length: intervals + 1 }, (_, index) =>
    Number((niceMinimum + index * step).toPrecision(TICK_PRECISION)),
  );

  return {
    domain: [
      niceMinimum,
      niceMaximum,
    ],
    ticks,
  };
}

/**
 * Maps a value linearly between a numeric domain and output range.
 *
 * @param {number} value - Input value to project.
 * @param {[number, number]} domain - Input endpoints defining the interpolation ratio.
 * @param {[number, number]} range - Output endpoints receiving the projected value.
 * @returns {number} Linearly projected output value.
 */
function scale(value, domain, range) {
  return range[0] + ((value - domain[0]) / (domain[1] - domain[0])) * (range[1] - range[0]);
}

export { extent, niceStep, niceValueScale, scale };
