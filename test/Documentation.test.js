import { afterEach, expect, it, vi } from "vitest";
import { commands } from "vitest/browser";

const frames = new Set();

afterEach(async () => {
  for (const frame of frames) {
    frame.remove();
  }
  frames.clear();
  await commands.emulateAppearance(null);
});

it.each([
  { width: 1280, theme: "light", document: "getting-started" },
  { width: 1280, theme: "dark", document: "api-reference" },
  { width: 390, theme: "light", document: "api-reference" },
  { width: 390, theme: "dark", document: "frameworks" },
])("keeps $document readable at $width px in $theme appearance", async (scenario) => {
  const { content, view } = await openDocumentation(scenario);
  expect(view.matchMedia("(prefers-color-scheme: dark)").matches).toBe(scenario.theme === "dark");
  expect(content.documentElement.scrollWidth).toBe(scenario.width);
  expect(content.querySelectorAll("footer")).toHaveLength(1);
  expect(content.querySelector('.site-footer a[href="#top"]').textContent).toBe("Back to Top ↑");
  expect(content.querySelectorAll("script")).toHaveLength(0);
  const icons = [...content.querySelectorAll(".docs-desktop-nav svg")];
  expect(icons).toHaveLength(12);
  expect(
    icons.every(
      (icon) => icon.getAttribute("aria-hidden") === "true" && icon.getAttribute("focusable") === "false",
    ),
  ).toBe(true);
  const keyword = content.querySelector(".hljs-keyword");
  expect(view.getComputedStyle(keyword).color).not.toBe(view.getComputedStyle(keyword.closest("code")).color);
  const blocks = [...content.querySelectorAll("pre")];
  expect(blocks.every((block) => view.getComputedStyle(block).overflowX === "auto")).toBe(true);
});

async function openDocumentation(scenario) {
  await commands.emulateAppearance(scenario.theme);
  const frame = document.createElement("iframe");
  frames.add(frame);
  frame.style.cssText = `width: ${scenario.width}px; height: 844px; border: 0; color-scheme: ${scenario.theme}`;
  frame.title = "Documentation preview";
  frame.src = `/docs/${scenario.document}.html`;
  document.body.append(frame);
  await vi.waitFor(
    () => {
      expect(frame.contentDocument.querySelector(".docs-content h1")).not.toBeNull();
      expect(
        frame.contentWindow.getComputedStyle(frame.contentDocument.querySelector(".docs-layout")).display,
      ).toBe("grid");
    },
    { timeout: 5000 },
  );
  return {
    content: frame.contentDocument,
    view: frame.contentWindow,
  };
}

it.each([
  { width: 390, theme: "light", document: "api-reference" },
  { width: 390, theme: "dark", document: "frameworks" },
])("opens the mobile navigation for $document in $theme appearance", async (scenario) => {
  const { content, view } = await openDocumentation(scenario);
  const menu = content.querySelector(".docs-mobile-nav");
  expect(view.getComputedStyle(menu).display).toBe("block");
  menu.querySelector("summary").click();
  expect(menu.open).toBe(true);
  expect(menu.querySelector('a[aria-current="page"]').getAttribute("href")).toBe(
    `./${scenario.document}.html`,
  );
});
