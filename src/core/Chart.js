import { renderChart } from "../renderers/ChartRendering.js";
import { chartMark } from "../support/ChartMark.js";
import {
  ORIENTATION_HORIZONTAL,
  CHART_AXIS_MIXED,
  CHART_BAR,
  CHART_HEATMAP,
  CHART_TIMESHEET,
} from "../support/Constants.js";
import { measureParentWidth, resolveParent, svg } from "../support/Dom.js";

import ChartTooltip from "./ChartTooltip.js";
import DenseInspectionController from "./DenseInspectionController.js";
import InteractionController from "./InteractionController.js";
import { normalizeChartOptions, validateChartColors } from "./Options.js";

const MARK_SELECTOR = ".orchid-charts-mark";
const SVG_EXTENSION = ".svg";
const chartIdSequence = { latest: 0 };

/**
 * Allocates a process-local identifier for chart-owned DOM nodes.
 *
 * @returns {number} Monotonically increasing module-local identifier.
 */
function nextChartId() {
  chartIdSequence.latest += 1;

  return chartIdSequence.latest;
}

/**
 * Identifies focus even when a single unnamed series cannot preserve selection.
 *
 * @param {object} model - Normalized chart model.
 * @param {object} address - Logical mark address.
 * @returns {string} Stable keyboard identity.
 */
function focusIdentity(model, address) {
  return (
    model.identityFor(address) ??
    JSON.stringify([
      address.datasetIndex,
      model.pointFor(address).label,
    ])
  );
}

const EXPORT_STYLE_PROPERTIES = Object.freeze([
  "color",
  "fill",
  "fill-opacity",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "letter-spacing",
  "opacity",
  "paint-order",
  "shape-rendering",
  "stroke",
  "stroke-dasharray",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-opacity",
  "stroke-width",
  "text-anchor",
  "vector-effect",
]);

/**
 * Public lifecycle façade for one chart. All mutable model, rendering,
 * interaction, tooltip, and browser-resource details are private class state.
 */
export default class Chart {
  #host;
  #type;
  #implementation;
  #id;
  #autoWidth;
  #options;
  #model;
  #dimensions;
  #element;
  #tooltip;
  #interactions = null;
  #selectionIdentity = null;
  #boundResize = null;
  #resizeObserver = null;
  #resizeFrame = null;
  #destroyed = false;

  /**
   * Validates options, mounts owned DOM, and renders the initial chart.
   *
   * @param {string | Element} parent - CSS selector or element that will host generated markup.
   * @param {import("../index.js").ChartOptions} options - Complete chart configuration and initial data.
   * @param {object} implementation - Frozen model and rendering functions for one chart family.
   * @throws {TypeError} When options, dimensions, renderer settings, or data violate the public contract.
   */
  constructor(parent, options, implementation) {
    const model = implementation.createModel(options.type, options.data, {
      colors: options.colors,
      maxSlices: options.maxSlices,
    });

    const host = resolveParent(parent);
    const chartConfig = normalizeChartOptions(host, options);

    this.#host = host;
    this.#type = chartConfig.options.type;
    this.#implementation = implementation;
    this.#id = nextChartId();
    this.#autoWidth = options.width === undefined;
    this.#options = chartConfig.options;
    this.#model = model;
    this.#element = this.#createElement();
    this.#tooltip = new ChartTooltip(this.#host, this.#element, this.#id);
    this.#dimensions = this.#renderInto(this.#element, this.#model);
    this.#commitHostPresentation(this.#element);
    this.#bindInteractions();

    if (this.#autoWidth) {
      this.#boundResize = this.#resize.bind(this);
      this.#bindResponsiveWidth();
    }
  }

  /**
   * Creates a detached SVG surface for validation and atomic rendering.
   *
   * @param {object} [options=this.#options] - Candidate rendering options.
   * @returns {SVGSVGElement} Detached chart surface with stable root attributes.
   */
  #createElement(options = this.#options) {
    const element = svg("svg", {
      viewBox: `0 0 ${options.width} ${options.height}`,
      width: "100%",
      height: options.height,
      role: "group",
      "aria-roledescription": "chart",
      "aria-label": options.ariaLabel,
      preserveAspectRatio: "xMidYMid meet",
    });

