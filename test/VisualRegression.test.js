import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";

import demoMarkup from "../demo/index.html?raw";

import "../demo/style.css";

import createChart from "./support/MountChart.js";

const screenshotOptions = {
  comparatorName: "pixelmatch",
  comparatorOptions: {
    allowedMismatchedPixelRatio: 0.0005,
    threshold: 0.1,
  },
  timeout: 10_000,
};

const demoCards = [
  [
    "line",
    "#line",
  ],
  [
    "line-gradient",
    "#line-gradient",
  ],
  [
    "bar-vertical",
    "#bar-vertical",
  ],
  [
    "bar-horizontal",
    "#bar-horizontal",
  ],
  [
    "bar-horizontal-stacked",
    "#bar-horizontal-stacked",
  ],
  [
    "scatter",
    "#scatter",
  ],
  [
    "bubble",
    "#bubble",
  ],
  [
    "radar",
    "#radar",
  ],
  [
    "polar",
    "#polar",
  ],
  [
    "mixed",
    "#mixed",
  ],
  [
    "axis-mixed-signed",
    "#mixed-signed",
  ],
  [
    "pie",
    "#pie",
  ],
  [
    "donut",
    "#donut",
  ],
  [
    "percentage",
    "#percentage",
  ],
  [
    "timesheet",
    "#timesheet",
  ],
  [
    "heatmap",
    "#heatmap",
  ],
  [
    "spark-line",
    "#spark-line",
  ],
  [
    "spark-area",
    "#spark-area",
  ],
  [
    "spark-bar",
    "#spark-bar",
  ],
];

const responsiveCards = [
  [
    "bubble",
    "#bubble",
  ],
  [
    "line",
    "#line",
  ],
  [
    "bar-horizontal",
    "#bar-horizontal",
  ],
  [
    "radar",
    "#radar",
  ],
  [
    "percentage",
    "#percentage",
  ],
  [
    "timesheet",
    "#timesheet",
  ],
  [
    "heatmap",
    "#heatmap",
  ],
];

const sharedMixedCards = [
  [
    "mixed-shared-hover",
    "#mixed",
  ],
  [
    "mixed-dual-axis-shared-hover",
    "#mixed-signed",
  ],
];

const demoXYCards = [
  [
    "scatter-real-hover",
    "#scatter",
    "$799",
    2,
  ],
  [
    "bubble-real-hover",
    "#bubble",
    "Music",
    1,
  ],
];

const demoCompositionCards = [
  [
    "pie-real-hover",
    "#pie",
  ],
  [
    "donut-real-hover",
    "#donut",
  ],
  [
    "percentage-real-hover",
    "#percentage",
  ],
];

const demoSections = [
  [
    "supported-families",
    "#supported-charts",
  ],
  [
    "trends-and-targets",
    "#gallery",
  ],
  [
    "compare-and-diagnose",
    "section[aria-labelledby='comparison-title']",
  ],
  [
    "composition-and-activity",
    "section[aria-labelledby='composition-title']",
  ],
];

