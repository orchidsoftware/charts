import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";

import demoMarkup from "../demo/index.html?raw";

import {
  demoCards,
  responsiveCards,
  sharedMixedCards,
  demoXYCards,
  demoCompositionCards,
  demoSections,
  stateFixtures,
  stateVariants,
} from "./support/VisualFixtures.js";
import "../demo/style.css";
import "../src/styles.css";

const screenshotOptions = {
  comparatorName: "pixelmatch",
  comparatorOptions: {
    allowedMismatchedPixelRatio: 0.0005,
    threshold: 0.1,
  },
  timeout: 10_000,
};

const charts = [];

const sharedActiveAppearance = new Set([
  "bubble",
  "heatmap",
  "horizontal-bar",
  "line",
  "mixed",
  "mixed-dual-axis",
  "percentage",
  "pie",
  "radar",
  "scatter",
  "timesheet",
]);

const interactionStates = stateFixtures.flatMap(([name]) =>
  stateVariants.map((variant) => ({ name, variant })),
);
const hasEquivalentAppearance = ({ name, variant }) =>
  variant === "keyboard-active" && sharedActiveAppearance.has(name);
const screenshotStates = interactionStates.filter((state) => !hasEquivalentAppearance(state));
const equivalentStates = interactionStates.filter((state) => hasEquivalentAppearance(state));

function setTheme(theme) {
  const isDark = theme === "dark";
  const tokens = isDark
    ? {
        "--orchid-charts-demo-ink": "#f2f2f7",
        "--orchid-charts-demo-muted": "#aeaeb2",
        "--orchid-charts-demo-border": "#38383a",
        "--orchid-charts-demo-surface": "#1c1c1e",
        "--orchid-charts-demo-background": "#000000",
        "--orchid-charts-demo-elevated": "#1c1c1e",
        "--orchid-charts-label-color": "#f2f2f7",
        "--orchid-charts-secondary-label-color": "#aeaeb2",
        "--orchid-charts-axis-line-color": "#3a3a3c",
        "--orchid-charts-tooltip-bg": "rgba(44, 44, 46, .96)",
        "--orchid-charts-tooltip-value": "#ffffff",
        "--orchid-charts-mark-separator": "#1c1c1e",
        "--orchid-charts-point-fill": "#1c1c1e",
      }
    : {
        "--orchid-charts-demo-ink": "#192734",
        "--orchid-charts-demo-muted": "#6c7680",
        "--orchid-charts-demo-border": "#e2e6e9",
        "--orchid-charts-demo-surface": "#f8f9fa",
        "--orchid-charts-demo-background": "#ffffff",
        "--orchid-charts-demo-elevated": "#ffffff",
        "--orchid-charts-label-color": "#3a3a3c",
        "--orchid-charts-secondary-label-color": "#6e6e73",
        "--orchid-charts-axis-line-color": "#e5e5ea",
        "--orchid-charts-tooltip-bg": "rgba(255, 255, 255, .96)",
        "--orchid-charts-tooltip-value": "#1d1d1f",
        "--orchid-charts-mark-separator": "#ffffff",
        "--orchid-charts-point-fill": "#ffffff",
      };

  document.documentElement.style.colorScheme = theme;
  document.documentElement.style.color = isDark ? "#f2f2f7" : "#192734";
  document.documentElement.style.background = tokens["--orchid-charts-demo-background"];
  for (const [name, value] of Object.entries(tokens)) {
    document.documentElement.style.setProperty(name, value);
  }
}

function demoCard(selector) {
  return document.querySelector(selector).closest("article");
}

function stateCard(name) {
  return document.querySelector(`[data-visual-state='${CSS.escape(name)}']`);
}

function resetInteractionState() {
  document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  if (document.activeElement instanceof HTMLElement || document.activeElement instanceof SVGElement) {
    document.activeElement.blur();
  }
  for (const mark of document.querySelectorAll(".orchid-charts-interactive-mark")) {
    mark.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
    mark.classList.remove("is-hovered", "is-pressed");
  }
  for (const status of document.querySelectorAll(".selection-status")) {
    const statusElement = status;
    statusElement.textContent = "Click a value, or press Enter, to keep its tooltip open.";
  }
}

