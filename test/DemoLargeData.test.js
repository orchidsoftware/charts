import { beforeEach, expect, it, vi } from "vitest";

import { showExampleCode } from "../demo/ExampleCode.js";
import labMarkup from "../demo/lab.html?raw";
import { mountLargeDataExamples } from "../demo/LargeDataExamples.js";
import { BarChart, LineChart } from "../src/index.js";
import "../demo/style.css";
import "../demo/lab.css";

beforeEach(() => {
  const lab = new DOMParser().parseFromString(labMarkup, "text/html");
  document.body.innerHTML = lab.querySelector("#large-data-fixtures").outerHTML;
  showExampleCode(mountLargeDataExamples());
});

it.each([
  ["line", LineChart],
  ["bar", BarChart],
])(
  "reports a %s diagnostic failure and can retry without prescribing a renderer limit",
  async (type, Chart) => {
    const host = document.querySelector(`#large-data-${type}`);
    const card = host.closest("article");
    const button = card.querySelector("[data-large-data-run]");
    const prototype = Object.getPrototypeOf(Chart.make(host));
    const dataset = vi.spyOn(prototype, "dataset");
    const destroy = vi.fn();
    const render = vi
      .spyOn(prototype, "render")
      .mockImplementationOnce(() => {
        throw new Error("Diagnostic render failure");
      })
      .mockReturnValue({ destroy });

    expect(host.dataset.result).toBe("pending");
    expect(dataset).not.toHaveBeenCalled();
    expect(render).not.toHaveBeenCalled();
    button.click();
    expect(host.dataset.result).toBe("running");
    expect([...document.querySelectorAll("[data-large-data-run]")].every((control) => control.disabled)).toBe(
      true,
    );
    await expect.poll(() => host.dataset.result).toBe("rejected");
    const values = dataset.mock.calls[0][0].values;
    expect(values).toHaveLength(100_000);
    expect(values.every((value) => Number.isFinite(value))).toBe(true);
    expect(values[28_000]).toBeGreaterThan(values[10_000] + 20);
    expect(values[60_000]).toBeLessThan(5);
    expect(values[82_000]).toBeGreaterThan(60);
    expect(values.at(-1)).toBeGreaterThan(values[0] + 15);
    expect(values.every((value, index) => index === 0 || Math.abs(value - values[index - 1]) < 0.1)).toBe(
      true,
    );
    expect(card.querySelector("[role=status]").textContent).toContain("Error: Diagnostic render failure");
    expect(host.querySelector("svg")).toBeNull();
    expect(
      [...document.querySelectorAll("[data-large-data-run]")].every((control) => !control.disabled),
    ).toBe(true);

    button.click();
    await expect.poll(() => host.dataset.result).toBe("rendered");
    expect(card.querySelector("[role=status]").textContent).toMatch(
      /Constructed all 100,000 values in \d+ ms \(excluding paint\)/,
    );
    button.click();
    await expect.poll(() => render.mock.calls.length).toBe(3);
    expect(destroy).toHaveBeenCalledOnce();
    expect(button.disabled).toBe(false);
    expect(button.textContent).toBe("Run again · 100,000 values");
  },
);

it.each(["line", "bar"])(
  "copies a standalone %s diagnostic without expanding the large-data-value array",
  async (type) => {
    const copy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    document.querySelector(`[data-fixture="large-data-${CSS.escape(type)}"] .example-code-copy`).click();
    await expect.poll(() => copy.mock.calls.length).toBe(1);
    const code = copy.mock.calls[0][0];
    expect(code).toContain('from "@orchidsoftware/charts"');
    expect(code).toContain("Array.from({ length: 100_000 }");
    expect(code).toContain(`.make("#large-data-${type}")`);
    expect(code).not.toContain("return {");
    expect(code.length).toBeLessThan(2000);
  },
);
