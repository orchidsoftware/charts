import { renderChart } from "../renderers/Render.js";
import { ChartOrientation, ChartType } from "../support/Constants.js";
import { measureParentWidth, resolveParent, svg } from "../support/Dom.js";

import ChartData from "./ChartData.js";
import ChartTooltip from "./ChartTooltip.js";
import InteractionController from "./InteractionController.js";
import { nextChartId } from "./NextChartId.js";
import { normalizeChartOptions } from "./Options.js";

const MARK_SELECTOR = ".charts2-mark";

/**
 * Public lifecycle façade for one chart. All mutable model, rendering,
 * interaction, tooltip, and browser-resource details are private class state.
 */
export default class Chart {
  #host;
  #type;
  #hasCustomColors;
  #id;
  #autoWidth;
  #options;
  #model;
  #element;
  #tooltip;
  #interactions = null;
  #activeMarkIndex = -1;
  #boundPointerMove;
  #boundPointerLeave;
  #boundDocumentPointerDown;
  #boundResize = null;

  /**
   * Validates options, mounts owned DOM, and renders the initial chart.
   *
   * @param {string | Element} parent - CSS selector or element that will host generated markup.
   * @param {import("../index.js").ChartOptions} options - Complete chart configuration and initial data.
   * @throws {TypeError} When options, dimensions, renderer settings, or data violate the public contract.
   */
  constructor(parent, options) {
    this.#host = resolveParent(parent);
    const chartConfig = normalizeChartOptions(this.#host, options);
    this.#type = chartConfig.options.type;
    this.#hasCustomColors = chartConfig.hasCustomColors;
    this.#id = nextChartId();
    this.#autoWidth = options.width === undefined;
    this.#options = chartConfig.options;
    this.#model = new ChartData(this.#type, options.data);

    this.#element = svg("svg", {
      viewBox: `0 0 ${this.#options.width} ${this.#options.height}`,
      width: "100%",
      height: this.#options.height,
      role: "group",
      "aria-roledescription": "chart",
      "aria-label": this.#options.ariaLabel,
      preserveAspectRatio: "xMidYMid meet",
    });
    this.#element.classList.add("charts2-chart");
    if (this.#type === ChartType.HEATMAP) {
      this.#element.classList.add("charts2-heatmap-chart");
    } else if (this.#type === ChartType.TIMESHEET) {
      this.#element.classList.add("charts2-timesheet-chart");
    } else if (this.#type === ChartType.BAR && this.#options.orientation === ChartOrientation.HORIZONTAL) {
      this.#element.classList.add("charts2-horizontal-bar");
    }

    this.#tooltip = new ChartTooltip(this.#host, this.#element, this.#id);
    this.#host.classList.add("charts2-host");
    this.#host.replaceChildren(this.#element, this.#tooltip.element);

