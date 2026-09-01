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
 * Copies caller-owned authoring data while retaining formatter callbacks by reference.
 *
 * @param {unknown} value - Value crossing the fluent authoring boundary.
 * @returns {unknown} Independent arrays, records, and dates suitable for builder state.
 */
function copyBuilderValue(value) {
  if (value instanceof Date) {
    return new Date(value.valueOf());
  }

  if (Array.isArray(value)) {
    return value.map((item) => copyBuilderValue(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(
        ([
          key,
          item,
        ]) => [
          key,
          copyBuilderValue(item),
        ],
      ),
    );
  }

  return value;
}

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
  Reflect.deleteProperty(data, "markers");
  Reflect.deleteProperty(data, "regions");

  if (TEMPORAL_TYPES.has(type)) {
    Reflect.deleteProperty(data, "datasets");
  }

  return data;
}

/**
 * Owns mutable fluent-authoring state and its single-use lifecycle.
 */
class BuilderState {
  #owner;
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
   * @param {object} owner - Public fluent builder returned by writes.
   * @param {object} definition - Builder rendering definition.
   * @param {object} definition.parent - Chart factory receiving compiled options.
   * @param {string} definition.type - Requested chart type.
   * @param {Element|string} definition.mount - Chart mount target.
   */
  constructor(owner, { parent, type, mount }) {
    this.#owner = owner;
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
   * @returns {object} Public fluent builder.
   */
  option(name, value) {
    this.assertActive();
    validateBuilderOption(name, value);
    this.#options[name] = copyBuilderValue(value);

    return this.#owner;
  }

  /**
   * Records an option that must win over presentation defaults.
   *
   * @param {string} name - Internal option name.
   * @param {unknown} value - Caller-controlled option value.
   * @returns {object} Public fluent builder.
   */
  explicitOption(name, value) {
    this.option(name, value);
    this.#explicit.add(name);

    return this.#owner;
  }

  /**
   * Validates and records category labels.
   *
   * @param {unknown} values - Candidate label collection.
   * @returns {object} Public fluent builder.
   */
  labels(values) {
    this.assertActive();
    validateLabels(values);
    this.#data.labels = copyBuilderValue(values);

    return this.#owner;
  }

  /**
   * Records one chart-family data value.
   *
   * @param {string} name - Data property name.
   * @param {unknown} value - Caller-controlled data value.
   * @returns {object} Public fluent builder.
   */
  data(name, value) {
    this.assertActive();
    this.#data[name] = copyBuilderValue(value);

    return this.#owner;
  }

  /**
   * Appends one value to an authoring collection.
   *
   * @param {string} collection - Data collection name.
   * @param {unknown} value - Caller-controlled collection item.
   * @returns {object} Public fluent builder.
   */
  append(collection, value) {
    this.assertActive();
    this.#data[collection] ??= [];
    this.#data[collection].push(copyBuilderValue(value));

    return this.#owner;
  }

  /**
   * Adds a configured dataset under family cardinality rules.
   *
   * @param {object} dataset - Detached dataset record.
   * @returns {object} Public fluent builder.
   * @throws {TypeError} When a composition chart already has a dataset.
   */
  dataset(dataset) {
    this.assertActive();
    if (COMPOSITION_TYPES.has(this.#type) && this.#data.datasets.length > 0) {
      throw new TypeError(`${this.#type} accepts exactly one dataset`);
    }

    this.#data.datasets.push(dataset);

    return this.#owner;
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
  states.set(builder, new BuilderState(builder, definition));
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

export { builderState, copyBuilderValue, initializeBuilder };
