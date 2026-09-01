import { validateBuilderOption, validateLabels, validateText } from "./BuilderValidation.js";

const FULL_CIRCLE_DEGREES = 360;

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
 * Registers a fresh builder without resolving its parent or touching the DOM.
 *
 * @param {object} builder - Builder instance receiving private module state.
 * @param {object} definition - Immutable creation details owned by the chart definition.
 * @param {string | Element} definition.parent - Deferred chart host reference.
 * @param {string} definition.type - Internal renderer type compiled by this builder.
 * @param {(parent: string | Element, options: object) => object} definition.mount - Mounted chart factory.
 * @returns {void} A mutable single-use authoring snapshot is associated with the builder.
 */
function initializeBuilder(builder, { parent, type, mount }) {
  states.set(builder, {
    parent,
    type,
    mount,
    consumed: false,
    options: {},
    explicit: new Set(),
    data: { datasets: [] },
  });
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

  if (!state || state.consumed) {
    throw new TypeError("Chart builder has already been rendered");
  }

  return state;
}

/**
 * Replaces one chart-level option with a defensive copy.
 *
 * @param {object} builder - Builder receiving the option.
 * @param {string} name - Internal option name.
 * @param {unknown} value - Caller-controlled option value.
 * @returns {object} The same builder for fluent forwarding.
 */
function writeBuilderOption(builder, name, value) {
  validateBuilderOption(name, value);
  const state = builderState(builder);
  state.options[name] = copyBuilderValue(value);

  return builder;
}

/**
 * Records an explicitly chosen presentation setting for preset precedence.
 *
 * @param {object} builder - Builder receiving the setting.
 * @param {string} name - Public setting name.
 * @param {unknown} value - Explicit caller choice.
 * @returns {object} The same builder for fluent forwarding.
 */
function writeExplicitOption(builder, name, value) {
  validateBuilderOption(name, value);
  const state = builderState(builder);
  state.explicit.add(name);
  state.options[name] = copyBuilderValue(value);

  return builder;
}

/**
 * Replaces labels at call time rather than retaining the caller's array.
 *
 * @param {object} builder - Series builder receiving category labels.
 * @param {readonly string[]} labels - Caller-controlled labels.
 * @returns {object} The same builder for fluent forwarding.
 */
function writeBuilderLabels(builder, labels) {
  validateLabels(labels);
  builderState(builder).data.labels = copyBuilderValue(labels);

  return builder;
}

/**
 * Replaces one top-level domain-data field with a defensive copy.
 *
 * @param {object} builder - Builder receiving the data field.
 * @param {string} name - Public domain-data property.
 * @param {unknown} value - Caller-controlled data value.
 * @returns {object} The same builder for fluent forwarding.
 */
function writeBuilderData(builder, name, value) {
  if (name === "points") {
    validateHeatmapPoints(value);
  }

  builderState(builder).data[name] = copyBuilderValue(value);

  return builder;
}

/**
 * Appends one item to an ordered domain-data collection.
 *
 * @param {object} builder - Builder receiving the item.
 * @param {string} collection - Ordered data collection name.
 * @param {unknown} value - Caller-controlled item.
 * @returns {object} The same builder for fluent forwarding.
 */
function appendBuilderData(builder, collection, value) {
  validateTask(value);

  const state = builderState(builder);
  state.data[collection] ??= [];
  state.data[collection].push(copyBuilderValue(value));

  return builder;
}

/**
 * Appends one copied dataset in fluent call order.
 *
 * @param {object} builder - Series builder receiving the dataset.
 * @param {object} dataset - Completed dataset record.
 * @returns {object} The same builder for fluent forwarding.
 */
function appendBuilderDataset(builder, dataset) {
  const state = builderState(builder);

  if (
    [
      "pie",
      "donut",
      "percentage",
      "polar-area",
    ].includes(state.type) &&
    state.data.datasets.length > 0
  ) {
    throw new TypeError(`${state.type} accepts exactly one dataset`);
  }

  // `dataset` is already detached from caller-owned input by BuilderArguments.
  // Keep that owned record instead of recursively cloning large value arrays a
  // second time on every fluent dataset call.
  state.data.datasets.push(dataset);

  return builder;
}

/**
 * Validates keyed heatmap input before it enters builder state.
 *
 * @param {unknown} value - Candidate point record.
 * @returns {void} Non-empty finite records pass unchanged.
 */
