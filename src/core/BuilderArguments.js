import { MarkerBuilder, RegionBuilder, runAnnotationScope } from "./BuilderAnnotations.js";
import { LineDatasetBuilder, runScope } from "./BuilderScopes.js";
import { copyBuilderValue } from "./BuilderState.js";

/**
 * Resolves one named positional dataset call.
 *
 * @param {string} name - Human-readable legend label.
 * @param {unknown} values - Ordered numeric payload copied into the series.
 * @param {unknown} colorOrConfigure - Optional color or scoped configurator.
 * @returns {{dataset: object, configure?: (scope: LineDatasetBuilder) => void}} Detached named dataset arguments.
 */
function namedDatasetArguments(name, values, colorOrConfigure) {
  const dataset = { name, values: copyBuilderValue(values) };

  if (typeof colorOrConfigure === "string") {
    dataset.color = colorOrConfigure;
  }

  const configure = typeof colorOrConfigure === "function" ? colorOrConfigure : undefined;

  return { dataset, configure };
}

/**
 * Resolves one unnamed shorthand dataset call.
 *
 * @param {unknown[]} values - Ordered numeric values for one series.
 * @param {unknown} colorOrConfigure - Optional color or scoped configurator.
 * @returns {{dataset: object, configure?: (scope: LineDatasetBuilder) => void}} Detached unnamed dataset arguments.
 */
function unnamedDatasetArguments(values, colorOrConfigure) {
  const dataset = { values: copyBuilderValue(values) };

  if (typeof colorOrConfigure === "string") {
    dataset.color = colorOrConfigure;
  }

  const configure = typeof colorOrConfigure === "function" ? colorOrConfigure : undefined;

  return { dataset, configure };
}

/**
 * Creates a configured dataset record from positional or object grammar.
 *
 * @param {unknown} first - Values, name, or advanced dataset input.
 * @param {unknown} second - Values, color, or configurator.
 * @param {unknown} third - Color or configurator for a named dataset.
 * @returns {object} Completed detached dataset record.
 */
function datasetArguments(first, second, third) {
  let result;

  if (typeof first === "string") {
    result = namedDatasetArguments(first, second, third);
  }

  if (Array.isArray(first)) {
    result = unnamedDatasetArguments(first, second);
  }

  if (!result) {
    result = {
      dataset: copyBuilderValue(first),
      configure: typeof second === "function" ? second : undefined,
    };
  }

  return result;
}

/**
 * Creates a configured dataset record with the requested capability scope.
 *
 * @param {unknown[]} inputs - Public dataset method arguments.
 * @param {new (record: object) => object} Scope - Type-specific callback builder.
 * @returns {object} Completed detached dataset record.
 */
function configuredDataset(inputs, Scope) {
  const result = datasetArguments(...inputs);

  if (result.configure) {
    runScope(new Scope(result.dataset), result.configure);
  }

  return result.dataset;
}

/**
 * Creates a configured line dataset using line-only callback capabilities.
 *
 * @param {unknown} first - Values, name, or advanced dataset input.
 * @param {unknown} second - Values, color, or configurator.
 * @param {unknown} third - Color or configurator for a named dataset.
 * @returns {object} Completed detached line dataset.
 */
function lineDataset(first, second, third) {
  return configuredDataset([first, second, third], LineDatasetBuilder);
}

/**
 * Creates a marker record from positional or object grammar.
 *
 * @param {unknown} first - Label or advanced marker input.
 * @param {unknown} second - Marker value or configurator.
 * @param {unknown} third - Color or configurator for a positional marker.
 * @returns {object} Completed detached marker record.
 */
function markerInput(first, second, third) {
  const isPositional = typeof first === "string";
  const marker = isPositional ? { label: first, value: second } : copyBuilderValue(first);
  const callbackCandidate = isPositional ? third : second;

  if (isPositional && typeof third === "string") {
    marker.color = third;
  }

  if (typeof callbackCandidate === "function") {
    runAnnotationScope(new MarkerBuilder(marker), callbackCandidate);
  }

  return marker;
}

/**
 * Creates a region record from positional or object grammar.
 *
 * @param {unknown} first - Label or advanced region input.
 * @param {unknown} second - Numeric range or configurator.
 * @param {unknown} third - Color or configurator for a positional region.
 * @returns {object} Completed detached region record.
 */
function regionInput(first, second, third) {
  const isPositional = typeof first === "string";
  const region = isPositional ? { label: first, range: copyBuilderValue(second) } : copyBuilderValue(first);
  const callbackCandidate = isPositional ? third : second;

  if (isPositional && typeof third === "string") {
    region.color = third;
  }

  if (typeof callbackCandidate === "function") {
    runAnnotationScope(new RegionBuilder(region), callbackCandidate);
  }

  return region;
}

export { configuredDataset, lineDataset, markerInput, regionInput };