    this.#boundPointerMove = this.#showTooltip.bind(this);
    this.#boundPointerLeave = this.#tooltip.hide.bind(this.#tooltip);
    this.#boundDocumentPointerDown = this.#handleDocumentPointerDown.bind(this);
    if (this.#options.showTooltip) {
      this.#element.addEventListener("mousemove", this.#boundPointerMove);
    }
    this.#element.addEventListener("mouseleave", this.#boundPointerLeave);
    document.addEventListener("pointerdown", this.#boundDocumentPointerDown);
    this.#render();

    if (this.#autoWidth) {
      this.#boundResize = this.#resize.bind(this);
      window.addEventListener("resize", this.#boundResize);
    }
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
    this.#model.update(data);
    this.#render();
    return this;
  }

  /**
   * Reads one normalized point without exposing mutable model or renderer state.
   *
   * @param {number} [index=Math.max(0, this.#activeMarkIndex)] - Requested point, cell, or task index.
   * @returns {object | undefined} Type-appropriate normalized data at the requested index.
   */
  point(index = Math.max(0, this.#activeMarkIndex)) {
    return this.#model.pointAt(index);
  }

  /**
   * Serializes the current SVG tree for storage, inspection, or export.
   *
   * @returns {string} Complete SVG markup representing the current render.
   */
  toSvg() {
    return new XMLSerializer().serializeToString(this.#element);
  }

  /**
   * Starts a browser download containing the current chart as SVG markup.
   *
   * @param {string} [filename=this.#options.title ?? "Chart"] - Download name without the `.svg` extension.
   * @returns {import("../index.js").Chart} Current chart instance for fluent lifecycle calls.
   */
  download(filename = this.#options.title ?? "Chart") {
    const link = document.createElement("a");
    link.download = `${filename}.svg`;
    link.href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(this.toSvg())}`;
    link.click();
    return this;
  }

  /**
   * Detaches global listeners and removes every DOM node owned by the chart.
   *
   * @returns {void} The chart becomes unusable after cleanup completes.
   */
  destroy() {
    this.#element.removeEventListener("mousemove", this.#boundPointerMove);
    this.#element.removeEventListener("mouseleave", this.#boundPointerLeave);
    document.removeEventListener("pointerdown", this.#boundDocumentPointerDown);
    if (this.#boundResize) {
      window.removeEventListener("resize", this.#boundResize);
    }
    this.#element.remove();
    this.#tooltip.destroy();
    this.#host.classList.remove("charts2-host", "charts2-scrollable-heatmap");
  }

  /**
   * Re-measures an auto-width chart and redraws it against the new viewport.
   *
   * @returns {void} The existing chart instance and SVG are updated in place.
   */
  #resize() {
    this.#options.width = measureParentWidth(this.#host, this.#options.width);
    this.#element.setAttribute("viewBox", `0 0 ${this.#options.width} ${this.#options.height}`);
    this.#render();
  }

  /**
   * Resolves the mark under a mouse event and previews its tooltip.
   *
   * @param {MouseEvent} event - Mouse movement event dispatched within the chart SVG.
   * @returns {void} Tooltip state is updated when an eligible mark is present.
   */
  #showTooltip(event) {
    const mark = event.target.closest(MARK_SELECTOR);
    if (!mark || !this.#element.contains(mark)) {
      this.#tooltip.hide();
      return;
    }
    this.#tooltip.show(mark, mark.dataset.tooltip, this.#options);
  }

  /**
   * Clears persistent selection when a pointer press occurs outside chart marks.
   *
   * @param {PointerEvent} event - Document-level pointer event used for outside detection.
   * @returns {void} Active interaction state is dismissed when appropriate.
   */
  #handleDocumentPointerDown(event) {
    const mark = event.target.closest(MARK_SELECTOR);
    if (!mark || !this.#element.contains(mark)) {
      this.#interactions?.dismiss();
    }
  }

  /**
   * Rebuilds SVG content through class-based renderer dispatch.
   *
   * @returns {void} The current SVG and interaction controller are replaced synchronously.
   */
  #render() {
    this.#element.replaceChildren();
    const description = svg("desc");
    description.textContent = this.#options.description ?? this.#options.ariaLabel;
    this.#element.append(description);
    renderChart(
      {
        host: this.#host,
        element: this.#element,
        options: this.#options,
        source: this.#model.source,
        datasets: this.#model.datasets,
        labels: this.#model.labels,
        heatmap: this.#model.heatmap,
        timesheet: this.#model.timesheet,
        hasCustomColors: this.#hasCustomColors,
        id: this.#id,
      },
      this.#type,
    );
    this.#bindInteractions();
  }

  /**
   * Rebinds accessible pointer, focus, keyboard, and selection behavior after render.
   *
   * @returns {void} Rendered marks receive a fresh interaction controller.
   */
  #bindInteractions() {
    const marks = this.#element.querySelectorAll(MARK_SELECTOR);
    for (const mark of marks) {
      mark.querySelector(":scope > title")?.remove();
    }
    if (!this.#options.showTooltip && typeof this.#options.onSelect !== "function") {
      const titles = this.#element.querySelectorAll(".charts2-visual-mark > title, .charts2-line > title");
      for (const title of titles) {
        title.remove();
      }
      this.#interactions = null;
      return;
    }
    this.#interactions = new InteractionController({
      marks,
      activeIndex: this.#activeMarkIndex,
      allowPointerPan: this.#host.classList.contains("charts2-scrollable-heatmap"),
      previewable: this.#options.showTooltip,
      selectable: typeof this.#options.onSelect === "function",
      labelFor: (mark) => mark.dataset.tooltip,
      onShow: this.#options.showTooltip ? (mark, label) => this.#tooltip.show(mark, label, this.#options) : () => {},
      onHide: () => this.#tooltip.hide(),
      onActiveChange: (index, mark) => {
        this.#activeMarkIndex = index;
        if (index >= 0 && mark) {
          const detail = this.#model.selectionFor(mark);
          this.#host.dispatchEvent(new CustomEvent("data-select", { detail }));
          this.#options.onSelect?.(detail);
        }
      },
    });
  }
}
