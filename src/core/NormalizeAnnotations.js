import { validateObjectKeys, validateText } from "../support/data/InputValidation.js";
import { isBoolean, isChoice, isNumberAtLeast, isOpacity, isRecord } from "../support/Validation.js";

const MARKER_KEYS = [
  "label",
  "value",
  "color",
  "width",
  "opacity",
  "lineStyle",
  "dash",
  "labelPosition",
  "labelColor",
  "includeInDomain",
  "formatLabel",
];

const REGION_KEYS = [
  "label",
  "range",
  "color",
  "opacity",
  "labelPosition",
  "labelColor",
  "includeInDomain",
  "formatLabel",
];

const DASHED_LENGTH = 4;
const DASHED_GAP = 3;
const DOTTED_LENGTH = 1;
const DEFAULT_REGION_OPACITY = 0.08;
const SECONDARY_LABEL_COLOR = "var(--charts-secondary-label-color, #6e6e73)";

const DASH_PATTERNS = Object.freeze({
  solid: [],
  dashed: [
    DASHED_LENGTH,
    DASHED_GAP,
  ],
  dotted: [
    DOTTED_LENGTH,
    DASHED_GAP,
  ],
});

/**
 * Applies marker defaults without mutating public input.
 *
 * @param {object} marker - Validated marker input.
 * @returns {object} Complete marker renderer record.
 */
function normalizedMarker(marker) {
  return Object.freeze({
    ...marker,
    color: marker.color ?? SECONDARY_LABEL_COLOR,
    width: marker.width ?? 1,
    opacity: marker.opacity ?? 1,
    dash: marker.dash ?? DASH_PATTERNS[marker.lineStyle ?? "dashed"],
    labelPosition: marker.labelPosition ?? "end",
    labelColor: marker.labelColor ?? SECONDARY_LABEL_COLOR,
    includeInDomain: marker.includeInDomain ?? true,
  });
}

/**
 * Applies ascending range and region defaults without mutating public input.
 *
 * @param {object} region - Validated region input.
 * @returns {object} Complete region renderer record.
 */
function normalizedRegion(region) {
  return Object.freeze({
    ...region,
    range: [
      Math.min(...region.range),
      Math.max(...region.range),
    ],
    color: region.color ?? "var(--charts-focus-ring, #007aff)",
    opacity: region.opacity ?? DEFAULT_REGION_OPACITY,
    labelPosition: region.labelPosition ?? "end",
    labelColor: region.labelColor ?? SECONDARY_LABEL_COLOR,
    includeInDomain: region.includeInDomain ?? true,
  });
}

/**
 * Normalizes one marker with explicit renderer-independent defaults.
 *
 * @param {object} marker - Copied public marker input.
 * @returns {object} Complete marker record.
 */
function normalizeMarker(marker) {
  if (!isRecord(marker)) {
    throw new TypeError("marker must be an object or positional marker arguments");
  }

  validateObjectKeys(marker, MARKER_KEYS, "marker");
  validateText(marker.label, "marker label");
  if (!Number.isFinite(marker.value)) {
    throw new TypeError("marker value must be finite");
  }

  validateAnnotationPresentation(marker, "marker");
  if (marker.width !== undefined && !isNumberAtLeast(marker.width, 0)) {
    throw new TypeError("marker width must be a non-negative finite number");
  }

  if (marker.lineStyle !== undefined && !Object.hasOwn(DASH_PATTERNS, marker.lineStyle)) {
    throw new TypeError("marker lineStyle must be solid, dashed, or dotted");
  }

  if (marker.dash !== undefined && !isValidDash(marker.dash)) {
    throw new TypeError(
      "marker dash must contain non-negative finite values with at least one positive value",
    );
  }

  return normalizedMarker(marker);
}

/**
 * Checks one explicit marker dash pattern.
 *
 * @param {unknown} dash - Candidate dash collection.
 * @returns {boolean} Whether the pattern is finite, non-negative, and visible.
 */
function isValidDash(dash) {
  if (!Array.isArray(dash) || dash.length === 0) {
    return false;
  }

  return dash.every((value) => isNumberAtLeast(value, 0)) && dash.some((value) => value > 0);
}

/**
 * Normalizes one ascending region with explicit presentation defaults.
 *
 * @param {object} region - Copied public region input.
 * @returns {object} Complete region record.
 */
function normalizeRegion(region) {
  if (!isRecord(region)) {
    throw new TypeError("region must be an object or positional region arguments");
  }

  validateObjectKeys(region, REGION_KEYS, "region");
  validateText(region.label, "region label");
  if (
    !Array.isArray(region.range) ||
    region.range.length !== 2 ||
    region.range.some((value) => !Number.isFinite(value))
  ) {
    throw new TypeError("region range must contain exactly two finite numbers");
  }

  validateAnnotationPresentation(region, "region");

  return normalizedRegion(region);
}

/**
 * Validates presentation fields shared by markers and regions.
 *
 * @param {object} annotation - Exhaustive annotation input.
 * @param {string} concept - Marker or region name used by failures.
 * @returns {void} Supported values pass unchanged.
 */
function validateAnnotationPresentation(annotation, concept) {
  const hasOpacity = annotation.opacity !== undefined;

  const isValidOpacity = isOpacity(annotation.opacity);

  if (hasOpacity && !isValidOpacity) {
    throw new TypeError(`${concept} opacity must be from 0 through 1`);
  }

  if (
    annotation.labelPosition !== undefined &&
    !isChoice(annotation.labelPosition, [
      "start",
      "center",
      "end",
    ])
  ) {
    throw new TypeError(`${concept} labelPosition must be start, center, or end`);
  }

  if (annotation.includeInDomain !== undefined && !isBoolean(annotation.includeInDomain)) {
    throw new TypeError(`${concept} includeInDomain must be a boolean`);
  }

  if (annotation.formatLabel !== undefined && typeof annotation.formatLabel !== "function") {
    throw new TypeError(`${concept} formatLabel must be a function`);
  }
}

/**
 * Normalizes every optional Cartesian annotation collection.
 *
 * @param {object} data - Public Cartesian data.
 * @returns {object} Data snapshot containing complete annotations.
 */
function normalizeCartesianSource(data) {
  const markers = data.markers ?? [];
  const regions = data.regions ?? [];

  return {
    ...data,
    yMarkers: markers.map((marker) => normalizeMarker(marker)),
    yRegions: regions.map((region) => normalizeRegion(region)),
  };
}

export { normalizeCartesianSource };
