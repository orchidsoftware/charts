import { chartMark, markMetadata } from "../support/ChartMark.js";

/**
 * Owns a single reusable hit target for a dense category series.
 */
export default class DenseInspectionController {
  #mark;
  #pointMark;
  #inspection;
  #behavior;
  #callbacks;
  #events = new AbortController();
  #index = 0;
  #focusedIndex = 0;
  #selectedIndex = -1;
  #touchPinned = false;

  /**
   * Binds constant-size pointer and keyboard interaction state.
   *
   * @param {SVGElement} mark - Full-plot hit target with lazy category metadata.
   * @param {object} behavior - Preview, selection, root, and initial selection.
   * @param {object} callbacks - Shared chart tooltip and selection effects.
   */
  constructor(mark, behavior, callbacks) {
    this.#mark = mark;
    this.#pointMark = mark.cloneNode(false);
    this.#inspection = chartMark(mark).inspection;
    this.#behavior = behavior;
    this.#callbacks = callbacks;
    this.#selectedIndex = behavior.activeIndex;
    this.#focusedIndex = Math.max(behavior.focusedIndex, 0);
    mark.classList.add("orchid-charts-interactive-mark");
    mark.setAttribute("tabindex", "0");
    mark.setAttribute("focusable", "true");
    mark.setAttribute("role", behavior.selectable ? "button" : "img");
    this.#address(Math.max(this.#selectedIndex, 0));
    this.#bind();
    if (this.#selectedIndex >= 0) {
      this.#show(this.#selectedIndex);
    }

    if (behavior.focusedIndex >= 0) {
      mark.focus({ preventScroll: true });
    }
  }

  /**
   * Defensive selected or keyboard-focused category address.
   *
   * @returns {SVGElement} The interaction state is synchronized.
   */
  get activeMark() {
    const index = this.#selectedIndex >= 0 ? this.#selectedIndex : this.#focusedIndex;
    markMetadata(this.#pointMark, this.#inspection.addressAt(index));

    return this.#pointMark;
  }

  /**
   * All owned document and element listeners are released.
   *
   * @returns {void} The interaction state is synchronized.
   */
  destroy() {
    this.#events.abort();
  }

  /**
   * Registers one listener with the mounted session's lifetime.
   *
   * @param {EventTarget} target - Listener owner.
   * @param {string} type - Event name.
   * @param {(event: Event) => void} callback - Event reaction.
   * @returns {void} Listener is released by destroy.
   */
  #listen(target, type, callback) {
    target.addEventListener(type, callback, { signal: this.#events.signal });
  }

  /**
   * The full plot receives pointer, focus, and keyboard behavior.
   *
   * @returns {void} The interaction state is synchronized.
   */
  #bind() {
    for (const type of [
      "pointerenter",
      "pointermove",
      "pointerdown",
    ]) {
      this.#listen(this.#mark, type, (event) => this.#pointer(event));
    }

    this.#listen(this.#mark, "pointerleave", () => {
      if (!this.#touchPinned) {
        this.#restore();
      }
    });
    this.#listen(this.#mark, "pointercancel", () => {
      this.#touchPinned = false;
      this.#restore();
    });
    this.#listen(this.#mark, "click", () => this.#select());
    this.#listen(this.#mark, "focus", () => this.#show(this.#focusedIndex));
    this.#listen(this.#mark, "blur", () => this.#restore());
    this.#listen(this.#mark, "keydown", (event) => this.#keyboard(event));
    this.#listen(this.#mark.ownerDocument, "pointerdown", (event) => {
      if (event.target !== this.#mark) {
        this.dismiss();
      }
    });
  }

  /**
   * Resolves the nearest category without generating one target per data point.
   *
   * @param {PointerEvent} event - Pointer coordinates in viewport space.
   * @returns {void} Hover or direct-touch preview follows the current category.
   */
  #pointer(event) {
    if (event.pointerType === "touch" && event.type !== "pointerdown") {
      return;
    }

    this.#touchPinned = event.pointerType === "touch";
    const matrix = this.#mark.ownerSVGElement.getScreenCTM().inverse();
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix);
    const index = this.#inspection.indexAt(point.x, point.y);

    if (event.type === "pointerdown") {
      this.#focusedIndex = index;
    }

    this.#show(index);
  }

  /**
   * Replaces only the current category's metadata and highlight geometry.
   *
   * @param {number} index - Logical category index.
   * @returns {void} Public point addressing and accessible text remain exact.
   */
  #address(index) {
    this.#index = index;
    const address = this.#inspection.addressAt(index);
    markMetadata(this.#mark, { ...address, inspection: this.#inspection });
    this.#mark.setAttribute("aria-label", address.label);
    const highlight = address.visualElement;

    const attributes = Object.entries(this.#inspection.bandAt(index));

    for (const [
      name,
      value,
    ] of attributes) {
      highlight.setAttribute(name, String(value));
    }

    highlight.classList.toggle("is-active", index === this.#selectedIndex);
    if (this.#behavior.selectable) {
      this.#mark.setAttribute("aria-pressed", String(index === this.#selectedIndex));
    }
  }

  /**
   * Shows the shared multi-series preview for one category.
   *
   * @param {number} index - Category to inspect.
   * @returns {void} One highlight and tooltip represent the complete column.
   */
  #show(index) {
    this.#address(index);
    const highlight = chartMark(this.#mark).visualElement;
    highlight.setAttribute("visibility", "visible");
    highlight.classList.add("is-hovered");
    if (this.#behavior.previewable) {
      this.#callbacks.onShow(this.#mark);
    }
  }

  /**
   * Transient preview ends or restores the selected category.
   *
   * @returns {void} The interaction state is synchronized.
   */
  #restore() {
    if (this.#selectedIndex >= 0) {
      this.#show(this.#selectedIndex);

      return;
    }

    this.#address(this.#index);
    const highlight = chartMark(this.#mark).visualElement;
    highlight.setAttribute("visibility", "hidden");
    highlight.classList.remove("is-hovered");
    this.#callbacks.onHide();
  }

  /**
   * Current category becomes the persistent selection if enabled.
   *
   * @returns {void} The interaction state is synchronized.
   */
  #select() {
    if (!this.#behavior.selectable || this.#selectedIndex === this.#index) {
      return;
    }

    this.#selectedIndex = this.#index;
    this.#show(this.#selectedIndex);
    this.#callbacks.onActiveChange(this.#selectedIndex, this.#mark);
  }

  /**
   * Selection and touch preview are explicitly cleared.
   *
   * @returns {void} The interaction state is synchronized.
   */
  dismiss() {
    this.#touchPinned = false;
    if (this.#selectedIndex >= 0) {
      this.#selectedIndex = -1;
      this.#callbacks.onActiveChange(-1, null);
    }

    this.#restore();
  }

  /**
   * Moves through logical categories while keeping one stable tab stop.
   *
   * @param {KeyboardEvent} event - Navigation or activation command.
   * @returns {void} Keyboard inspection includes every category.
   */
  #keyboard(event) {
    const count = this.#inspection.count;

    const indices = {
      ArrowRight: (this.#index + 1) % count,
      ArrowDown: (this.#index + 1) % count,
      ArrowLeft: (this.#index + count - 1) % count,
      ArrowUp: (this.#index + count - 1) % count,
      Home: 0,
      End: count - 1,
    };

    if (Object.hasOwn(indices, event.key)) {
      event.preventDefault();
      this.#focusedIndex = indices[event.key];
      this.#show(this.#focusedIndex);

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      this.dismiss();

      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.#select();
    }
  }
}
