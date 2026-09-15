import { expect, it } from "vitest";

import { LineChart, ScatterChart } from "../src/index.js";
import "../src/styles.css";

it.each([LineChart, ScatterChart])(
  "themes hover independently of active selection and exports the blend mode (%s)",
  (ChartType) => {
    const host = document.createElement("div");
    host.style.width = "400px";
    host.style.setProperty("--orchid-charts-hover-fill", "rgb(237 238 240 / 50%)");
    host.style.setProperty("--orchid-charts-hover-blend-mode", "multiply");
    host.style.setProperty("--orchid-charts-focus-ring", "#007aff");
    document.body.append(host);
    const chart = ChartType.make(host).labels(["Mon", "Tue"]).dataset([20, 35]).render();
    const selector = ".orchid-charts-x-hit, .orchid-charts-point-hit";
    const hit = chart.element.querySelector(selector);
    hit.classList.add("is-hovered");

    expect(getComputedStyle(hit).fill).toBe("rgba(237, 238, 240, 0.5)");
    expect(getComputedStyle(hit).fillOpacity).toBe("1");
    expect(getComputedStyle(hit).mixBlendMode).toBe("multiply");

    const svg = new DOMParser().parseFromString(chart.toSvg(), "image/svg+xml");
    expect(svg.querySelector(selector).style.mixBlendMode).toBe("multiply");
    expect(svg.querySelector(selector).style.fill).toBe("rgba(237, 238, 240, 0.5)");

    hit.classList.add("is-active");
    expect(getComputedStyle(hit).fill).toBe("rgb(0, 122, 255)");
    expect(getComputedStyle(hit).fillOpacity).toBe("0.08");
    expect(getComputedStyle(hit).mixBlendMode).toBe("normal");

    hit.classList.remove("is-active");
    host.style.setProperty("--orchid-charts-hover-fill", "rgb(255 255 255 / 12%)");
    host.style.setProperty("--orchid-charts-hover-blend-mode", "normal");
    expect(getComputedStyle(hit).fill).toBe("rgba(255, 255, 255, 0.12)");
    expect(getComputedStyle(hit).mixBlendMode).toBe("normal");
    chart.destroy();
    host.remove();
  },
);
