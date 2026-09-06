import { copyInput } from "../../support/data/Copy.js";

import { LineDatasetBuilder, MarkerBuilder, RegionBuilder, runScope } from "./BuilderScopes.js";

/**
 * Resolves positional and object dataset grammar into one detached record.
 *
 * @param {unknown} first - Values, name, or advanced dataset input.
 * @param {unknown} second - Values, color, or configurator.
 * @param {unknown} third - Color or configurator for a named dataset.
 * @returns {object} Detached dataset and optional configurator.
 */
function datasetArguments(first, second, third) {
  const isNamed = typeof first === "string";
  const values = isNamed ? second : first;
  const candidate = isNamed ? third : second;
  const isPositional = isNamed || Array.isArray(first);
  const dataset = isPositional ? { values: copyInput(values) } : copyInput(first);

  if (isNamed) {
    dataset.name = first;
  }

  if (isPositional && typeof candidate === "string") {
    dataset.color = candidate;
  }

  return {
    dataset,
    configure: typeof candidate === "function" ? candidate : undefined,
  };
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
  return configuredDataset(
    [
      first,
      second,
      third,
    ],
    LineDatasetBuilder,
  );
}

/**
 * Resolves marker and region grammar before entering their capability scope.
 *
 * @param {unknown[]} inputs - Public positional or object arguments.
 * @param {string} property - Annotation payload field.
 * @param {new (record: object) => object} Scope - Annotation capability scope.
 * @returns {object} Detached configured annotation.
 */
function annotationInput(
  [
    first,
    second,
    third,
  ],
  property,
  Scope,
) {
  const isPositional = typeof first === "string";
  const record = isPositional ? { label: first, [property]: copyInput(second) } : copyInput(first);
  const candidate = isPositional ? third : second;

  if (isPositional && typeof third === "string") {
    record.color = third;
  }

  if (typeof candidate === "function") {
    runScope(new Scope(record), candidate);
  }

  return record;
}

/**
 * Resolves one marker's public arguments.
 *
 * @param {...unknown} inputs - Public marker arguments.
 * @returns {object} Detached configured marker.
 */
function markerInput(...inputs) {
  return annotationInput(inputs, "value", MarkerBuilder);
}

/**
 * Resolves one region's public arguments.
 *
 * @param {...unknown} inputs - Public region arguments.
 * @returns {object} Detached configured region.
 */
function regionInput(...inputs) {
  return annotationInput(inputs, "range", RegionBuilder);
}

export { configuredDataset, lineDataset, markerInput, regionInput };
