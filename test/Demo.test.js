import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";

import examplesSource from "../demo/Examples.js?raw";
import demoMarkup from "../demo/index.html?raw";
import mainSource from "../demo/Main.js?raw";
import "../demo/style.css";

const showcaseIds = [
  "line",
  "line-gradient",
  "line-region",
  "line-marker",
  "bar-vertical",
  "bar-horizontal",
  "bar-horizontal-stacked",
  "scatter",
  "bubble",
  "radar",
  "polar",
  "mixed",
  "mixed-signed",
  "pie",
  "donut",
  "percentage",
  "timesheet",
];
const stressIds = [
  "fractions",
  "large-values",
  "absurd-labels",
  "negative-bars",
  "signed-lines",
  "dense-line",
  "flat-values",
];
const auxiliaryIds = [
  "heatmap",
  "spark-line",
  "spark-area",
  "spark-bar",
];

beforeEach(() => {
  const cards = [
    ...showcaseIds,
    ...stressIds,
    ...auxiliaryIds,
  ]
    .map(
      (id) =>
        `<article style="box-sizing:border-box;width:362px;padding:24px;border:1px solid transparent"><header><div>${id}</div></header><div id="${id}"></div></article>`,
    )
    .join("");
  document.body.innerHTML = `<span id="bundle-size-value"></span><span id="bundle-size-gzip"></span><button id="shuffle">Update showcase data</button><main style="width:362px">${cards}</main>`;
});

afterEach(async () => {
  await page.viewport(1280, 720);
});

