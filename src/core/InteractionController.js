const FORWARD_KEYS = new Set(["ArrowRight", "ArrowDown"]);
const BACKWARD_KEYS = new Set(["ArrowLeft", "ArrowUp"]);
const ACTIVE_CLASS = "is-active";
const PRESSED_CLASS = "is-pressed";
const PRESSED_ATTRIBUTE = "aria-pressed";

/**
 * Owns the transient preview, focus, pressed, and persistent selection state
 * for one rendered collection of SVG marks.
 */
export default class InteractionController {
  #items;
  #selectedIndex;
  #labelFor;
  #onActiveChange;
  #onHide;
  #onShow;
  #allowPointerPan;
  #previewable;
  #selectable;

  /**
   * Binds one roving-tabindex interaction model to ordered SVG marks.
   *
   * @param {object} configuration - Interaction callbacks and eligible SVG marks.
   * @param {Iterable<Element>} configuration.marks - Marks ordered by keyboard navigation position.
   * @param {number} [configuration.activeIndex=-1] - Initially selected mark index, or `-1` for no selection.
   * @param {(mark: Element, index: number) => string} configuration.labelFor - Builds an accessible label for a mark.
   * @param {(index: number, mark: Element | null) => void} configuration.onActiveChange - Receives persistent selection changes.
   * @param {(mark?: Element) => void} configuration.onHide - Hides a preview or restores the unselected state.
   * @param {(mark: Element, label: string, index: number) => void} configuration.onShow - Presents a mark preview or selection.
   * @param {boolean} [configuration.allowPointerPan=false] - Allows gestures to pass through non-selectable marks.
   * @param {boolean} [configuration.previewable=true] - Enables transient pointer and focus previews.
   * @param {boolean} [configuration.selectable=true] - Enables persistent click and keyboard selection.
   */
  constructor({
    marks,
    activeIndex = -1,
    labelFor,
    onActiveChange,
    onHide,
    onShow,
    allowPointerPan = false,
    previewable = true,
    selectable = true,
  }) {
    this.#items = [...marks];
    this.#labelFor = labelFor;
    this.#onActiveChange = onActiveChange;
    this.#onHide = onHide;
    this.#onShow = onShow;
    this.#allowPointerPan = allowPointerPan;
    this.#previewable = previewable;
    this.#selectable = selectable;
    this.#selectedIndex = selectable && activeIndex >= 0 && activeIndex < this.#items.length ? activeIndex : -1;

    const initialFocusIndex = Math.max(this.#selectedIndex, 0);
    for (const [index, item] of this.#items.entries()) {
      this.#bindItem(item, index, initialFocusIndex);
    }

    if (this.#selectedIndex >= 0) {
      const selected = this.#items[this.#selectedIndex];
      this.#onShow(selected, this.#labelFor(selected, this.#selectedIndex), this.#selectedIndex);
      this.#onActiveChange(this.#selectedIndex, selected);
    }
  }

  /**
   * Clears persistent selection or hides a transient preview.
   *
   * @returns {void} Interaction state is returned to its idle form.
   */
  dismiss() {
    if (this.#selectedIndex >= 0) {
      this.#updateSelection(-1);
    } else {
      this.#onHide();
    }
  }

  /**
   * Serializes a boolean into the string representation required by ARIA.
   *
   * @param {Element} element - DOM node that receives the accessibility attribute.
   * @param {string} name - Boolean attribute name such as `aria-pressed`.
   * @param {boolean} value - State to serialize as `"true"` or `"false"`.
   * @returns {void} The supplied element is updated in place.
   */
  static #reflectBoolean(element, name, value) {
    element.setAttribute(name, value ? "true" : "false");
  }

