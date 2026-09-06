import { afterEach, beforeEach, expect, it, vi } from "vitest";

import markup from "../demo/index.html?raw";
import { mountTryChart } from "../demo/TryChart.js";
import "../demo/style.css";

const fixture = { dispose: null, root: null };

beforeEach(() => {
  const document_ = new DOMParser().parseFromString(markup, "text/html");
  document.body.innerHTML = document_.querySelector("#try").outerHTML;
  fixture.root = document.querySelector("#try");
  fixture.dispose = mountTryChart(fixture.root);
});

afterEach(() => {
  fixture.dispose();
});

function submit(values) {
  fixture.root.querySelector("#try-values").value = values;
  fixture.root.querySelector("#try-form").requestSubmit();
}

function choose(selector, value) {
  const input = fixture.root.querySelector(selector);
  input.value = value;
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

it("updates the existing SVG and the copyable code with entered monthly revenue", () => {
  const svg = fixture.root.querySelector("#your-chart svg");
  submit("10, 20, 30, 40, 50, 60");
  expect(fixture.root.querySelector("#your-chart svg")).toBe(svg);
  expect(fixture.root.querySelector("#try-source").textContent).toContain(
    '.dataset("Revenue", [10, 20, 30, 40, 50, 60])',
  );
  expect(svg.textContent).toContain("60");
  expect(fixture.root.querySelector("#try-status").textContent).toContain("updated");
});

it.each(["", "1, 2, , 4, 5, 6", "1, 2, nope, 4, 5, 6", "1, 2, Infinity, 4, 5, 6"])(
  "preserves the last chart and code after invalid input %s, then recovers",
  (values) => {
    const before = fixture.root.querySelector("#your-chart svg").outerHTML;
    const code = fixture.root.querySelector("#try-source").textContent;
    submit(values);
    expect(fixture.root.querySelector("#try-error").textContent).toContain(
      "Enter one or more finite numbers",
    );
    expect(fixture.root.querySelector("#try-values")).toHaveAttribute("aria-invalid", "true");
    expect(fixture.root.querySelector("#your-chart svg").outerHTML).toBe(before);
    expect(fixture.root.querySelector("#try-source").textContent).toBe(code);
    submit("0, -2, 3.5, 4, 5, 6");
    expect(fixture.root.querySelector("#try-error").textContent).toBe("");
    expect(fixture.root.querySelector("#try-values")).not.toHaveAttribute("aria-invalid");
    expect(fixture.root.querySelector("#try-source").textContent).toContain("[0, -2, 3.5, 4, 5, 6]");
  },
);

it.each([
  { input: "42", labels: ["Jan"], last: 42 },
  { input: "4, 8", labels: ["Jan", "Feb"], last: 8 },
  {
    input: "4, 8, 15, 16, 23, 42, 108",
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    last: 108,
  },
  {
    input: "1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13",
    labels: Array.from({ length: 13 }, (_, index) => `Month ${index + 1}`),
    last: 13,
  },
])("accepts a variable number of values: $input", ({ input, labels, last }) => {
  submit(input);
  const expectedLabels = `.labels([${labels.map((label) => JSON.stringify(label)).join(", ")}])`;
  expect(fixture.root.querySelector("#try-error").textContent).toBe("");
  expect(fixture.root.querySelector("#try-source").textContent).toContain(expectedLabels);
  expect(fixture.root.querySelectorAll("#your-chart .orchid-charts-x-hit")).toHaveLength(labels.length);
  expect(fixture.root.querySelector("#your-chart .orchid-charts-x-hit:last-of-type")).toHaveAttribute(
    "aria-label",
    `${labels.at(-1)} — Revenue: ${last}`,
  );
  choose("#try-type", "bar");
  expect(fixture.root.querySelectorAll("#your-chart .orchid-charts-x-hit")).toHaveLength(labels.length);
  expect(fixture.root.querySelector("#try-source").textContent).toContain(expectedLabels);
  submit("20, 30");
  expect(fixture.root.querySelectorAll("#your-chart .orchid-charts-x-hit")).toHaveLength(2);
});

it("switches to bars using the last applied values and keeps one mounted chart", () => {
  submit("10, 20, 30, 40, 50, 60");
  choose("#try-type", "bar");
  expect(fixture.root.querySelectorAll("#your-chart > svg")).toHaveLength(1);
  expect(fixture.root.querySelector("#your-chart svg")).toHaveAttribute("aria-label", "bar chart");
  expect(fixture.root.querySelector("#try-source").textContent).toContain('BarChart.make("#your-chart")');
  expect(fixture.root.querySelector("#try-source").textContent).toContain("[10, 20, 30, 40, 50, 60]");
});

it("changes the surface using the same CSS shown to the developer", () => {
  const svg = fixture.root.querySelector("#your-chart svg");
  choose("#try-theme", "dark");
  const host = fixture.root.querySelector("#your-chart");
  expect(fixture.root.querySelector("#your-chart svg")).toBe(svg);
  expect(getComputedStyle(host).backgroundColor).toBe("rgb(37, 44, 49)");
  expect(fixture.root.querySelector("#try-css").textContent).toContain(
    "--orchid-charts-label-color: #ffffff;",
  );
  expect(getComputedStyle(host).getPropertyValue("--orchid-charts-label-color").trim()).toBe("#ffffff");
  choose("#try-theme", "light");
  expect(getComputedStyle(host).backgroundColor).toBe("rgb(255, 255, 255)");
});

it("copies the JavaScript for the current chart and explains a clipboard failure", async () => {
  const copy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
  choose("#try-type", "bar");
  submit("1, 2, 3, 4, 5, 6");
  fixture.root.querySelector("#try-copy").click();
  await vi.waitFor(() =>
    expect(copy).toHaveBeenCalledWith(fixture.root.querySelector("#try-source").textContent),
  );
  expect(fixture.root.querySelector("#try-status").textContent).toContain("JavaScript copied");
  copy.mockRejectedValue(new Error("Clipboard denied"));
  fixture.root.querySelector("#try-copy").click();
  await vi.waitFor(() =>
    expect(fixture.root.querySelector("#try-status").textContent).toContain("Copy is unavailable"),
  );
});

it("removes the chart and form listeners when the example is disposed", () => {
  fixture.dispose();
  expect(fixture.root.querySelector("#your-chart svg")).toBeNull();
  choose("#try-type", "bar");
  expect(fixture.root.querySelector("#your-chart svg")).toBeNull();
  expect(mountTryChart(null)).toBeUndefined();
});