describe("real-world demo", () => {
  it("uses direct fluent builders as the only demo authoring grammar", () => {
    expect(examplesSource.match(/\.make\(/g)).toHaveLength(45);
    for (const legacyAdapter of [
      "commonBuilder",
      "seriesBuilder",
      "datasetBuilder",
      "typeBuilder",
      "mountFluentChart",
      "mountChart",
      "showcaseSpecs",
      "qualitySpecs",
      "options.type",
    ]) {
      expect(mainSource).not.toContain(legacyAdapter);
      expect(examplesSource).not.toContain(legacyAdapter);
    }
  });

  it("introduces every supported chart family before the gallery", () => {
    const demo = new DOMParser().parseFromString(demoMarkup, "text/html");
    const brand = demo.querySelector(".brand");
    const overview = demo.querySelector("#supported-charts");
    const families = [
      ...overview.querySelectorAll(":scope > .support-families > .support-family"),
    ];
    const links = [
      ...overview.querySelectorAll(".support-types a"),
    ];

    expect(brand).toHaveAttribute("aria-label", "Orchid Charts by Orchid, home");
    expect(brand.querySelector(".brand-mark").tagName).toBe("svg");
    expect(brand.querySelectorAll(".brand-mark path")).toHaveLength(2);
    expect(demo.querySelector("nav a").getAttribute("href")).toBe("#supported-charts");
    expect(families.map((family) => family.querySelector("h3").textContent)).toEqual([
      "Cartesian",
      "Radial",
      "Time",
      "Calendar",
    ]);
    expect(links).toHaveLength(14);
    expect(links.every((link) => demo.querySelector(link.getAttribute("href")))).toBe(true);
    expect(links.every((link) => link.querySelector("svg").getAttribute("aria-hidden") === "true")).toBe(
      true,
    );
  });

  it("varies showcase density while keeping the complete quality matrix immutable", async () => {
    await page.viewport(390, 900);
    const { qualityExamples, showcaseExamples } = await import("../demo/Examples.js");
    await import("../demo/Main.js");

    expect(showcaseExamples).toHaveLength(17);
    expect(qualityExamples).toHaveLength(11);
    expect(document.querySelectorAll(".selection-status")).toHaveLength(1);
    expect(document.querySelector(".selection-status-summary").textContent).toBe("Dec");
    expect(document.querySelector("#bundle-size-value").textContent).toMatch(/^\d+\.\d kB$/);
    expect(document.querySelector("#bundle-size-gzip").textContent).toMatch(/^\(\d+\.\d kB gzip\)$/);
    expect(document.querySelector("#line svg").getAttribute("height")).toBe("320");
    expect(document.querySelectorAll("#line .orchid-charts-grid-vertical")).toHaveLength(0);
    expect(document.querySelectorAll("#line .orchid-charts-grid-horizontal").length).toBeGreaterThan(0);
    expect(document.querySelector("#percentage svg").getAttribute("height")).toBe("80");
    expect(document.querySelector("#radar svg").getAttribute("height")).toBe("320");
    expect(document.querySelector("#fractions svg").getAttribute("height")).toBe("280");
    expect(document.querySelector("#line-region .orchid-charts-region").getAttribute("fill")).toBe("#248a3d");
    expect(document.querySelector("#line-marker .orchid-charts-marker").getAttribute("stroke")).toBe(
      "#ff3b30",
    );
    expect(
      document.querySelector("#line-marker .orchid-charts-marker").getAttribute("stroke-dasharray"),
    ).not.toBe("");
    expect(document.querySelectorAll(".orchid-charts-annotation-background")).toHaveLength(0);
    expect(
      getComputedStyle(document.querySelector("#line-marker .orchid-charts-annotation")).fontWeight,
    ).toBe("500");
    expect(getComputedStyle(document.querySelector("#line-region .orchid-charts-annotation")).fontSize).toBe(
      "12px",
    );
    const region = document.querySelector("#line-region .orchid-charts-region").getBBox();
    const regionLabel = document.querySelector("#line-region .orchid-charts-region-label");
    const regionLabelBounds = regionLabel.getBBox();
    const marker = document.querySelector("#line-marker .orchid-charts-marker");
    const markerLabel = document.querySelector("#line-marker .orchid-charts-marker-label");

    expect(regionLabelBounds.y).toBeGreaterThan(region.y);
    expect(regionLabelBounds.y + regionLabelBounds.height).toBeLessThan(region.y + region.height);
    expect(Number(markerLabel.getAttribute("y"))).toBeLessThan(Number(marker.getAttribute("y1")));
    expect(markerLabel.getAttribute("text-anchor")).toBe("start");
    expect(getComputedStyle(regionLabel).fillOpacity).toBe("1");
    expect(getComputedStyle(regionLabel).opacity).toBe("1");
    expect(getComputedStyle(regionLabel).paintOrder).toBe("stroke");
    expect(getComputedStyle(markerLabel).fontVariantNumeric).toContain("tabular-nums");
    expect(document.querySelectorAll(".orchid-charts-annotation-sample")).toHaveLength(0);

    const localizedLabels = [
      ...document.querySelectorAll("#absurd-labels .orchid-charts-multiline-label"),
    ];
    expect(
      localizedLabels.map((label) =>
        [
          ...label.querySelectorAll("tspan"),
        ].map((line) => line.textContent),
      ),
    ).toEqual([
      [
        "Manual verification",
        "after inconclusive",
        "compliance review",
      ],
      [
        "Партнёрские интеграции",
        "проверка доступности",
        "и локализации",
      ],
      [
        "顧客向け分析",
        "プラットフォーム",
        "段階的な移行",
      ],
      [
        "طلبات المؤسسات",
        "مراجعة يدوية إضافية",
        "قبل الموافقة النهائية",
      ],
    ]);
    expect(localizedLabels.every((label) => !label.textContent.includes("…"))).toBe(true);
    expect(
      [
        ...document.querySelectorAll("#large-values .orchid-charts-multiline-label"),
      ].map((label) => label.querySelectorAll("tspan").length),
    ).toEqual([
      2,
      2,
      2,
    ]);

    const cards = [
      ...document.querySelectorAll("article"),
    ];
    const overflow = cards.flatMap((article) => {
      const articleRight = article.getBoundingClientRect().right;
      const visible = [
        ...article.querySelectorAll(
          "svg path, svg line, svg rect, svg circle, svg polygon, svg polyline, svg text",
        ),
      ].filter((element) => {
        const style = getComputedStyle(element);
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number(style.opacity) !== 0 &&
          element.getAttribute("fill") !== "transparent"
        );
      });
      const visibleRight = Math.max(
        article.getBoundingClientRect().left,
        ...visible.map((element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.right;
        }),
      );
      return visibleRight <= articleRight + 0.5
        ? []
        : [
            { id: article.querySelector("div").id, visibleRight, articleRight },
          ];
    });
    expect(cards).toHaveLength(28);
    expect(overflow).toEqual([]);
    expect(document.querySelectorAll(".example-code-copy")).toHaveLength(cards.length);
    for (const card of cards) {
      const host = card.querySelector("div[id]");
      const button = card.querySelector(":scope > header .example-code-copy");

      expect(button).toHaveAttribute("aria-label", `Copy code for #${host.id}`);
      expect(button).toHaveAttribute("title", "Copy code");
      expect(button.querySelector("svg")).not.toBeNull();
    }
    const timesheetSvg = document.querySelector("#timesheet svg");
    const timesheetBounds = timesheetSvg.getBoundingClientRect();
    expect(timesheetSvg.querySelectorAll(".orchid-charts-timesheet-bar")).toHaveLength(6);
    expect(
      Math.max(
        ...[
          ...timesheetSvg.querySelectorAll(
            ".orchid-charts-timesheet-task-label, .orchid-charts-timesheet-tick",
          ),
        ].map((label) => label.getBoundingClientRect().right),
      ),
    ).toBeLessThanOrEqual(timesheetBounds.right);
    expect(document.querySelector("#heatmap svg").style.minWidth).toBe("");
    const heatmapHost = document.querySelector("#heatmap");
    const heatmapCells = [
      ...heatmapHost.querySelectorAll(".orchid-charts-heat-cell"),
    ];
    expect(heatmapHost).not.toHaveClass("orchid-charts-scrollable-heatmap");
    expect(heatmapHost.scrollWidth).toBe(heatmapHost.clientWidth);
    expect(
      heatmapCells.every((cell) => {
        const bounds = cell.getBoundingClientRect();
        return Math.abs(bounds.width - bounds.height) < 0.01;
      }),
    ).toBe(true);
    expect(heatmapHost.querySelectorAll(".orchid-charts-heat-cell.orchid-charts-mark")).toHaveLength(
      heatmapCells.length,
    );
    heatmapCells.at(-1).focus();
    const heatmapHostBounds = heatmapHost.getBoundingClientRect();
    const heatmapTooltipBounds = heatmapHost.querySelector(".orchid-charts-tooltip").getBoundingClientRect();
    expect(heatmapTooltipBounds.left).toBeGreaterThanOrEqual(heatmapHostBounds.left + 4);
    expect(heatmapTooltipBounds.right).toBeLessThanOrEqual(heatmapHostBounds.right - 4);

    const signedMixed = document.querySelector("#mixed-signed svg");
    const signedValueLabels = [
      ...signedMixed.querySelectorAll(".orchid-charts-value-label"),
    ];
    expect(signedValueLabels.every((label) => label.getAttribute("text-anchor") === "start")).toBe(true);
    expect(
      Math.max(...signedValueLabels.map((label) => label.getBoundingClientRect().right)),
    ).toBeLessThanOrEqual(signedMixed.getBoundingClientRect().right);
    const signedLegend = signedMixed.querySelector(".orchid-charts-legend-group").getBoundingClientRect();
    const signedPlotBottom = signedMixed
      .querySelector(".orchid-charts-x-axis")
      .getBoundingClientRect().bottom;
    expect(signedPlotBottom).toBeLessThan(signedLegend.top);

    const polarSvg = document.querySelector("#polar svg");
    const polarBounds = polarSvg.getBoundingClientRect();
    for (const label of polarSvg.querySelectorAll(".orchid-charts-polar-label")) {
      const bounds = label.getBoundingClientRect();
      expect(bounds.left).toBeGreaterThanOrEqual(polarBounds.left + 12);
      expect(bounds.right).toBeLessThanOrEqual(polarBounds.right - 12);
    }

    for (const id of [
      "spark-line",
      "spark-area",
      "spark-bar",
    ]) {
      const svg = document.querySelector(`#${id} svg`);
      expect(svg).not.toHaveClass("orchid-charts-compact-chart");
      expect(svg.querySelector(".orchid-charts-axis")).toBeNull();
      expect(svg.querySelector(".orchid-charts-grid")).toBeNull();
      expect(svg.querySelector(".orchid-charts-label")).toBeNull();
      expect(svg.querySelector(".orchid-charts-legend")).toBeNull();
      expect(svg.querySelector(".orchid-charts-x-hit")).toBeNull();
      expect(svg.querySelector(".orchid-charts-interactive-mark")).toBeNull();
      expect(svg.querySelector("title")).toBeNull();
      expect(document.querySelector(`#${id} .orchid-charts-tooltip`).hidden).toBe(true);
    }

    const storageSegments = [
      ...document.querySelectorAll("#percentage .orchid-charts-percentage-segment"),
    ];
    expect(storageSegments).toHaveLength(6);
    expect(storageSegments.map((segment) => segment.dataset.tooltip)).toEqual([
      "Photos: 72 GB (28%)",
      "Apps: 58 GB (23%)",
      "Messages: 21 GB (8%)",
      "iOS: 18 GB (7%)",
      "System Data: 23 GB (9%)",
      "Free: 64 GB (25%)",
    ]);

    const xyCases = [
      [
        "scatter",
        "$799",
        "Phone",
        "20 h",
      ],
      [
        "bubble",
        "Music",
        "Weekly users",
        "64k · 324 MB, size 18",
      ],
    ];

    for (const [
      id,
      heading,
      name,
      value,
    ] of xyCases) {
      const host = document.querySelector(`#${id}`);
      const hit = host.querySelectorAll(".orchid-charts-x-hit")[1];

      hit.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
      expect(host.querySelector(".orchid-charts-tooltip-heading").textContent).toBe(heading);
      expect(host.querySelector(".orchid-charts-tooltip-row span").textContent).toBe(name);
      expect(host.querySelector(".orchid-charts-tooltip-row strong").textContent).toBe(value);
      expect(host.querySelector(".orchid-charts-point-hit")).toBeNull();
      hit.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
    }

    const stressBefore = stressIds.map((id) => document.querySelector(`#${id} svg`).getHTML());
    const showcaseBefore = document.querySelector("#line .orchid-charts-line").getAttribute("d");
    vi.spyOn(Math, "random").mockReturnValue(0);
    document.querySelector("#shuffle").click();

    expect(document.querySelector("#line .orchid-charts-line").getAttribute("d")).not.toBe(showcaseBefore);
    expect(stressIds.map((id) => document.querySelector(`#${id} svg`).getHTML())).toEqual(stressBefore);
    expect(
      [
        ...document.querySelectorAll(".selection-status dd"),
      ].map((value) => value.textContent),
    ).toEqual([
      "83.52k",
      "61.92k",
      "42.48k",
    ]);
  });
});

