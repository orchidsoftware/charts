/**
 * Drives one interactive chart through person-level feature actions.
 */
export default class ChartScenario {
  #chart;

  /**
   * Wraps one chart while leaving assertions visible in each test.
   *
   * @param {object} chart - Public chart instance created for the scenario.
   */
  constructor(chart) {
    this.#chart = chart;
  }

  /**
   * Finds every mark participating in the shared interaction contract.
   *
   * @param {string} [selector=".orchid-charts-interactive-mark"] - Mark selector for a specialized scenario.
   * @returns {Element[]} Ordered interactive marks.
   */
  marks(selector = ".orchid-charts-interactive-mark") {
    return [...this.#chart.element.querySelectorAll(selector)];
  }

  /**
   * Selects one interactive mark for fluent person-level actions.
   *
   * @param {number} [index=0] - Zero-based mark position.
   * @param {string} [selector=".orchid-charts-interactive-mark"] - Mark selector for a specialized scenario.
   * @returns {ChartMark} Action driver for the selected mark.
   */
  mark(index = 0, selector = ".orchid-charts-interactive-mark") {
    return chartMark(this.marks(selector)[index]);
  }

  /**
   * Finds the tooltip owned by the chart host.
   *
   * @returns {HTMLElement} Tooltip element used by visible feature assertions.
   */
  tooltip() {
    return this.#chart.element.parentElement.querySelector(".orchid-charts-tooltip");
  }

  /**
   * Exposes the public chart when a scenario asserts rendering or updates data.
   *
   * @returns {object} Public chart instance.
   */
  chart() {
    return this.#chart;
  }

  /**
   * Releases listeners and DOM owned by this scenario.
   *
   * @returns {void} The scenario is destroyed.
   */
  destroy() {
    this.#chart.destroy();
  }
}

/**
 * Translates readable feature actions into browser events for one chart mark.
 */
class ChartMark {
  #element;

  /**
   * Creates an action driver for an existing rendered mark.
   *
   * @param {Element} element - Interactive SVG element to drive.
   */
  constructor(element) {
    this.#element = element;
  }

  /**
   * Exposes the mark for explicit assertions without hiding expected results.
   *
   * @returns {Element} Driven SVG mark.
   */
  element() {
    return this.#element;
  }

  /**
   * Moves keyboard focus to the mark.
   *
   * @returns {ChartMark} This driver for fluent actions.
   */
  focus() {
    this.#element.focus();
    return this;
  }

  /**
   * Performs a complete keyboard press on the mark.
   *
   * @param {string} key - Browser key value such as Enter or ArrowRight.
   * @returns {ChartMark} This driver for fluent actions.
   */
  press(key) {
    this.#element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key }));
    this.#element.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key }));
    return this;
  }

  /**
   * Moves the pointer onto the mark and optionally supplies cursor coordinates.
   *
   * @param {{x?: number, y?: number}} [position={}] - Optional pointer coordinates.
   * @returns {ChartMark} This driver for fluent actions.
   */
  hover({ x, y } = {}) {
    this.#element.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    if (x !== undefined && y !== undefined) {
      this.#element.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: x, clientY: y }));
    }
    return this;
  }

  /**
   * Performs the pointer-down and click sequence used for selection.
   *
   * @returns {ChartMark} This driver for fluent actions.
   */
  click() {
    this.#element.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    this.#element.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    this.#element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    return this;
  }

  /**
   * Moves the pointer away from the mark.
   *
   * @returns {ChartMark} This driver for fluent actions.
   */
  leave() {
    this.#element.dispatchEvent(new PointerEvent("pointerleave"));
    return this;
  }
}

/**
 * Creates the mark driver after its class has been initialized.
 *
 * @param {Element} element - Interactive SVG element to drive.
 * @returns {ChartMark} Action driver for the supplied mark.
 */
function chartMark(element) {
  return new ChartMark(element);
}
