import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { page } from "vitest/browser";

import labMarkup from "../demo/lab.html?raw";
import "../demo/style.css";
import "../demo/lab.css";

const expectedGroups = {
  line: 8,
  bar: 7,
  mixed: 2,
  xy: 2,
  radial: 5,
  time: 2,
  background: 12,
};

async function settle() {
  await document.fonts.ready;
  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

beforeAll(async () => {
  await page.viewport(1280, 900);
  const lab = new DOMParser().parseFromString(labMarkup, "text/html");
  document.body.className = lab.body.className;
  document.body.innerHTML = `${lab.querySelector("main").outerHTML}${lab.querySelector("footer").outerHTML}`;
  await import("../demo/Main.js");
  await settle();
});

afterAll(async () => {
  await page.viewport(1280, 720);
});

describe("QA chart laboratory", () => {
  it("groups every fixture once and renders it through the public demo entry", () => {
    const groups = [
      ...document.querySelectorAll("[data-fixture-group]"),
    ];
    const fixtures = [
      ...document.querySelectorAll("[data-fixture]"),
    ];
    const fixtureNames = fixtures.map((fixture) => fixture.dataset.fixture);

    expect(
      Object.fromEntries(
        groups.map((group) => [
          group.dataset.fixtureGroup,
          group.querySelectorAll("[data-fixture]").length,
        ]),
      ),
    ).toEqual(expectedGroups);
    expect(fixtures).toHaveLength(38);
    expect(new Set(fixtureNames).size).toBe(fixtures.length);
    expect(document.querySelectorAll(".lab-index a")).toHaveLength(groups.length);

    for (const fixture of fixtures) {
      const host = fixture.querySelector(`#${CSS.escape(fixture.dataset.fixture)}`);
      expect(host, fixture.dataset.fixture).not.toBeNull();
      expect(host.querySelector("svg"), fixture.dataset.fixture).not.toBeNull();
    }
  });

  it("keeps every boundary SVG flush with its zero-padding background host", () => {
    const hosts = document.querySelectorAll(".lab-boundary");
    const expectedBackground = getComputedStyle(document.body).backgroundColor;

    expect(hosts).toHaveLength(12);

    for (const host of hosts) {
      const hostBounds = host.getBoundingClientRect();
      const svgBounds = host.querySelector("svg").getBoundingClientRect();

      expect(getComputedStyle(host).backgroundColor, host.id).toBe(expectedBackground);
      expect(getComputedStyle(host).padding, host.id).toBe("0px");
      expect(svgBounds.left, host.id).toBeCloseTo(hostBounds.left, 1);
      expect(svgBounds.right, host.id).toBeCloseTo(hostBounds.right, 1);
      expect(svgBounds.top, host.id).toBeCloseTo(hostBounds.top, 1);
      expect(svgBounds.bottom, host.id).toBeCloseTo(hostBounds.bottom, 1);
    }
  });

  it("keeps every fixture inside its card at the QA mobile viewport", async () => {
    await page.viewport(390, 900);
    await settle();

    const overflowing = [
      ...document.querySelectorAll("[data-fixture]"),
    ].flatMap((fixture) => {
      const fixtureBounds = fixture.getBoundingClientRect();
      const host = fixture.querySelector(`[id="${CSS.escape(fixture.dataset.fixture)}"]`);
      const hostBounds = host.getBoundingClientRect();
      const isInside =
        hostBounds.left >= fixtureBounds.left - 0.5 && hostBounds.right <= fixtureBounds.right + 0.5;
      return isInside
        ? []
        : [
            fixture.dataset.fixture,
          ];
    });

    expect(overflowing).toEqual([]);
  });
});
