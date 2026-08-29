import { validateObjectKeys } from "../support/Normalize.js";

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

const DASH_PATTERNS = Object.freeze({
  solid: [],
  dashed: [DASHED_LENGTH, DASHED_GAP],
  dotted: [DOTTED_LENGTH, DASHED_GAP],
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
    color: marker.color ?? "var(--charts-secondary-label-color, #6e6e73)",
    width: marker.width ?? 1,
    opacity: marker.opacity ?? 1,
    dash: marker.dash ?? DASH_PATTERNS[marker.lineStyle ?? "dashed"],
    labelPosition: marker.labelPosition ?? "end",
    labelColor: marker.labelColor ?? "var(--charts-label-color, #3a3a3c)",
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
    range: [Math.min(...region.range), Math.max(...region.range)],
    color: region.color ?? "var(--charts-focus-ring, #007aff)",
    opacity: region.opacity ?? DEFAULT_REGION_OPACITY,
    labelPosition: region.labelPosition ?? "end",
    labelColor: region.labelColor ?? "var(--charts-label-color, #3a3a3c)",
    includeInDomain: region.includeInDomain ?? true,
  });
}

/**
 * Requires a non-empty annotation label.
 *
 * @param {unknown} value - Candidate label.
 * @param {string} concept - Marker or region.
 * @returns {void} Valid labels pass unchanged.
 */
function validateLabel(value, concept) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${concept} label must be a non-empty string`);
  }
}

/**
 * Normalizes one marker with explicit renderer-independent defaults.
 *
 * @param {object} marker - Copied public marker input.
 * @returns {object} Complete marker record.
 */
function normalizeMarker(marker) {
  if (!marker || typeof marker !== "object" || Array.isArray(marker)) {
    throw new TypeError("marker must be an object or positional marker arguments");
  }

  validateObjectKeys(marker, MARKER_KEYS, "marker");
  validateLabel(marker.label, "marker");
  if (!Number.isFinite(marker.value)) {
    throw new TypeError("marker value must be finite");
  }

  validateAnnotationPresentation(marker, "marker");
  if (marker.width !== undefined && (!Number.isFinite(marker.width) || marker.width < 0)) {
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

  return dash.every((value) => Number.isFinite(value) && value >= 0) && dash.some((value) => value > 0);
}

/**
 * Normalizes one ascending region with explicit presentation defaults.
 *
 * @param {object} region - Copied public region input.
 * @returns {object} Complete region record.
 */
function normalizeRegion(region) {
  if (!region || typeof region !== "object" || Array.isArray(region)) {
    throw new TypeError("region must be an object or positional region arguments");
  }

  validateObjectKeys(region, REGION_KEYS, "region");
  validateLabel(region.label, "region");
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

  const isValidOpacity =
    Number.isFinite(annotation.opacity) && annotation.opacity >= 0 && annotation.opacity <= 1;

  if (hasOpacity && !isValidOpacity) {
    throw new TypeError(`${concept} opacity must be from 0 through 1`);
  }

  if (
    annotation.labelPosition !== undefined &&
    !["start", "center", "end"].includes(annotation.labelPosition)
  ) {
    throw new TypeError(`${concept} labelPosition must be start, center, or end`);
  }

  if (annotation.includeInDomain !== undefined && typeof annotation.includeInDomain !== "boolean") {
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
