import { describe, expect, it, vi } from "vitest";

import { measuredTextWidth } from "../../src/support/Dom.js";

describe("DOM support", () => {
  it("reuses one detached canvas context for every text measurement", () => {
    const createElement = document.createElement.bind(document);
    const canvasCreations = { count: 0 };

    const spy = vi.spyOn(document, "createElement").mockImplementation((name, options) => {
      if (name === "canvas") {
        canvasCreations.count += 1;
      }

      return createElement(name, options);
    });

    const narrow = measuredTextWidth("Charts", 11);
    const wide = measuredTextWidth("Charts", 22);
    const repeated = measuredTextWidth("Charts", 11);

    expect(narrow).toBeGreaterThan(0);
    expect(wide).toBeGreaterThan(narrow);
    expect(repeated).toBe(narrow);
    expect(canvasCreations.count).toBe(1);

    spy.mockRestore();
  });
});