function validateHeatmapPoints(value) {
  if (!value || typeof value !== "object") {
    throw new TypeError("points must contain at least one entry");
  }

  if (Array.isArray(value) || Object.keys(value).length === 0) {
    throw new TypeError("points must contain at least one entry");
  }

  if (Object.values(value).some((point) => !Number.isFinite(point))) {
    throw new TypeError("heatmap point values must be finite numbers");
  }
}

/**
 * Validates the independently decidable task object grammar.
 *
 * @param {unknown} value - Candidate task record.
 * @returns {void} Structurally valid task inputs pass unchanged.
 */
function validateTask(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("task must be an object or positional task arguments");
  }

  const unknown = Object.keys(value).find(
    (key) =>
      ![
        "label",
        "start",
        "end",
        "group",
        "color",
      ].includes(key),
  );

  if (unknown) {
    throw new TypeError(`Unsupported task key: ${unknown}`);
  }

  validateText(value.label, "task label");
  if (value.group !== undefined) {
    validateText(value.group, "task group");
  }
}

/**
 * Appends one annotation in fluent call order.
 *
 * @param {object} builder - Cartesian builder receiving the annotation.
 * @param {"markers" | "regions"} collection - Public annotation collection.
 * @param {object} annotation - Completed marker or region record.
 * @returns {object} The same builder for fluent forwarding.
 */
function appendBuilderAnnotation(builder, collection, annotation) {
  const data = builderState(builder).data;
  data[collection] ??= [];
  data[collection].push(copyBuilderValue(annotation));

  return builder;
}

/**
 * Resolves frameless and individual visibility settings without call-order coupling.
 *
 * @param {object} state - Live builder state.
 * @param {object} sourceOptions - Copied options being compiled.
 * @returns {object} Options with resolved product presentation fields.
 */
function applyPresentation(state, sourceOptions) {
  const options = { ...sourceOptions };
  const isFrameless = options.frameless === true;

  for (const setting of [
    "axes",
    "grid",
    "valueLabels",
    "legend",
    "tooltip",
  ]) {
    if (!state.explicit.has(setting) && isFrameless) {
      options[setting] = false;
    }
  }

  if (!state.explicit.has("dots") && isFrameless) {
    options.dots = false;
  }

  delete options.frameless;

  return options;
}

/**
 * Removes initialization fields that are not part of a family's public scene.
 *
 * @param {object} data - Copied builder data.
 * @param {string} type - Internal chart type.
 * @returns {object} Family-appropriate domain data.
 */
function familyData(data, type) {
  if (
    [
      "line",
      "bar",
      "scatter",
      "mixed",
      "bubble",
    ].includes(type)
  ) {
    return data;
  }

  const family = { ...data };

  Reflect.deleteProperty(family, "markers");
  Reflect.deleteProperty(family, "regions");

  if (
    [
      "heatmap",
      "timesheet",
    ].includes(type)
  ) {
    Reflect.deleteProperty(family, "datasets");
  }

  return family;
}

/**
 * Produces a detached canonical scene for the runtime boundary.
 *
 * @param {object} builder - Builder to snapshot without consuming it.
 * @returns {{parent: string | Element, options: object, mount: (parent: string | Element, options: object) => object}} Deferred mount command and scene.
 */
function compileBuilder(builder) {
  const state = builderState(builder);
  // Every value was copied when it crossed the public builder boundary. The
  // builder is single-use and none of the compilation steps mutate its stored
  // records, so another recursive snapshot here only multiplies large-series
  // memory and CPU cost without adding isolation.
  let options = { ...state.options };
  let data = state.data;

  data = familyData(data, state.type);
  options = applyPresentation(state, options);
  if (options.startAngle !== undefined) {
    options.startAngle =
      ((options.startAngle % FULL_CIRCLE_DEGREES) + FULL_CIRCLE_DEGREES) % FULL_CIRCLE_DEGREES;
  }

  options.type = state.type;
  options.data = data;

  return {
    parent: state.parent,
    options,
    mount: state.mount,
  };
}

/**
 * Consumes a builder only after its mounted chart has committed successfully.
 *
 * @param {object} builder - Builder that completed rendering.
 * @returns {void} Every later fluent call will fail.
 */
function consumeBuilder(builder) {
  builderState(builder).consumed = true;
}

export {
  appendBuilderAnnotation,
  appendBuilderDataset,
  builderState,
  compileBuilder,
  consumeBuilder,
  copyBuilderValue,
  initializeBuilder,
  writeBuilderLabels,
  writeBuilderData,
  writeBuilderOption,
  writeExplicitOption,
  appendBuilderData,
};
