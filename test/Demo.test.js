import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";

import demoMarkup from "../demo/index.html?raw";
import "../demo/style.css";

const showcaseIds = [
  "line",
  "line-gradient",
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
        `<article style="box-sizing:border-box;width:362px;padding:24px;border:1px solid transparent"><div id="${id}"></div></article>`,
    )
    .join("");
  document.body.innerHTML = `<span id="bundle-size-value"></span><span id="bundle-size-gzip"></span><button id="shuffle">Update showcase data</button><main style="width:362px">${cards}</main>`;
});

afterEach(async () => {
  await page.viewport(1280, 720);
});

describe("real-world demo", () => {
  it("introduces every supported chart family before the gallery", () => {
    const demo = new DOMParser().parseFromString(demoMarkup, "text/html");
    const overview = demo.querySelector("#supported-charts");
    const families = [
      ...overview.querySelectorAll(":scope > .support-families > .support-family"),
    ];
    const links = [
      ...overview.querySelectorAll(".support-types a"),
    ];

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
    const { qualitySpecs, showcaseSpecs } = await import("../demo/Main.js");

    expect(showcaseSpecs).toHaveLength(15);
    expect(qualitySpecs).toHaveLength(7);
    expect(document.querySelectorAll(".selection-status")).toHaveLength(1);
    expect(document.querySelector(".selection-status").textContent).toBe("");
    expect(document.querySelector("#bundle-size-value").textContent).toMatch(/^\d+\.\d kB$/);
    expect(document.querySelector("#bundle-size-gzip").textContent).toMatch(/^\(\d+\.\d kB gzip\)$/);
    expect(document.querySelector("#line svg").getAttribute("height")).toBe("320");
    expect(document.querySelector("#percentage svg").getAttribute("height")).toBe("140");
    expect(document.querySelector("#radar svg").getAttribute("height")).toBe("320");
    expect(document.querySelector("#fractions svg").getAttribute("height")).toBe("280");

    const localizedLabels = [
      ...document.querySelectorAll("#absurd-labels .charts2-multiline-label"),
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
        ...document.querySelectorAll("#large-values .charts2-multiline-label"),
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
          const scroller = element.closest(".charts2-scrollable-heatmap");
          return scroller ? Math.min(bounds.right, scroller.getBoundingClientRect().right) : bounds.right;
        }),
      );
      return visibleRight <= articleRight + 0.5
        ? []
        : [
            { id: article.querySelector("div").id, visibleRight, articleRight },
          ];
    });
    expect(cards).toHaveLength(26);
    expect(overflow).toEqual([]);
    const timesheetSvg = document.querySelector("#timesheet svg");
    const timesheetBounds = timesheetSvg.getBoundingClientRect();
    expect(timesheetSvg.querySelectorAll(".charts2-timesheet-bar")).toHaveLength(6);
    expect(
      Math.max(
        ...[
          ...timesheetSvg.querySelectorAll(".charts2-timesheet-task-label, .charts2-timesheet-tick"),
        ].map((label) => label.getBoundingClientRect().right),
      ),
    ).toBeLessThanOrEqual(timesheetBounds.right);
    expect(document.querySelector("#heatmap svg").style.minWidth).toBe("");
    const heatmapHost = document.querySelector("#heatmap");
    const heatmapCells = [
      ...heatmapHost.querySelectorAll(".charts2-heat-cell"),
    ];
    expect(heatmapHost).toHaveClass("charts2-scrollable-heatmap");
    expect(heatmapHost.scrollWidth).toBeGreaterThan(heatmapHost.clientWidth);
    expect(
      Math.min(...heatmapCells.map((cell) => cell.getBoundingClientRect().width)),
    ).toBeGreaterThanOrEqual(16);
    expect(heatmapHost.querySelectorAll(".charts2-heat-cell.charts2-mark")).toHaveLength(heatmapCells.length);
    heatmapHost.scrollLeft = heatmapHost.scrollWidth - heatmapHost.clientWidth;
    heatmapCells.at(-1).focus();
    const heatmapHostBounds = heatmapHost.getBoundingClientRect();
    const heatmapTooltipBounds = heatmapHost.querySelector(".charts2-tooltip").getBoundingClientRect();
    expect(heatmapTooltipBounds.left).toBeGreaterThanOrEqual(heatmapHostBounds.left + 4);
    expect(heatmapTooltipBounds.right).toBeLessThanOrEqual(heatmapHostBounds.right - 4);

    const signedMixed = document.querySelector("#mixed-signed svg");
    const signedValueLabels = [
      ...signedMixed.querySelectorAll(".charts2-value-label"),
    ];
    expect(signedValueLabels.every((label) => label.getAttribute("text-anchor") === "start")).toBe(true);
    expect(
      Math.max(...signedValueLabels.map((label) => label.getBoundingClientRect().right)),
    ).toBeLessThanOrEqual(signedMixed.getBoundingClientRect().right);
    const signedLegend = signedMixed.querySelector(".charts2-legend-group").getBoundingClientRect();
    const signedPlotTop = signedMixed.querySelector(".charts2-grid-vertical").getBoundingClientRect().top;
    expect(signedLegend.bottom).toBeLessThanOrEqual(signedPlotTop - 6);

    const polarSvg = document.querySelector("#polar svg");
    const polarBounds = polarSvg.getBoundingClientRect();
    for (const label of polarSvg.querySelectorAll(".charts2-polar-label")) {
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
      expect(svg).not.toHaveClass("charts2-compact-chart");
      expect(svg.querySelector(".charts2-axis")).toBeNull();
      expect(svg.querySelector(".charts2-grid")).toBeNull();
      expect(svg.querySelector(".charts2-label")).toBeNull();
      expect(svg.querySelector(".charts2-legend")).toBeNull();
      expect(svg.querySelector(".charts2-x-hit")).toBeNull();
      expect(svg.querySelector(".charts2-interactive-mark")).toBeNull();
      expect(svg.querySelector("title")).toBeNull();
      expect(document.querySelector(`#${id} .charts2-tooltip`).hidden).toBe(true);
    }

    const storageSegments = [
      ...document.querySelectorAll("#percentage .charts2-percentage-segment"),
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
        "64, size 18",
      ],
    ];

    for (const [
      id,
      heading,
      name,
      value,
    ] of xyCases) {
      const host = document.querySelector(`#${id}`);
      const hit = host.querySelectorAll(".charts2-x-hit")[1];

      hit.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
      expect(host.querySelector(".charts2-tooltip-heading").textContent).toBe(heading);
      expect(host.querySelector(".charts2-tooltip-row span").textContent).toBe(name);
      expect(host.querySelector(".charts2-tooltip-row strong").textContent).toBe(value);
      expect(host.querySelector(".charts2-point-hit")).toBeNull();
      hit.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
    }

    const stressBefore = stressIds.map((id) => document.querySelector(`#${id} svg`).getHTML());
    const showcaseBefore = document.querySelector("#line .charts2-line").getAttribute("d");
    vi.spyOn(Math, "random").mockReturnValue(0);
    document.querySelector("#shuffle").click();

    expect(document.querySelector("#line .charts2-line").getAttribute("d")).not.toBe(showcaseBefore);
    expect(stressIds.map((id) => document.querySelector(`#${id} svg`).getHTML())).toEqual(stressBefore);
  });
});
