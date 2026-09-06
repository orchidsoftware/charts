import { beforeEach, describe, expect, it } from "vitest";

import InteractionController from "../../src/core/InteractionController.js";

function press(element, key) {
  element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key }));
  element.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key }));
}

beforeEach(() => {
  document.body.replaceChildren();
});

describe("InteractionController", () => {
  it("covers the complete pointer and keyboard state machine", async () => {
    const namespace = "http://www.w3.org/2000/svg";
    const marks = [
      0,
      1,
      2,
    ].map(() => document.createElementNS(namespace, "rect"));
    const shown = [];
    const hidden = [];
    const active = [];
    const callbacks = {
      labelFor: (_mark, index) => `Mark ${index + 1}`,
      onShow: (_mark, label) => {
        shown.push(label);
      },
      onHide: () => {
        hidden.push(true);
      },
      onActiveChange: (index) => {
        active.push(index);
      },
    };
    const setup = (activeIndex) => new InteractionController(marks, { activeIndex }, callbacks);

    const controller = setup(1);
    expect(marks[1].getAttribute("tabindex")).toBe("0");
    expect(marks[1].getAttribute("aria-pressed")).toBe("true");
    marks[1].dispatchEvent(new PointerEvent("pointerenter"));
    marks[1].dispatchEvent(new PointerEvent("pointerdown"));
    expect(marks[1].classList.contains("is-pressed")).toBe(true);
    marks[1].dispatchEvent(new PointerEvent("pointerup"));
    marks[1].dispatchEvent(new PointerEvent("pointercancel"));
    marks[1].dispatchEvent(new PointerEvent("pointerleave"));
    marks[1].focus();
    marks[1].blur();
    expect(shown).toContain("Mark 2");
    expect(hidden).toHaveLength(0);

    press(marks[1], "ArrowLeft");
    expect(marks[0].getAttribute("tabindex")).toBe("0");
    press(marks[0], "ArrowUp");
    expect(marks[2].getAttribute("tabindex")).toBe("0");
    press(marks[2], "Home");
    expect(marks[0].getAttribute("tabindex")).toBe("0");
    press(marks[0], "End");
    expect(marks[2].getAttribute("tabindex")).toBe("0");
    press(marks[2], " ");
    expect(active.at(-1)).toBe(2);
    marks[2].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(active.at(-1)).toBe(2);
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    press(marks[2], "Escape");
    expect(active.at(-1)).toBe(-1);
    expect(hidden.length).toBeGreaterThan(0);
    press(marks[2], "Escape");
    press(marks[2], "PageDown");

    controller.dismiss();
    expect(hidden.length).toBeGreaterThan(0);

    setup(99);
    expect(marks[0].getAttribute("tabindex")).toBe("0");
    const emptyCallbacks = {
      labelFor: () => "",
      onShow: () => {},
      onHide: () => {},
      onActiveChange: () => {},
    };
    const emptyController = new InteractionController([], {}, emptyCallbacks);
    emptyController.dismiss();
  });

  it("falls back safely when an isolated point hit has no visual peer", () => {
    const namespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(namespace, "svg");
    const hit = document.createElementNS(namespace, "circle");
    hit.classList.add("orchid-charts-point-hit");
    hit.dataset.datasetIndex = "0";
    hit.dataset.pointIndex = "0";
    svg.append(hit);
    document.body.append(svg);

    const callbacks = {
      labelFor: () => "Point",
      onShow: () => {},
      onHide: () => {},
      onActiveChange: () => {},
      onFocusChange: () => {},
    };
    const controller = new InteractionController(
      [
        hit,
      ],
      { previewable: true, selectable: false },
      callbacks,
    );

    hit.dispatchEvent(new PointerEvent("pointerenter"));
    hit.dispatchEvent(new PointerEvent("pointerenter"));
    expect(hit).toHaveClass("is-hovered");
    hit.dispatchEvent(new PointerEvent("pointerleave"));
    expect(hit).not.toHaveClass("is-hovered");
    controller.dismiss();
  });

  it("keeps a touch preview visible until dismissal or gesture cancellation", () => {
    const namespace = "http://www.w3.org/2000/svg";
    const marks = [
      document.createElementNS(namespace, "rect"),
      document.createElementNS(namespace, "rect"),
    ];
    const shown = [];
    const hidden = [];
    const controller = new InteractionController(
      marks,
      { previewable: true, selectable: false },
      {
        labelFor: (_mark, index) => `Mark ${index + 1}`,
        onShow: (_mark, label) => {
          shown.push(label);
        },
        onHide: () => {
          hidden.push(true);
        },
        onActiveChange: () => {},
        onFocusChange: () => {},
      },
    );

    marks[0].dispatchEvent(new PointerEvent("pointerenter", { pointerType: "touch" }));
    expect(shown).toHaveLength(0);
    marks[0].dispatchEvent(new PointerEvent("pointerdown", { pointerType: "touch" }));
    expect(shown).toHaveLength(0);
    marks[0].dispatchEvent(new FocusEvent("focus"));
    expect(shown).toHaveLength(0);
    marks[0].dispatchEvent(new PointerEvent("pointerleave", { pointerType: "touch" }));
    marks[0].dispatchEvent(new FocusEvent("blur"));
    marks[0].dispatchEvent(new PointerEvent("pointerup", { pointerType: "touch" }));
    marks[0].dispatchEvent(new PointerEvent("pointerleave", { pointerType: "touch" }));
    expect(marks[0]).toHaveClass("is-hovered");
    expect(shown).toEqual([
      "Mark 1",
    ]);
    expect(hidden).toHaveLength(0);

    marks[1].dispatchEvent(new PointerEvent("pointerdown", { pointerType: "touch" }));
    marks[1].dispatchEvent(new PointerEvent("pointerup", { pointerType: "touch" }));
    expect(marks[0]).not.toHaveClass("is-hovered");
    expect(marks[1]).toHaveClass("is-hovered");
    expect(shown.at(-1)).toBe("Mark 2");
    expect(hidden).toHaveLength(0);

    controller.dismiss();
    expect(marks[1]).not.toHaveClass("is-hovered");
    expect(hidden).toHaveLength(1);

    marks[0].dispatchEvent(new PointerEvent("pointerdown", { pointerType: "touch" }));
    marks[0].dispatchEvent(new PointerEvent("pointercancel", { pointerType: "touch" }));
    expect(marks[0]).not.toHaveClass("is-hovered");
    expect(hidden).toHaveLength(1);
    controller.dismiss();
    expect(hidden).toHaveLength(2);
  });
});
