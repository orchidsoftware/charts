import { expect, it } from "vitest";

import { svg, titled } from "../../src/support/Dom.js";

it("can title a decorative SVG element without registering an interactive mark", () => {
  const element = titled(svg("path"), "Summary: 2");
  expect(element.querySelector("title").textContent).toBe("Summary: 2");
});