const stateFixtures = [
  [
    "line",
    {
      type: "line",
      data: {
        labels: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
        ],
        datasets: [
          {
            name: "Actual",
            values: [
              18,
              31,
              27,
              44,
              39,
              56,
            ],
          },
          {
            name: "Plan",
            values: [
              20,
              25,
              31,
              37,
              44,
              50,
            ],
          },
        ],
      },
    },
  ],
  [
    "horizontal-bar",
    {
      type: "bar",
      orientation: "horizontal",
      data: {
        labels: [
          "Europe",
          "Americas",
          "Asia-Pacific",
          "Africa",
        ],
        datasets: [
          {
            name: "Standard",
            values: [
              36,
              42,
              54,
              61,
            ],
          },
          {
            name: "Express",
            values: [
              16,
              18,
              24,
              28,
            ],
          },
        ],
      },
    },
  ],
  [
    "pie",
    {
      type: "pie",
      data: {
        labels: [
          "Search",
          "Direct",
          "Referrals",
        ],
        datasets: [
          {
            values: [
              48,
              34,
              18,
            ],
          },
        ],
      },
    },
  ],
  [
    "donut",
    {
      type: "donut",
      data: {
        labels: [
          "Individual",
          "Family",
          "Student",
        ],
        datasets: [
          {
            values: [
              61,
              27,
              12,
            ],
          },
        ],
      },
    },
  ],
  [
    "percentage",
    {
      type: "percentage",
      data: {
        labels: [
          "Photos",
          "Apps",
          "Free",
        ],
        datasets: [
          {
            values: [
              72,
              58,
              64,
            ],
          },
        ],
      },
    },
  ],
  [
    "scatter",
    {
      type: "scatter",
      data: {
        datasets: [
          {
            name: "Phone",
            values: [
              { x: 1, y: 18 },
              { x: 2, y: 24 },
            ],
          },
          {
            name: "Tablet",
            values: [
              { x: 1, y: 24 },
              { x: 2, y: 31 },
            ],
          },
        ],
      },
    },
  ],
  [
    "bubble",
    {
      type: "bubble",
      data: {
        datasets: [
          {
            name: "Apps",
            values: [
              { x: 1, y: 78, r: 18 },
              { x: 2, y: 52, r: 10 },
            ],
          },
        ],
      },
    },
  ],
  [
    "mixed",
    {
      type: "mixed",
      data: {
        labels: [
          "W1",
          "W2",
          "W3",
        ],
        datasets: [
          {
            name: "Actual",
            chartType: "bar",
            values: [
              28,
              37,
              34,
            ],
          },
          {
            name: "Plan",
            chartType: "line",
            values: [
              32,
              35,
              39,
            ],
          },
        ],
      },
    },
  ],
  [
    "mixed-dual-axis",
    {
      type: "mixed",
      yAxisPosition: "right",
      data: {
        labels: [
          "Mon",
          "Tue",
          "Wed",
        ],
        datasets: [
          {
            name: "Change",
            chartType: "bar",
            values: [
              -18,
              9,
              -6,
            ],
          },
          {
            name: "Trend",
            chartType: "line",
            values: [
              -8,
              -4,
              -2,
            ],
          },
        ],
      },
    },
  ],
  [
    "radar",
    {
      type: "radar",
      data: {
        labels: [
          "Speed",
          "Battery",
          "Camera",
          "Display",
          "Value",
        ],
        datasets: [
          {
            name: "Current",
            values: [
              92,
              84,
              89,
              91,
              72,
            ],
          },
          {
            name: "Previous",
            values: [
              74,
              77,
              71,
              78,
              81,
            ],
          },
        ],
      },
    },
  ],
  [
    "timesheet",
    {
      type: "timesheet",
      data: {
        start: "2026-09-01T00:00:00Z",
        end: "2026-09-10T00:00:00Z",
        tasks: [
          { label: "Design", start: "2026-09-01T00:00:00Z", end: "2026-09-03T00:00:00Z", group: "Product" },
          {
            label: "Implementation",
            start: "2026-09-03T00:00:00Z",
            end: "2026-09-07T00:00:00Z",
            group: "Engineering",
          },
          {
            label: "Release",
            start: "2026-09-07T00:00:00Z",
            end: "2026-09-10T00:00:00Z",
            group: "Distribution",
          },
        ],
      },
    },
  ],
  [
    "heatmap",
    {
      type: "heatmap",
      countLabel: "events",
      data: {
        start: new Date("2026-01-01T00:00:00Z"),
        end: new Date("2026-03-31T00:00:00Z"),
        points: Object.fromEntries(
          Array.from({ length: 90 }, (_, index) => {
            const date = new Date(Date.UTC(2026, 0, index + 1)).toISOString().slice(0, 10);
            return [
              date,
              (index * 7 + (index % 5)) % 13,
            ];
          }),
        ),
      },
    },
  ],
];

const stateVariants = [
  "hover",
  "pressed",
  "pointer-active",
  "keyboard-focus",
  "keyboard-active",
];
const charts = [];