async function settle() {
  await document.fonts.ready;
  await new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

async function matchScreenshot(element, name) {
  if (element === document.body) {
    await page.viewport(window.innerWidth, document.body.scrollHeight);
    window.scrollTo(0, 0);
  }
  await settle();
  await expect.element(page.elementLocator(element)).toMatchScreenshot(name, screenshotOptions);
}

function activeAppearance(name) {
  const card = stateCard(name);
  const tooltip = card.querySelector(".orchid-charts-tooltip");
  const elements = [...card.querySelectorAll("svg *"), tooltip];
  return elements.map((element) => {
    const style = getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    return {
      text: element.textContent,
      bounds: [bounds.x, bounds.y, bounds.width, bounds.height],
      paint: [
        style.fill,
        style.stroke,
        style.strokeWidth,
        style.opacity,
        style.filter,
        style.transform,
        style.outline,
      ],
      visibility: [style.display, style.visibility],
    };
  });
}

function applyState(name, variant) {
  const card = stateCard(name);
  const marks = [...card.querySelectorAll(".orchid-charts-interactive-mark")];
  const mark = marks[Math.min(1, marks.length - 1)];

  switch (variant) {
    case "hover": {
      mark.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));

      break;
    }
    case "pressed": {
      mark.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
      mark.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

      break;
    }
    case "pointer-active": {
      mark.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      mark.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
      mark.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      break;
    }
    case "keyboard-focus": {
      marks[0].focus();
      marks[0].dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));

      break;
    }
    default: {
      marks[0].focus();
      marks[0].dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
      mark.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
      mark.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "Enter" }));
    }
  }

  expect(mark).toHaveClass("is-hovered");
  expect(card.querySelector(".orchid-charts-tooltip").hidden).toBe(false);
  if (variant === "pressed") {
    expect(mark).toHaveClass("is-pressed");
  }
  if (variant.endsWith("active")) {
    expect(mark).toHaveClass("is-active");
    expect(mark.getAttribute("aria-pressed")).toBe("true");
  }
}

beforeAll(async () => {
  await page.viewport(1280, 900);
  const demo = new DOMParser().parseFromString(demoMarkup, "text/html");
  document.body.innerHTML = demo.querySelector("main").outerHTML;
  document.documentElement.lang = "en";

  const stabilityStyle = document.createElement("style");
  stabilityStyle.textContent = `
    *, *::before, *::after { animation: none !important; caret-color: transparent !important; transition: none !important; }
    html { scroll-behavior: auto !important; }
    .visual-state-lab { width: min(1120px, calc(100% - 40px)); margin: 0 auto 80px; }
    .visual-state-lab > h2 { margin: 0 0 20px; font: 650 28px/1.2 system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
    .visual-state-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    .visual-state-grid article { min-height: 390px; }
    @media (max-width: 760px) { .visual-state-grid { grid-template-columns: 1fr; } }
  `;
  document.head.append(stabilityStyle);
  setTheme("light");
  await import("../demo/Main.js");

  const lab = document.createElement("section");
  lab.className = "visual-state-lab";
  const fixtureMarkup = stateFixtures
    .map(
      ([name]) =>
        `<article data-visual-state="${name}"><header><div><span class="tag">INTERACTION</span><h2>${name}</h2></div><strong>states</strong></header><div data-chart></div></article>`,
    )
    .join("");
  lab.innerHTML = `<h2>Interaction state laboratory</h2><div class="visual-state-grid">${fixtureMarkup}</div>`;
  document.body.append(lab);

  for (const [name, build] of stateFixtures) {
    charts.push(build(stateCard(name).querySelector("[data-chart]")));
  }
  await settle();
});

beforeEach(async () => {
  await page.viewport(1280, 900);
  setTheme("light");
  resetInteractionState();
  await settle();
});

afterAll(async () => {
  for (const chart of charts) {
    chart.destroy();
  }
  await page.viewport(1280, 720);
});