    element.classList.add("orchid-charts-chart");
    if (this.#type === CHART_HEATMAP) {
      element.classList.add("orchid-charts-heatmap-chart");
    }

    if (this.#type === CHART_TIMESHEET) {
      element.classList.add("orchid-charts-timesheet-chart");
    }

    if (this.#type === CHART_BAR && options.orientation === ORIENTATION_HORIZONTAL) {
      element.classList.add("orchid-charts-horizontal-bar");
    }

    return element;
  }

  /**
   * Atomically mounts a completely rendered surface and its tooltip.
   *
   * @param {SVGSVGElement} element - Successfully rendered detached SVG.
   * @returns {void} Host-owned nodes and presentation classes commit together.
   */
  #commitHostPresentation(element) {
    this.#host.classList.add("orchid-charts-host");
    this.#host.replaceChildren(element, this.#tooltip.element);
  }

  /**
   * Exposes the owned SVG surface as the sole public DOM inspection boundary.
   *
   * @returns {SVGSVGElement} Current chart SVG element.
   */
  get element() {
    return this.#element;
  }

  /**
   * Replaces chart data after full normalization and redraws the current type.
   *
   * @param {object} data - New data payload compatible with the chart's immutable type.
   * @returns {import("../index.js").Chart} Current chart instance after synchronous rendering.
   * @throws {TypeError} When the new payload violates normalization or renderer invariants.
   */
  update(data) {
    this.#assertMounted();

    const model = this.#implementation.createModel(this.#type, data, {
      colors: this.#options.colors,
      maxSlices: this.#options.maxSlices,
    });

    validateChartColors(this.#host, data);

    const staged = this.#createElement();
    const dimensions = this.#renderInto(staged, model);
    this.#commitUpdate(staged, model, dimensions);

    return this;
  }

  /**
   * Reads one normalized point without exposing mutable model or renderer state.
   *
   * @param {number} [index] - Requested point, cell, or task index.
   * @returns {object | undefined} Type-appropriate normalized data at the requested index.
   */
  point(index) {
    this.#assertMounted();

    const activeMark = this.#interactions?.activeMark;

    if (index === undefined && activeMark) {
      return this.#model.pointFor(chartMark(activeMark));
    }

    const requestedIndex = index ?? 0;

    if (!Number.isSafeInteger(requestedIndex) || requestedIndex < 0) {
      throw new TypeError("Chart point index must be a non-negative integer");
    }

    return this.#model.pointAt(requestedIndex);
  }

  /**
   * Serializes the current SVG tree for storage, inspection, or export.
   *
   * @returns {string} Complete SVG markup representing the current render.
   */
  toSvg() {
    this.#assertMounted();
    const clone = this.#element.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    const originals = [
      this.#element,
      ...this.#element.querySelectorAll("*"),
    ];

    const copies = [
      clone,
      ...clone.querySelectorAll("*"),
    ];

    for (const [
      index,
      original,
    ] of originals.entries()) {
      const computed = getComputedStyle(original);
      const copy = copies[index];

      for (const property of EXPORT_STYLE_PROPERTIES) {
        const value = computed.getPropertyValue(property);

        copy.style.setProperty(property, value);
      }
    }

    return new XMLSerializer().serializeToString(clone);
  }

  /**
   * Starts a browser download containing the current chart as SVG markup.
   *
   * @param {string} [filename=this.#options.title ?? "Chart"] - Download name without the `.svg` extension.
   * @returns {import("../index.js").Chart} Current chart instance for fluent lifecycle calls.
   */
  download(filename = this.#options.title ?? "Chart") {
    this.#assertMounted();
    if (typeof filename !== "string" || filename.trim() === "" || /[\\/]/u.test(filename)) {
      throw new TypeError("Download filename must be non-empty and must not contain path separators");
    }

    const normalizedFilename = filename.toLowerCase().endsWith(SVG_EXTENSION) ? filename : `${filename}.svg`;
    const link = document.createElement("a");
    link.download = normalizedFilename;

    const url = URL.createObjectURL(
      new Blob(
        [
          this.toSvg(),
        ],
        { type: "image/svg+xml" },
      ),
    );

    link.href = url;
    link.click();
    URL.revokeObjectURL(url);

    return this;
  }

  /**
   * Detaches global listeners and removes every DOM node owned by the chart.
   *
   * @returns {void} The chart becomes unusable after cleanup completes.
   */
  destroy() {
    if (this.#destroyed) {
      return;
    }

    this.#destroyed = true;
    this.#interactions?.destroy();
    if (this.#boundResize) {
      window.removeEventListener("resize", this.#boundResize);
    }

    this.#resizeObserver?.disconnect();
    if (this.#resizeFrame !== null) {
      cancelAnimationFrame(this.#resizeFrame);
    }

    this.#element.remove();
    this.#tooltip.destroy();
    this.#host.classList.remove("orchid-charts-host");
  }

  /**
   * Re-measures an auto-width chart and redraws it against the new viewport.
   *
   * @returns {void} The existing chart instance and SVG are updated in place.
   */
  #resize() {
    if (this.#destroyed) {
      return;
    }

    const width = measureParentWidth(this.#host, this.#options.width);

    if (width === this.#options.width) {
      return;
    }

    const options = { ...this.#options, width };
    const staged = this.#createElement(options);
    const dimensions = this.#renderInto(staged, this.#model, options);
    this.#options = options;
    this.#commitUpdate(staged, this.#model, dimensions);
  }

  /**
   * Defers ResizeObserver work until the browser has completed its layout delivery.
   *
   * @returns {void} At most one responsive redraw is queued per frame.
   */
  #scheduleResize() {
    if (this.#resizeFrame !== null) {
      return;
    }

    this.#resizeFrame = requestAnimationFrame(() => {
      this.#resizeFrame = null;
      this.#resize();
    });
  }

  /**
   * Observes parent content-box changes with a browser-compatible fallback.
   *
   * @returns {void} Exactly one responsive resize source is registered.
   */
  #bindResponsiveWidth() {
    window.addEventListener("resize", this.#boundResize);
    if (typeof ResizeObserver === "function") {
      const resize = this.#type === CHART_HEATMAP ? () => this.#scheduleResize() : this.#boundResize;
      this.#resizeObserver = new ResizeObserver(resize);
      this.#resizeObserver.observe(this.#host, { box: "content-box" });
    }
  }

  /**
   * Rebuilds SVG content through class-based renderer dispatch.
   *
   * @param {SVGSVGElement} element - Detached SVG receiving rendered content.
   * @param {object} model - Fully normalized model exposed to the renderer snapshot.
   * @param {object} [options=this.#options] - Candidate rendering options.
   * @returns {void} The detached SVG contains a complete candidate scene.
   */
  #renderInto(element, model, options = this.#options) {
    const description = svg("desc");
    description.textContent = options.description ?? this.#generatedDescription(model);
    if (!options.tooltip && typeof options.onSelect !== "function") {
      description.textContent += ` ${model.describe()}`;
    }

    element.append(description);
    if (options.title) {
      const title = svg("text", { x: 16, y: 22, class: "orchid-charts-title" });
      title.textContent = options.title;
      element.append(title);
    }

    return renderChart(
      { element, options, data: model.renderData, id: this.#id },
      this.#implementation.render,
    );
  }

  /**
   * Builds a concise accessible summary when no authored description exists.
   *
   * @param {object} model - Fully normalized current model.
   * @returns {string} Plain-text chart description.
   */
  #generatedDescription(model) {
    if (this.#type === CHART_HEATMAP) {
      return `${this.#options.ariaLabel}. ${model.heatmap.length} heatmap cells.`;
    }

    if (this.#type === CHART_TIMESHEET) {
      return `${this.#options.ariaLabel}. ${model.timesheet.tasks.length} tasks.`;
    }

    const datasets = model.datasets.map((dataset) => dataset.identityName ?? dataset.name).join(", ");
    const markerCount = model.source.yMarkers.length;
    const regionCount = model.source.yRegions.length;
    const annotations = ` ${markerCount} markers and ${regionCount} regions.`;
    const datasetSummary = ` in ${datasets}`;

    return `${this.#options.ariaLabel}. ${model.labels.length} values${datasetSummary}.${annotations}`;
  }

  /**
   * Commits a validated data model and completely rendered SVG together.
   *
   * @param {SVGSVGElement} staged - Detached rendered candidate.
   * @param {object} model - Fully normalized replacement model.
   * @param {object} dimensions - Actual dimensions of the candidate scene.
   * @returns {void} Mounted data, SVG, and interactions advance together.
   */
  #commitUpdate(staged, model, dimensions) {
    const activeIndex = this.#preservedIndex(staged, model);
    const focusedIndex = this.#preservedFocus(staged, model);
    this.#replaceSurface(staged);
    this.#model = model;
    this.#dimensions = dimensions;
    if (activeIndex < 0) {
      this.#selectionIdentity = null;
    }

    this.#tooltip.hide();
    this.#bindInteractions(activeIndex, focusedIndex);
  }

  /**
   * Finds the sole candidate mark matching the current logical selection.
   *
   * @param {SVGSVGElement} staged - Completely rendered candidate surface.
   * @param {object} model - Candidate normalized data model.
   * @param {string | null} [identity=this.#selectionIdentity] - Requested selection or keyboard identity.
   * @returns {number} Matching mark index, or -1 for absent or ambiguous identity.
   */
  #preservedIndex(staged, model, identity = this.#selectionIdentity) {
    if (!identity) {
      return -1;
    }

    const matches = this.#markAddresses(staged).flatMap((address, index) =>
      focusIdentity(model, address) === identity
        ? [
            index,
          ]
        : [],
    );

    return matches.length === 1 ? matches[0] : -1;
  }

  /**
   * Enumerates logical targets for ordinary and dense charts.
   *
   * @param {SVGSVGElement} surface - Rendered chart surface.
   * @returns {object[]} Logical data addresses in navigation order.
   */
  #markAddresses(surface) {
    const marks = this.#orderedMarks(surface);

    const inspection = chartMark(marks[0])?.inspection;

    return inspection
      ? Array.from({ length: inspection.count }, (_, pointIndex) => ({
          kind: "category",
          datasetIndex: 0,
          pointIndex,
        }))
      : marks.map((mark) => chartMark(mark));
  }

  /**
   * Preserves keyboard position without moving focus from another part of the page.
   *
   * @param {SVGSVGElement} staged - Candidate surface.
   * @param {object} model - Candidate data model.
   * @returns {number} Matching or neighboring focus index, or -1 when focus is outside.
   */
  #preservedFocus(staged, model) {
    const focused = this.#element.ownerDocument.activeElement;
    const address = chartMark(focused);

    if (!this.#element.contains(focused) || !address) {
      return -1;
    }

    const identity = focusIdentity(this.#model, address);

    const matches = this.#markAddresses(staged).flatMap((candidate, index) =>
      focusIdentity(model, candidate) === identity
        ? [
            index,
          ]
        : [],
    );

    const matching = matches.length === 1 ? matches[0] : -1;
    const marks = this.#orderedMarks(staged);
    const count = chartMark(marks[0])?.inspection?.count ?? marks.length;
    const oldMarks = this.#orderedMarks(this.#element);
    const previous = address.inspection ? address.pointIndex : oldMarks.indexOf(focused);

    return matching >= 0 ? matching : Math.min(Math.max(previous, 0), count - 1);
  }

  /**
   * Moves staged children and root attributes into the stable public SVG element.
   *
   * @param {SVGSVGElement} staged - Successfully rendered detached surface.
   * @returns {void} Public element identity is preserved across redraws.
   */
  #replaceSurface(staged) {
    const currentAttributes = [
      ...this.#element.attributes,
    ];

    for (const attribute of currentAttributes) {
      this.#element.removeAttribute(attribute.name);
    }

    for (const attribute of staged.attributes) {
      this.#element.setAttribute(attribute.name, attribute.value);
    }

    this.#element.replaceChildren(...staged.childNodes);
  }

  /**
   * Rejects lifecycle operations after destruction while keeping `element` inspectable.
   *
   * @returns {void} Active charts continue normally.
   * @throws {TypeError} When the chart has been destroyed.
   */
  #assertMounted() {
    if (this.#destroyed) {
      throw new TypeError("Chart has been destroyed");
    }
  }

  /**
   * Rebinds accessible pointer, focus, keyboard, and selection behavior after render.
   *
   * @param {number} [activeIndex=-1] - Preserved selection position after rendering.
   * @param {number} [focusedIndex=-1] - Keyboard position to restore after rendering.
   * @returns {void} Rendered marks receive a fresh interaction controller.
   */
  #bindInteractions(activeIndex = -1, focusedIndex = -1) {
    this.#interactions?.destroy();
    const marks = this.#orderedMarks(this.#element);

    for (const mark of marks) {
      mark.querySelector(":scope > title")?.remove();
    }

    if (!this.#options.tooltip && typeof this.#options.onSelect !== "function") {
      const titles = this.#element.querySelectorAll(
        ".orchid-charts-visual-mark > title, .orchid-charts-line > title",
      );

      for (const title of titles) {
        title.remove();
      }

      this.#interactions = null;

      return;
    }

    const interactionBehavior = {
      activeIndex,
      focusedIndex,
      root: this.#element,
      previewable: this.#options.tooltip,
      selectable: typeof this.#options.onSelect === "function",
    };

    const interactionCallbacks = {
      labelFor: (mark) => chartMark(mark).label,
      onShow: this.#options.tooltip ? (mark) => this.#tooltip.show(mark, this.#dimensions) : () => {},
      onHide: () => this.#tooltip.hide(),
      onActiveChange: (index, mark) => this.#handleActiveChange(index, mark),
    };

    this.#interactions = chartMark(marks[0])?.inspection
      ? new DenseInspectionController(marks[0], interactionBehavior, interactionCallbacks)
      : new InteractionController(marks, interactionBehavior, interactionCallbacks);
  }

  /**
   * Returns marks in the public navigation order independently of visual layer order.
   *
   * @param {SVGSVGElement} element - Rendered surface containing interaction marks.
   * @returns {SVGElement[]} Stable keyboard and `point()` order.
   */
  #orderedMarks(element) {
    const marks = [
      ...element.querySelectorAll(MARK_SELECTOR),
    ];

    if (this.#type !== CHART_AXIS_MIXED) {
      return marks;
    }

    return marks.toSorted((left, right) => {
      const dataset = chartMark(left).datasetIndex - chartMark(right).datasetIndex;

      return dataset || chartMark(left).pointIndex - chartMark(right).pointIndex;
    });
  }

  /**
   * Commits and publishes one user-initiated persistent selection change.
   *
   * @param {number} index - Selected mark index, or -1 for explicit deselection.
   * @param {SVGElement | null} mark - Selected rendered mark.
   * @returns {void} Internal identity is committed before user code runs.
   */
  #handleActiveChange(index, mark) {
    if (index >= 0 && mark) {
      const detail = this.#model.selectionFor(chartMark(mark));
      this.#selectionIdentity = this.#model.identityFor(chartMark(mark));
      this.#host.dispatchEvent(new CustomEvent("data-select", { detail }));
      this.#options.onSelect?.(detail);

      return;
    }

    this.#selectionIdentity = null;
    this.#host.dispatchEvent(new CustomEvent("data-select"));
    this.#options.onSelect?.();
  }
}