function setTheme(theme) {
  const isDark = theme === "dark";
  const tokens = isDark
    ? {
        "--charts2-demo-ink": "#f2f2f7",
        "--charts2-demo-muted": "#aeaeb2",
        "--charts2-demo-border": "#38383a",
        "--charts2-demo-surface": "#1c1c1e",
        "--charts2-demo-background": "#000000",
        "--charts2-demo-elevated": "#1c1c1e",
        "--charts-label-color": "#f2f2f7",
        "--charts-secondary-label-color": "#aeaeb2",
        "--charts-axis-line-color": "#3a3a3c",
        "--charts-tooltip-bg": "rgba(44, 44, 46, .96)",
        "--charts-tooltip-value": "#ffffff",
        "--charts-mark-separator": "#1c1c1e",
        "--charts-point-fill": "#1c1c1e",
      }
    : {
        "--charts2-demo-ink": "#192734",
        "--charts2-demo-muted": "#6c7680",
        "--charts2-demo-border": "#e2e6e9",
        "--charts2-demo-surface": "#f8f9fa",
        "--charts2-demo-background": "#ffffff",
        "--charts2-demo-elevated": "#ffffff",
        "--charts-label-color": "#3a3a3c",
        "--charts-secondary-label-color": "#6e6e73",
        "--charts-axis-line-color": "#e5e5ea",
        "--charts-tooltip-bg": "rgba(255, 255, 255, .96)",
        "--charts-tooltip-value": "#1d1d1f",
        "--charts-mark-separator": "#ffffff",
        "--charts-point-fill": "#ffffff",
      };

  document.documentElement.style.colorScheme = theme;
  document.documentElement.style.color = isDark ? "#f2f2f7" : "#192734";
  document.documentElement.style.background = tokens["--charts2-demo-background"];
  for (const [
    name,
    value,
  ] of Object.entries(tokens)) {
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
  for (const mark of document.querySelectorAll(".charts2-interactive-mark")) {
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
  await settle();
  await expect.element(page.elementLocator(element)).toMatchScreenshot(name, screenshotOptions);
}

function applyState(name, variant) {
  const card = stateCard(name);
  const marks = [
    ...card.querySelectorAll(".charts2-interactive-mark"),
  ];
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
  expect(card.querySelector(".charts2-tooltip").hidden).toBe(false);
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
    .visual-state-lab > h2 { margin: 0 0 20px; font: 650 28px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
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
      ([
        name,
      ]) =>
        `<article data-visual-state="${name}"><header><div><span class="tag">INTERACTION</span><h2>${name}</h2></div><strong>states</strong></header><div data-chart></div></article>`,
    )
    .join("");
  lab.innerHTML = `<h2>Interaction state laboratory</h2><div class="visual-state-grid">${fixtureMarkup}</div>`;
  document.body.append(lab);

  for (const [
    name,
    options,
  ] of stateFixtures) {
    charts.push(
      createChart(stateCard(name).querySelector("[data-chart]"), {
        height: name === "heatmap" ? undefined : 300,
        ariaLabel: `${name} interaction fixture`,
        onSelect: () => {},
        ...options,
      }),
    );
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

describe.sequential("visual regression baselines", () => {
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

  for (const [
    name,
    selector,
  ] of demoCards) {
    it(`keeps the desktop ${name} card stable`, async () => {
      await matchScreenshot(demoCard(selector), `demo-desktop-light-${name}`);
    });
  }

  for (const [
    name,
    selector,
  ] of sharedMixedCards) {
    it(`keeps the ${name} popover stable`, async () => {
      const card = demoCard(selector);
      const mark = card.querySelectorAll(".charts2-x-hit")[1];
      mark.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));

      expect(card.querySelector(".charts2-tooltip-heading").textContent).not.toBe("");
      expect(card.querySelectorAll(".charts2-tooltip-row")).toHaveLength(3);
      await matchScreenshot(card, name);
    });
  }

  for (const [
    name,
    selector,
    heading,
    rowCount,
  ] of demoXYCards) {
    it(`keeps the ${name} popover stable`, async () => {
      const card = demoCard(selector);
      const mark = card.querySelectorAll(".charts2-x-hit")[1];
      mark.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));

      expect(card.querySelector(".charts2-tooltip-heading").textContent).toBe(heading);
      expect(card.querySelectorAll(".charts2-tooltip-row")).toHaveLength(rowCount);
      await matchScreenshot(card, name);
    });
  }

  for (const [
    name,
    selector,
  ] of demoCompositionCards) {
    it(`keeps the ${name} popover stable`, async () => {
      const card = demoCard(selector);
      const mark = card.querySelectorAll(".charts2-mark")[1];
      mark.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));

      expect(mark).toHaveClass("is-hovered");
      expect(card.querySelectorAll(".charts2-tooltip-row")).toHaveLength(1);
      await matchScreenshot(card, name);
    });
  }

  for (const [
    name,
    selector,
  ] of demoSections) {
    it(`keeps the desktop ${name} section stable`, async () => {
      if (name === "composition-and-activity") {
        await page.viewport(1280, 1200);
      }
      await matchScreenshot(document.querySelector(selector), `demo-section-light-${name}`);
    });
  }

  for (const [
    name,
    selector,
  ] of responsiveCards) {
    it(`keeps the mobile ${name} card stable`, async () => {
      await page.viewport(390, 900);
      await matchScreenshot(demoCard(selector), `demo-mobile-light-${name}`);
    });

    it(`keeps the dark ${name} card stable`, async () => {
      setTheme("dark");
      await matchScreenshot(demoCard(selector), `demo-desktop-dark-${name}`);
    });
  }

  for (const [
    name,
  ] of stateFixtures) {
    for (const variant of stateVariants) {
      it(`keeps ${name} ${variant} feedback stable`, async () => {
        applyState(name, variant);
        await matchScreenshot(stateCard(name), `interaction-${name}-${variant}`);
      });
    }
  }
});
