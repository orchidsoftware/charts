import { copyInput } from "../../support/data/Copy.js";

import { runScope } from "./BuilderScopes.js";
import { validateBuilderOption, validateLabels } from "./BuilderValidation.js";

const FULL_CIRCLE_DEGREES = 360;

const COMPOSITION_TYPES = new Set([
  "pie",
  "donut",
  "percentage",
  "polar-area",
]);

const CARTESIAN_TYPES = new Set([
  "line",
  "bar",
  "scatter",
  "mixed",
  "bubble",
]);

const TEMPORAL_TYPES = new Set([
  "heatmap",
  "timesheet",
]);

const states = new WeakMap();

/**
 * Applies presentation defaults without overriding explicit choices.
 *
 * @param {Set<string>} explicit - Options selected explicitly by the caller.
 * @param {object} source - Detached builder options.
 * @returns {object} Compiled presentation options.
 */
function presentationOptions(explicit, source) {
  const options = { ...source };

  if (options.frameless === true) {
    for (const setting of [
      "axes",
      "grid",
      "valueLabels",
      "legend",
      "tooltip",
      "dots",
    ]) {
      if (!explicit.has(setting)) {
        options[setting] = false;
      }
    }
  }

  delete options.frameless;

  return options;
}

/**
 * Removes authoring collections unsupported by the selected chart family.
 *
 * @param {object} source - Detached builder data.
 * @param {string} type - Requested chart type.
 * @returns {object} Data accepted by the selected renderer.
 */
function familyData(source, type) {
  if (CARTESIAN_TYPES.has(type)) {
    return source;
  }

  const data = { ...source };
  delete data.markers;
  delete data.regions;

  if (TEMPORAL_TYPES.has(type)) {
    delete data.datasets;
  }

  return data;
}

/**
 * Owns mutable fluent-authoring state and its single-use lifecycle.
 */
class BuilderState {
  #parent;
  #type;
  #mount;
  #consumed = false;
  #options = {};
  #explicit = new Set();
  #data = { datasets: [] };

  /**
   * Creates private state for one public builder.
   *
   * @param {object} definition - Builder rendering definition.
   * @param {object} definition.parent - Chart factory receiving compiled options.
   * @param {string} definition.type - Requested chart type.
   * @param {Element|string} definition.mount - Chart mount target.
   */
  constructor({ parent, type, mount }) {
    this.#parent = parent;
    this.#type = type;
    this.#mount = mount;
  }

  /**
   * Rejects access after successful rendering.
   *
   * @returns {void} Active builders continue unchanged.
   * @throws {TypeError} When this builder was consumed.
   */
  assertActive() {
    if (this.#consumed) {
      throw new TypeError("Chart builder has already been rendered");
    }
  }

  /**
   * Validates and records one chart option.
   *
   * @param {string} name - Internal option name.
   * @param {unknown} value - Caller-controlled option value.
   * @returns {void} The authoring state is updated.
   */
  option(name, value) {
    this.assertActive();
    validateBuilderOption(name, value);
    this.#options[name] = copyInput(value);
  }

  /**
   * Records an option that must win over presentation defaults.
   *
   * @param {string} name - Internal option name.
   * @param {unknown} value - Caller-controlled option value.
   * @returns {void} The authoring state is updated.
   */
  explicitOption(name, value) {
    this.option(name, value);
    this.#explicit.add(name);
  }

  /**
   * Validates and records category labels.
   *
   * @param {unknown} values - Candidate label collection.
   * @returns {void} The authoring state is updated.
   */
  labels(values) {
    this.assertActive();
    validateLabels(values);
    this.#data.labels = copyInput(values);
  }

  /**
   * Records one chart-family data value.
   *
   * @param {string} name - Data property name.
   * @param {unknown} value - Caller-controlled data value.
   * @returns {void} The authoring state is updated.
   */
  data(name, value) {
    this.assertActive();
    this.#data[name] = copyInput(value);
  }

