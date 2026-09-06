import { expect, it, vi } from "vitest";

import InteractionController from "../../src/core/InteractionController.js";
import SvgSurface from "../../src/renderers/SvgSurface.js";
import { chartMark } from "../../src/support/ChartMark.js";
import { svg } from "../../src/support/Dom.js";

it.each([true, false])("links an explicit visual peer independently of append order: %s", (hitFirst) => {
  const root = svg("svg");
  const surface = new SvgSurface(root);
  const visual = svg("circle", { cx: 10, cy: 10, r: 3 });
  if (!hitFirst) {
    surface.append(visual);
  }
  const hit = surface.mark(
    "circle",
    { cx: 10, cy: 10, r: 22 },
    {
      dataset: 0,
      point: 2,
      visualElement: visual,
      title: "Name: with punctuation",
      tooltip: { heading: "Heading", items: [] },
      anchor: { x: 10, y: 10 },
    },
  );
  if (hitFirst) {
    surface.append(visual);
  }
  const controller = new InteractionController(
    [hit],
    { root },
    {
      labelFor: (element) => chartMark(element).label,
      onShow: vi.fn(),
      onHide: vi.fn(),
      onActiveChange: vi.fn(),
    },
  );
  hit.dataset.pointIndex = "999";
  hit.dataset.tooltipAnchorX = "999";
  hit.dispatchEvent(new PointerEvent("pointerenter"));
  expect(visual.classList.contains("is-hovered")).toBe(true);
  expect(chartMark(hit)).toMatchObject({
    pointIndex: 2,
    label: "Name: with punctuation",
    anchor: { x: 10, y: 10 },
  });
  controller.destroy();
});
