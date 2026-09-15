import { expect, it, vi } from "vitest";

import { LineChart } from "../src/index.js";
import "../src/styles.css";

it("keeps tooltip content stable while moving within the same category", () => {
  const host = document.createElement("div");
  host.style.width = "640px";
  document.body.append(host);
  const chart = LineChart.make(host).labels(["Mon", "Tue"]).dataset([20, 35]).render();
  const [first, second] = chart.element.querySelectorAll(".orchid-charts-x-hit");
  const tooltip = host.querySelector(".orchid-charts-tooltip");
  first.dispatchEvent(new PointerEvent("pointerenter"));
  const heading = tooltip.firstElementChild;
  const replace = vi.spyOn(tooltip, "replaceChildren");
  const observer = new MutationObserver(() => {});
  observer.observe(tooltip, { attributes: true, childList: true, subtree: true });

  for (let index = 0; index < 20; index += 1) {
    first.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
  }

  expect(replace).not.toHaveBeenCalled();
  expect(observer.takeRecords()).toHaveLength(0);
  expect(tooltip.firstElementChild).toBe(heading);
  expect(tooltip.hidden).toBe(false);
  second.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
  expect(tooltip.textContent).toContain("Tue");
  expect(tooltip.textContent).toContain("35");
  expect(replace).toHaveBeenCalledOnce();
  observer.disconnect();
  chart.destroy();
  host.remove();
});