  /**
   * Applies one persistent selection and notifies chart lifecycle callbacks.
   *
   * @param {number} nextIndex - Selected mark index, or `-1` to clear selection.
   * @returns {void} CSS, ARIA, and callback state are updated together.
   */
  #updateSelection(nextIndex) {
    if (nextIndex === this.#selectedIndex) {
      return;
    }
    this.#selectedIndex = nextIndex;
    for (const [index, item] of this.#items.entries()) {
      const isSelected = index === this.#selectedIndex;
      item.classList.toggle(ACTIVE_CLASS, isSelected);
      InteractionController.#reflectBoolean(item, PRESSED_ATTRIBUTE, isSelected);
    }
    this.#onActiveChange(this.#selectedIndex, this.#selectedIndex >= 0 ? this.#items[this.#selectedIndex] : null);
    if (this.#selectedIndex >= 0) {
      const selected = this.#items[this.#selectedIndex];
      this.#onShow(selected, this.#labelFor(selected, this.#selectedIndex), this.#selectedIndex);
    } else {
      this.#onHide();
    }
  }

  /**
   * Presents a transient hover, press, or focus preview for one mark.
   *
   * @param {Element} item - Mark entering a preview state.
   * @param {number} index - Mark position used to build its label.
   * @returns {void} Preview styling and tooltip state are updated.
   */
  #showPreview(item, index) {
    item.classList.add("is-hovered");
    this.#onShow(item, this.#labelFor(item, index), index);
  }

  /**
   * Ends a transient preview and restores any persistent selection.
   *
   * @param {Element} item - Mark leaving its preview state.
   * @returns {void} Pressed styling and tooltip state are restored.
   */
  #hidePreview(item) {
    item.classList.remove("is-hovered", PRESSED_CLASS);
    if (this.#selectedIndex >= 0) {
      const selected = this.#items[this.#selectedIndex];
      this.#onShow(selected, this.#labelFor(selected, this.#selectedIndex), this.#selectedIndex);
    } else {
      this.#onHide(item);
    }
  }

  /**
   * Moves the sole tab stop through the circular ordered mark collection.
   *
   * @param {number} currentIndex - Mark currently owning the tab stop.
   * @param {number} nextIndex - Requested position before circular bounding.
   * @returns {void} Tabindex state and DOM focus move together.
   */
  #moveFocus(currentIndex, nextIndex) {
    const boundedIndex = (nextIndex + this.#items.length) % this.#items.length;
    this.#items[currentIndex].setAttribute("tabindex", "-1");
    this.#items[boundedIndex].setAttribute("tabindex", "0");
    this.#items[boundedIndex].focus();
  }

  /**
   * Applies semantics and event behavior to one rendered mark.
   *
   * @param {Element} item - SVG mark receiving interaction behavior.
   * @param {number} index - Mark position in the controller's ordered collection.
   * @param {number} initialFocusIndex - Initial owner of the roving tab stop.
   * @returns {void} Attributes and event listeners are attached in place.
   */
  #bindItem(item, index, initialFocusIndex) {
    const label = this.#labelFor(item, index);
    item.classList.add("charts2-interactive-mark");
    item.classList.toggle("charts2-previewable-mark", this.#previewable);
    item.classList.toggle("charts2-selectable-mark", this.#selectable);
    item.setAttribute("role", this.#selectable ? "button" : "img");
    item.setAttribute("focusable", "true");
    item.setAttribute("tabindex", index === initialFocusIndex ? "0" : "-1");
    item.setAttribute("aria-label", label);
    if (this.#selectable) {
      InteractionController.#reflectBoolean(item, PRESSED_ATTRIBUTE, index === this.#selectedIndex);
    } else {
      item.removeAttribute(PRESSED_ATTRIBUTE);
    }
    item.classList.toggle(ACTIVE_CLASS, index === this.#selectedIndex);

    if (this.#previewable) {
      item.addEventListener("pointerenter", () => this.#showPreview(item, index));
      item.addEventListener("pointerleave", () => this.#hidePreview(item));
      item.addEventListener("pointerdown", () => this.#showPreview(item, index));
      item.addEventListener("focus", () => this.#showPreview(item, index));
      item.addEventListener("blur", () => this.#hidePreview(item));
    }
    if (this.#selectable) {
      item.addEventListener("pointerdown", () => item.classList.add(PRESSED_CLASS));
      item.addEventListener("pointerup", () => item.classList.remove(PRESSED_CLASS));
      item.addEventListener("pointercancel", () => item.classList.remove(PRESSED_CLASS));
      item.addEventListener("click", () => this.#updateSelection(index));
    } else if (!this.#allowPointerPan) {
      item.addEventListener("pointerdown", (event) => event.preventDefault());
    }
    item.addEventListener("keydown", (event) => this.#handleKeydown(event, index));
    item.addEventListener("keyup", () => item.classList.remove(PRESSED_CLASS));
  }

  /**
   * Translates one keyboard command into focus or selection behavior.
   *
   * @param {KeyboardEvent} event - Key event dispatched by an interactive mark.
   * @param {number} index - Position of the mark that received the command.
   * @returns {void} Recognized commands prevent default behavior and update state.
   */
  #handleKeydown(event, index) {
    if (FORWARD_KEYS.has(event.key)) {
      event.preventDefault();
      this.#moveFocus(index, index + 1);
    } else if (BACKWARD_KEYS.has(event.key)) {
      event.preventDefault();
      this.#moveFocus(index, index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      this.#moveFocus(index, 0);
    } else if (event.key === "End") {
      event.preventDefault();
      this.#moveFocus(index, this.#items.length - 1);
    } else if (this.#selectable && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      this.#items[index].classList.add(PRESSED_CLASS);
      this.#updateSelection(index);
    } else if (event.key === "Escape") {
      event.preventDefault();
      if (this.#selectedIndex >= 0) {
        this.#updateSelection(-1);
      }
    }
  }
}
