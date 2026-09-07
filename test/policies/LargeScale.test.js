import { expect, it } from "vitest";

import { extent } from "../../src/support/geometry/Scale.js";

it("finds both extrema across a million values without expanding function arguments", () => {
  const values = Array.from({ length: 1_000_000 }, () => 42);
  values[0] = -108;
  values[765_432] = 2048;
  values[999_999] = -4096;
  expect(extent(values)).toEqual([-4096, 2048]);
});