  /**
   * Appends one value to an authoring collection.
   *
   * @param {string} collection - Data collection name.
   * @param {unknown} value - Caller-controlled collection item.
   * @returns {void} The authoring state is updated.
   */
  append(collection, value) {
    this.assertActive();
    this.#data[collection] ??= [];
    this.#data[collection].push(copyInput(value));
  }

  /**
   * Adds a configured dataset under family cardinality rules.
   *
   * @param {object} dataset - Detached dataset record.
   * @returns {void} The authoring state is updated.
   * @throws {TypeError} When a composition chart already has a dataset.
   */
  dataset(dataset) {
    this.assertActive();
    if (COMPOSITION_TYPES.has(this.#type) && this.#data.datasets.length > 0) {
      throw new TypeError(`${this.#type} accepts exactly one dataset`);
    }

    this.#data.datasets.push(dataset);
  }

  /**
   * Compiles current authoring state into one renderer request.
   *
   * @returns {object} Parent factory, mount target, and normalized options.
   */
  compile() {
    this.assertActive();
    const options = presentationOptions(this.#explicit, this.#options);

    if (options.startAngle !== undefined) {
      options.startAngle =
        ((options.startAngle % FULL_CIRCLE_DEGREES) + FULL_CIRCLE_DEGREES) % FULL_CIRCLE_DEGREES;
    }

    options.type = this.#type;
    options.data = familyData(this.#data, this.#type);

    return {
      parent: this.#parent,
      options,
      mount: this.#mount,
    };
  }

  /**
   * Marks this builder as successfully rendered.
   *
   * @returns {void} Later fluent calls fail permanently.
   */
  consume() {
    this.assertActive();
    this.#consumed = true;
  }
}

/**
 * Attaches fresh private state to a public builder.
 *
 * @param {object} builder - Public fluent builder.
 * @param {object} definition - Builder rendering definition.
 * @returns {void} The builder becomes active.
 */
function initializeBuilder(builder, definition) {
  states.set(builder, new BuilderState(definition));
}

/**
 * Reads live builder state and rejects every operation after successful rendering.
 *
 * @param {object} builder - Builder whose authoring state is required.
 * @returns {object} Mutable module-private builder state.
 * @throws {TypeError} When the builder has already produced a mounted chart.
 */
function builderState(builder) {
  const state = states.get(builder);

  if (!state) {
    throw new TypeError("Chart builder has already been rendered");
  }

  state.assertActive();

  return state;
}

/**
 * Writes a chart option and returns the public builder without retaining it in state.
 *
 * @param {object} builder - Active fluent builder.
 * @param {string} name - Chart option name.
 * @param {unknown} value - Requested option value.
 * @returns {object} The same public builder for chaining.
 */
function builderOption(builder, name, value) {
  builderState(builder).option(name, value);

  return builder;
}

export { builderOption, builderState, initializeBuilder };

/**
 * Applies a callback scope whose fields already use chart option names.
 *
 * @param {object} builder - Active chart builder.
 * @param {new (record: object) => object} Scope - Restricted callback builder.
 * @param {(scope: object) => void} configure - Synchronous author callback.
 * @returns {object} Original chart builder.
 */
function builderScope(builder, Scope, configure) {
  const state = builderState(builder);
  const options = {};
  runScope(new Scope(options), configure);
  for (const [
    name,
    value,
  ] of Object.entries(options)) {
    state.option(name, value);
  }

  return builder;
}

/**
 * Applies the shared visibility-or-callback tooltip grammar.
 *
 * @param {object} builder - Active chart builder.
 * @param {unknown} value - Visibility or formatter callback.
 * @param {new (record: object) => object} Scope - Family tooltip scope.
 * @returns {object} Original chart builder.
 */
function builderTooltip(builder, value, Scope) {
  if (typeof value === "function") {
    builderScope(builder, Scope, value);
  }

  builderState(builder).explicitOption("tooltip", typeof value === "function" ? true : value);

  return builder;
}

export { builderScope, builderTooltip };