// Existing pixel references capture an ordered viewport/scroll tour.
// Keep that framing stable; independent state equivalence is tested separately.
describe.sequential("visual regression baselines", { shuffle: false }, () => {
  it.each([
    ["light", 1280],
    ["dark", 1280],
    ["light", 390],
    ["dark", 390],
  ])("keeps the radar comparison readable in %s at %ipx", async (theme, width) => {
    await page.viewport(width, 900);
    setTheme(theme);
    const card = demoCard("#radar");
    const mark = card.querySelectorAll(".orchid-charts-radar-axis")[2];
    mark.focus();
    expect(card.querySelectorAll(".orchid-charts-tooltip-row")).toHaveLength(2);
    expect(card.querySelector(".orchid-charts-tooltip-heading").textContent).toBe("Camera");
    await matchScreenshot(card, `radar-comparison-${theme}-${width}`);
  });

  it("keeps the complete desktop light demo stable", async () => {
    await matchScreenshot(document.body, "demo-body-desktop-light");
  });

  it("keeps the complete desktop dark demo stable", async () => {
    setTheme("dark");
    await matchScreenshot(document.body, "demo-body-desktop-dark");
  });

  it("keeps the complete mobile light demo stable", async () => {
    await page.viewport(390, 900);
    await matchScreenshot(document.body, "demo-body-mobile-light");
  });

  for (const [name, selector] of demoCards) {
    it(`keeps the desktop ${name} card stable`, async () => {
      await matchScreenshot(demoCard(selector), `demo-desktop-light-${name}`);
    });
  }

  for (const [name, selector] of sharedMixedCards) {
    it(`keeps the ${name} popover stable`, async () => {
      const card = demoCard(selector);
      const mark = card.querySelectorAll(".orchid-charts-x-hit")[1];
      mark.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));

      expect(card.querySelector(".orchid-charts-tooltip-heading").textContent).not.toBe("");
      expect(card.querySelectorAll(".orchid-charts-tooltip-row")).toHaveLength(3);
      await matchScreenshot(card, name);
    });
  }

  for (const [name, selector, heading, rowCount] of demoXYCards) {
    it(`keeps the ${name} popover stable`, async () => {
      const card = demoCard(selector);
      const mark = card.querySelectorAll(".orchid-charts-x-hit")[1];
      mark.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));

      expect(card.querySelector(".orchid-charts-tooltip-heading").textContent).toBe(heading);
      expect(card.querySelectorAll(".orchid-charts-tooltip-row")).toHaveLength(rowCount);
      await matchScreenshot(card, name);
    });
  }

  for (const [name, selector] of demoCompositionCards) {
    it(`keeps the ${name} popover stable`, async () => {
      const card = demoCard(selector);
      const mark = card.querySelectorAll(".orchid-charts-mark")[1];
      mark.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));

      expect(mark).toHaveClass("is-hovered");
      expect(card.querySelectorAll(".orchid-charts-tooltip-row")).toHaveLength(1);
      await matchScreenshot(card, name);
    });
  }

  for (const [name, selector] of demoSections) {
    it(`keeps the desktop ${name} section stable`, async () => {
      if (name === "composition-and-activity") {
        await page.viewport(1280, 1200);
      }
      await matchScreenshot(document.querySelector(selector), `demo-section-light-${name}`);
    });
  }

  for (const [name, selector] of responsiveCards) {
    it(`keeps the mobile ${name} card stable`, async () => {
      await page.viewport(390, 900);
      await matchScreenshot(demoCard(selector), `demo-mobile-light-${name}`);
    });

    it(`keeps the dark ${name} card stable`, async () => {
      setTheme("dark");
      await matchScreenshot(demoCard(selector), `demo-desktop-dark-${name}`);
    });
  }

  it.each(screenshotStates)("keeps $name $variant feedback stable", async ({ name, variant }) => {
    applyState(name, variant);
    await matchScreenshot(stateCard(name), `interaction-${name}-${variant}`);
  });
});

describe.sequential("selection appearance equivalence", () => {
  it.each(equivalentStates)(
    "keeps $name keyboard-active equivalent to pointer selection",
    async ({ name }) => {
      stateCard(name).scrollIntoView({ block: "center" });
      await settle();
      applyState(name, "pointer-active");
      const position = { left: window.scrollX, top: window.scrollY };
      const pointerAppearance = activeAppearance(name);
      resetInteractionState();
      applyState(name, "keyboard-active");
      window.scrollTo(position);
      await settle();
      expect(activeAppearance(name)).toEqual(pointerAppearance);
    },
  );
});
