const FORWARD_KEYS = new Set([
  "ArrowRight",
  "ArrowDown",
]);

const BACKWARD_KEYS = new Set([
  "ArrowLeft",
  "ArrowUp",
]);

const ACTIVE_CLASS = "is-active";
const HOVERED_CLASS = "is-hovered";
const PRESSED_CLASS = "is-pressed";
const PRESSED_ATTRIBUTE = "aria-pressed";
const TOUCH_POINTER = "touch";

/**
 * Resolves a valid initial selection without exposing partial conditions.
 *
 * @param {Element[]} items - Ordered interactive marks.
 * @param {number} activeIndex - Requested active mark index.
 * @param {boolean} selectable - Whether persistent selection is enabled.
 * @returns {number} Valid selected index or `-1` when selection starts empty.
 */
function initialSelection(items, activeIndex, selectable) {
  if (!selectable || activeIndex < 0) {
    return -1;
  }

  if (activeIndex >= items.length) {
    return -1;
  }

  return activeIndex;
}

/**
 * Resolves keyboard navigation into a requested focus index.
 *
 * @param {string} key - Browser keyboard key.
 * @param {number} index - Current mark index.
 * @param {number} itemCount - Number of navigable marks.
 * @returns {number | null} Requested index, or null for a non-navigation key.
 */