function measureLayout(element) {
  const bounds = element.getBoundingClientRect();
  return {
    height: bounds.height,
    y: bounds.y + window.scrollY,
  };
}

describe("demo loading layout", () => {
  it.each([
    1440,
    1024,
    768,
    390,
    320,
  ])("reserves the rendered layout at %ipx", async (width) => {
    await page.viewport(width, 900);
    const demo = new DOMParser().parseFromString(demoMarkup, "text/html");
    document.body.innerHTML = demo.body.getHTML();
    await document.fonts.ready;

    const elements = [
      ...document.querySelectorAll(".demo-chart, #heatmap, article, #install"),
    ];
    const before = elements.map((element) => measureLayout(element));
    for (const link of document.querySelectorAll(".header-cta, .primary-action")) {
      expect(link.getAttribute("href")).toBe("/docs/getting-started.html");
    }

    const { showcaseExamples, heatmapExamples, sparkExamples } = await import("../demo/Examples.js");
    const { showExampleCode } = await import("../demo/ExampleCode.js");
    const examples = [
      ...showcaseExamples,
      ...heatmapExamples,
      ...sparkExamples,
    ];
    for (const [
      selector,
      renderExample,
    ] of examples) {
      if (document.querySelector(selector)) {
        renderExample();
      }
    }
    showExampleCode(examples);
    expect(document.querySelectorAll(".demo-chart > svg, #heatmap > svg")).toHaveLength(21);
    for (const [
      index,
      element,
    ] of elements.entries()) {
      const after = measureLayout(element);
      expect(after.height, `${element.id || element.tagName} height`).toBeCloseTo(before[index].height, 1);
      expect(after.y, `${element.id || element.tagName} position`).toBeCloseTo(before[index].y, 1);
    }

    const status = document.querySelector(".selection-status");
    const initialHeight = status.getBoundingClientRect().height;
    const selectedValues = () =>
      [
        ...status.querySelectorAll("dd"),
      ].map((value) => value.textContent);
    const point = document.querySelector("#line .orchid-charts-x-hit");
    expect(status).toHaveAttribute("role", "status");
    expect(status).toHaveAttribute("aria-atomic", "true");
    expect(status.textContent).toContain("Latest month");
    expect(selectedValues()).toEqual([
      "116k",
      "86k",
      "59k",
    ]);
    point.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(status.textContent).toContain("Selected month");
    expect(status.querySelector(".selection-status-summary").textContent).toBe("Jan");
    expect(selectedValues()).toEqual([
      "48k",
      "36k",
      "22k",
    ]);
    expect(status.getBoundingClientRect().height).toBe(initialHeight);

    point.focus();
    point.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(status.textContent).toContain("Latest month");
    expect(status.querySelector(".selection-status-summary").textContent).toBe("Dec");
    expect(selectedValues()).toEqual([
      "116k",
      "86k",
      "59k",
    ]);
    expect(document.activeElement).toBe(point);
    expect(status.getBoundingClientRect().height).toBe(initialHeight);

    point.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    expect(status.querySelector(".selection-status-summary").textContent).toBe("Feb");
    expect(selectedValues()).toEqual([
      "57k",
      "40k",
      "27k",
    ]);
    expect(status.getBoundingClientRect().height).toBe(initialHeight);
  });
});
