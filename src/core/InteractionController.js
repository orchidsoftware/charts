import { chartMark } from "../support/ChartMark.js";

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
  #events = new AbortController();
  #focusedIndex = 0;
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

    const initialFocusIndex =
      behavior.focusedIndex >= 0 ? behavior.focusedIndex : Math.max(this.#selectedIndex, 0);

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

    this.#bindRoot(behavior.root);
    if (behavior.focusedIndex >= 0) {
      this.#items[behavior.focusedIndex].focus({ preventScroll: true });
    }
  }

  /**
   * Returns the active selection or keyboard position for public point inspection.
   *
   * @returns {number} Current public navigation index.
   */
  get pointIndex() {
    return this.#selectedIndex >= 0 ? this.#selectedIndex : this.#focusedIndex;
  }

  /**
   * Reads the selected or keyboard-focused element without interpreting its data address.
   *
   * @returns {SVGElement | undefined} Current interaction target.
   */
  get activeMark() {
    return this.#items[this.pointIndex];
  }

  /**
   * Releases every listener owned by this interaction session.
   *
   * @returns {void} Detached elements and document listeners stop reacting.
   */
  destroy() {
    this.#events.abort();
  }

  /**
   * Attaches a listener whose lifetime belongs to this controller.
   *
   * @param {EventTarget} target - Element or document receiving the event.
   * @param {string} event - Browser event name.
   * @param {(event: Event) => void} callback - Event reaction.
   * @returns {void} The listener is removed on destruction.
   */
  #listen(target, event, callback) {
    target.addEventListener(event, callback, { signal: this.#events.signal });
  }

  /**
   * Owns chart-wide pointer preview and outside-click dismissal.
   *
   * @param {SVGElement | undefined} root - Mounted chart surface when available.
   * @returns {void} The session owns all chart-wide pointer reactions.
   */
  #bindRoot(root) {
    if (!root) {
      return;
    }

    if (this.#previewable) {
      this.#listen(root, "mousemove", (event) => this.#previewMove(event));
      this.#listen(root, "mouseleave", () => {
        if (!this.#touchPendingItem && !this.#touchPreviewItem) {
          this.#restoreSelection();
        }
      });
    }

    this.#listen(root.ownerDocument, "pointerdown", (event) => {
      const mark = event.target.closest(".orchid-charts-mark");

      if (!this.#items.includes(mark)) {
        this.dismiss();
      }
    });
  }

  /**
   * Handles pointer movement through the same preview callbacks as keyboard focus.
   *
   * @param {MouseEvent} event - Pointer movement over the owned chart surface.
   * @returns {void} The matching mark is previewed or its tooltip is hidden.
   */
  #previewMove(event) {
    if (this.#touchPendingItem || this.#touchPreviewItem || event.sourceCapabilities?.firesTouchEvents) {
      return;
    }

    const mark = event.target.closest(".orchid-charts-mark");
    const index = this.#items.indexOf(mark);

    if (index === -1) {
      this.#restoreSelection();

      return;
    }

    this.#showPreview(mark, index);
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
    return chartMark(item)?.visualElement ?? item;
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
    this.#restoreSelection(item);
  }

  /**
   * Restores the persistent selection after a pointer or focus preview ends.
   *
   * @param {Element | undefined} [item] - Mark whose transient preview ended.
   * @returns {void} A selected tooltip remains visible until explicit dismissal.
   */
  #restoreSelection(item) {
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
    this.#listen(item, "focus", () => {
      this.#focusedIndex = index;
      this.#onFocusChange?.(index, item);
    });
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

    item.classList.add("orchid-charts-interactive-mark");
    item.classList.toggle("orchid-charts-previewable-mark", this.#previewable);
    item.classList.toggle("orchid-charts-selectable-mark", this.#selectable);
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

    this.#listen(item, "pointerenter", (event) => this.#previewPointerEnter(event, item, index));
    this.#listen(item, "pointerleave", (event) => this.#previewPointerLeave(event, item));
    this.#listen(item, "pointerdown", (event) => this.#previewPointerDown(event, item, index));
    this.#listen(item, "pointerup", (event) => this.#previewPointerUp(event, item, index));
    this.#listen(item, "pointercancel", (event) => this.#previewPointerCancel(event, item));
    this.#listen(item, "focus", () => {
      if (item !== this.#touchPendingItem) {
        this.#showPreview(item, index);
      }
    });
    this.#listen(item, "blur", () => {
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
      this.#listen(item, "pointerdown", () => this.#toggleVisualState(item, PRESSED_CLASS, true));
      this.#listen(item, "pointerup", () => this.#toggleVisualState(item, PRESSED_CLASS, false));
      this.#listen(item, "pointercancel", () => this.#toggleVisualState(item, PRESSED_CLASS, false));
      this.#listen(item, "click", () => {
        this.#clearTouchPreview();
        this.#updateSelection(index);
      });

      return;
    }

    this.#listen(item, "pointerdown", (event) => {
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
    this.#listen(item, "keydown", (event) => this.#handleKeydown(event, index));
    this.#listen(item, "keyup", () => this.#toggleVisualState(item, PRESSED_CLASS, false));
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
      this.dismiss();
    }
  }
}