function focusIndexFor(key, index, itemCount) {
  if (FORWARD_KEYS.has(key)) {
    return index + 1;
  }

  if (BACKWARD_KEYS.has(key)) {
    return index - 1;
  }

  if (key === "Home") {
    return 0;
  }

  if (key === "End") {
    return itemCount - 1;
  }

  return null;
}

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
  #onFocusChange;
  #previewable;
  #selectable;
  #touchPendingItem = null;
  #touchPreviewItem = null;
  #visualItems = new WeakMap();

  /**
   * Binds one roving-tabindex interaction model to ordered SVG marks.
   *
   * @param {Iterable<Element>} marks - Marks ordered by keyboard navigation position.
   * @param {object} behavior - Initial selection and enabled interaction modes.
   * @param {object} callbacks - Label, preview, and persistent-selection effects.
   */
  constructor(marks, behavior, callbacks) {
    this.#items = [
      ...marks,
    ];
    this.#labelFor = callbacks.labelFor;
    this.#onActiveChange = callbacks.onActiveChange;
    this.#onHide = callbacks.onHide;
    this.#onShow = callbacks.onShow;
    this.#onFocusChange = callbacks.onFocusChange;
    this.#previewable = behavior.previewable ?? true;
    this.#selectable = behavior.selectable ?? true;
    this.#selectedIndex = initialSelection(this.#items, behavior.activeIndex ?? -1, this.#selectable);

    const initialFocusIndex = Math.max(this.#selectedIndex, 0);

    for (const [
      index,
      item,
    ] of this.#items.entries()) {
      this.#bindItem(item, index, initialFocusIndex);
    }

    if (this.#selectedIndex >= 0) {
      const selected = this.#items[this.#selectedIndex];
      this.#onShow(selected, this.#labelFor(selected, this.#selectedIndex), this.#selectedIndex);
    }
  }

  /**
   * Clears persistent selection or hides a transient preview.
   *
   * @returns {void} Interaction state is returned to its idle form.
   */
  dismiss() {
    this.#touchPendingItem = null;
    if (this.#selectedIndex >= 0) {
      this.#clearTouchPreview();
      this.#updateSelection(-1);

      return;
    }

    if (this.#clearTouchPreview()) {
      this.#onHide();

      return;
    }

    this.#onHide();
  }

  /**
   * Releases a touch-pinned preview without changing persistent selection.
   *
   * @returns {boolean} True when a touch preview was released.
   */
  #clearTouchPreview() {
    if (!this.#touchPreviewItem) {
      return false;
    }

    const item = this.#touchPreviewItem;
    this.#touchPreviewItem = null;
    this.#toggleVisualState(item, HOVERED_CLASS, false);
    this.#toggleVisualState(item, PRESSED_CLASS, false);

    return true;
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
   * Resolves the visible point paired with a transparent 44 px hit target.
   *
   * @param {Element} item - Interactive mark or point hit target.
   * @returns {Element} Visible presentation mark, or the item itself.
   */
  #visualItem(item) {
    if (!item.classList.contains("charts2-point-hit")) {
      return item;
    }

    let visual = this.#visualItems.get(item);

    if (!visual) {
      const datasetIndex = item.dataset.datasetIndex;
      const pointIndex = item.dataset.pointIndex;
      visual = item.ownerSVGElement.querySelector(
        `.charts2-visual-mark[data-dataset-index="${CSS.escape(datasetIndex)}"][data-point-index="${CSS.escape(pointIndex)}"]`,
      );
      this.#visualItems.set(item, visual ?? item);
    }

    return visual ?? item;
  }

  /**
   * Reflects a visual interaction class on both hit and presentation marks.
   *
   * @param {Element} item - Interactive mark receiving state.
   * @param {string} className - CSS state class.
   * @param {boolean} active - Whether the state is enabled.
   * @returns {void} The hit target and visible mark stay visually synchronized.
   */
  #toggleVisualState(item, className, active) {
    item.classList.toggle(className, active);
    this.#visualItem(item).classList.toggle(className, active);
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
    for (const [
      index,
      item,
    ] of this.#items.entries()) {
      const isSelected = index === this.#selectedIndex;
      this.#toggleVisualState(item, ACTIVE_CLASS, isSelected);
      InteractionController.#reflectBoolean(item, PRESSED_ATTRIBUTE, isSelected);
    }

    this.#onActiveChange(
      this.#selectedIndex,
      this.#selectedIndex >= 0 ? this.#items[this.#selectedIndex] : null,
    );
    if (this.#selectedIndex >= 0) {
      const selected = this.#items[this.#selectedIndex];
      this.#onShow(selected, this.#labelFor(selected, this.#selectedIndex), this.#selectedIndex);

      return;
    }

    this.#onHide();
  }

  /**
   * Presents a transient hover, press, or focus preview for one mark.
   *
   * @param {Element} item - Mark entering a preview state.
   * @param {number} index - Mark position used to build its label.
   * @returns {void} Preview styling and tooltip state are updated.
   */
  #showPreview(item, index) {
    this.#toggleVisualState(item, HOVERED_CLASS, true);
    this.#onShow(item, this.#labelFor(item, index), index);
  }

  /**
   * Ends a transient preview and restores any persistent selection.
   *
   * @param {Element} item - Mark leaving its preview state.
   * @returns {void} Pressed styling and tooltip state are restored.
   */
  #hidePreview(item) {
    this.#toggleVisualState(item, HOVERED_CLASS, false);
    this.#toggleVisualState(item, PRESSED_CLASS, false);
    if (this.#selectedIndex >= 0) {
      const selected = this.#items[this.#selectedIndex];
      this.#onShow(selected, this.#labelFor(selected, this.#selectedIndex), this.#selectedIndex);

      return;
    }

    this.#onHide(item);
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
    this.#configureItem(item, index, initialFocusIndex);
    item.addEventListener("focus", () => this.#onFocusChange(index, item));
    this.#bindPreview(item, index);
    this.#bindSelection(item, index);
    this.#bindKeyboard(item, index);
  }

  /**
   * Applies static accessibility and state attributes to one mark.
   *
   * @param {Element} item - SVG mark receiving attributes.
   * @param {number} index - Mark position in the ordered collection.
   * @param {number} initialFocusIndex - Initial owner of the roving tab stop.
   * @returns {void} The mark reflects its current interaction capabilities.
   */
  #configureItem(item, index, initialFocusIndex) {
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
    }

    if (!this.#selectable) {
      item.removeAttribute(PRESSED_ATTRIBUTE);
    }

    this.#toggleVisualState(item, ACTIVE_CLASS, index === this.#selectedIndex);
  }

  /**
   * Binds transient pointer and focus preview behavior.
   *
   * @param {Element} item - SVG mark receiving preview listeners.
   * @param {number} index - Mark position used by callbacks.
   * @returns {void} Preview listeners are attached when enabled.
   */
  #bindPreview(item, index) {
    if (!this.#previewable) {
      return;
    }

    item.addEventListener("pointerenter", (event) => this.#previewPointerEnter(event, item, index));
    item.addEventListener("pointerleave", (event) => this.#previewPointerLeave(event, item));
    item.addEventListener("pointerdown", (event) => this.#previewPointerDown(event, item, index));
    item.addEventListener("pointerup", (event) => this.#previewPointerUp(event, item, index));
    item.addEventListener("pointercancel", (event) => this.#previewPointerCancel(event, item));
    item.addEventListener("focus", () => {
      if (item !== this.#touchPendingItem) {
        this.#showPreview(item, index);
      }
    });
    item.addEventListener("blur", () => {
      if (item !== this.#touchPendingItem && item !== this.#touchPreviewItem) {
        this.#hidePreview(item);
      }
    });
  }

  /**
   * Shows a hover-capable pointer preview after releasing any touch preview.
   *
   * @param {PointerEvent} event - Pointer entry carrying the input modality.
   * @param {Element} item - Entered interactive mark.
   * @param {number} index - Mark position used to build its label.
   * @returns {void} Hover-capable pointers replace the current preview.
   */
  #previewPointerEnter(event, item, index) {
    if (event.pointerType === TOUCH_POINTER) {
      return;
    }

    this.#touchPendingItem = null;
    this.#clearTouchPreview();
    this.#showPreview(item, index);
  }

  /**
   * Hides a pointer preview unless touch has pinned it for inspection.
   *
   * @param {PointerEvent} event - Pointer exit carrying the input modality.
   * @param {Element} item - Exited interactive mark.
   * @returns {void} Transient previews end while touch previews persist.
   */
  #previewPointerLeave(event, item) {
    if (
      event.pointerType === TOUCH_POINTER &&
      (item === this.#touchPendingItem || item === this.#touchPreviewItem)
    ) {
      return;
    }

    this.#hidePreview(item);
  }

  /**
   * Shows a pointer preview and pins it when direct touch initiated it.
   *
   * @param {PointerEvent} event - Pointer press carrying the input modality.
   * @param {Element} item - Pressed interactive mark.
   * @param {number} index - Mark position used to build its label.
   * @returns {void} Touch replaces the prior pinned preview without hiding the tooltip.
   */
  #previewPointerDown(event, item, index) {
    if (event.pointerType === TOUCH_POINTER) {
      this.#touchPendingItem = item;

      return;
    }

    this.#showPreview(item, index);
  }

  /**
   * Commits a touch preview only after the browser recognizes a completed tap.
   *
   * @param {PointerEvent} event - Pointer release carrying the input modality.
   * @param {Element} item - Released interactive mark.
   * @param {number} index - Mark position used to build its label.
   * @returns {void} A completed touch replaces the prior pinned preview.
   */
  #previewPointerUp(event, item, index) {
    if (event.pointerType !== TOUCH_POINTER || item !== this.#touchPendingItem) {
      return;
    }

    this.#touchPendingItem = null;
    this.#clearTouchPreview();
    this.#touchPreviewItem = item;
    this.#showPreview(item, index);
  }

  /**
   * Releases a touch preview when scrolling or the browser cancels its gesture.
   *
   * @param {PointerEvent} event - Cancellation carrying the input modality.
   * @param {Element} item - Cancelled interactive mark.
   * @returns {void} Only the matching touch preview is released.
   */
  #previewPointerCancel(event, item) {
    if (event.pointerType !== TOUCH_POINTER || item !== this.#touchPendingItem) {
      return;
    }

    this.#touchPendingItem = null;
  }

  /**
   * Binds persistent selection or pointer-pan behavior.
   *
   * @param {Element} item - SVG mark receiving pointer listeners.
   * @param {number} index - Mark position used by selection callbacks.
   * @returns {void} The appropriate pointer policy is attached.
   */
  #bindSelection(item, index) {
    if (this.#selectable) {
      item.addEventListener("pointerdown", () => this.#toggleVisualState(item, PRESSED_CLASS, true));
      item.addEventListener("pointerup", () => this.#toggleVisualState(item, PRESSED_CLASS, false));
      item.addEventListener("pointercancel", () => this.#toggleVisualState(item, PRESSED_CLASS, false));
      item.addEventListener("click", () => {
        this.#clearTouchPreview();
        this.#updateSelection(index);
      });

      return;
    }

    item.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== TOUCH_POINTER) {
        event.preventDefault();
      }
    });
  }

  /**
   * Binds keyboard navigation and release behavior.
   *
   * @param {Element} item - SVG mark receiving keyboard listeners.
   * @param {number} index - Mark position used by navigation commands.
   * @returns {void} Keyboard listeners are attached.
   */
  #bindKeyboard(item, index) {
    item.addEventListener("keydown", (event) => this.#handleKeydown(event, index));
    item.addEventListener("keyup", () => this.#toggleVisualState(item, PRESSED_CLASS, false));
  }

  /**
   * Translates one keyboard command into focus or selection behavior.
   *
   * @param {KeyboardEvent} event - Key event dispatched by an interactive mark.
   * @param {number} index - Position of the mark that received the command.
   * @returns {void} Recognized commands prevent default behavior and update state.
   */
  #handleKeydown(event, index) {
    const focusIndex = focusIndexFor(event.key, index, this.#items.length);

    if (focusIndex !== null) {
      event.preventDefault();
      this.#moveFocus(index, focusIndex);

      return;
    }

    if (this.#selectable && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      this.#toggleVisualState(this.#items[index], PRESSED_CLASS, true);
      this.#updateSelection(index);

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();

      if (this.#selectedIndex >= 0) {
        this.#updateSelection(-1);
      }
    }
  }
}
