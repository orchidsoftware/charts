import { LEGEND_BASELINE_INSET, LEGEND_CONTENT_GAP, LEGEND_ROW_HEIGHT } from "../Constants.js";
import { svg } from "../Dom.js";

const HOST_CLASS = "orchid-charts-host";
const LEGEND_LINE_GAP = 6;
const LEGEND_TOP_GAP = 8;

/**
 * Measures chart text in its host's CSS context for one atomic render.
 *
 * @param {HTMLElement} host - Chart container providing inherited and scoped styles.
 * @param {SVGSVGElement} element - Candidate surface whose classes establish typography.
 * @param {(typography: object) => object} render - Render callback using the measured typography.
 * @returns {object} Result of the completed detached render.
 */
function withChartTypography(host, element, render) {
  const probe = element.cloneNode(false);
  const hadHostClass = host.classList.contains(HOST_CLASS);
  probe.setAttribute("aria-hidden", "true");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  host.classList.add(HOST_CLASS);
  host.append(probe);

  try {
    const contexts = new Map();

    const forClass = (className, groupClass = "") => {
      const key = `${groupClass}|${className}`;

      if (!contexts.has(key)) {
        host.append(probe);
        const parent = groupClass ? svg("g", { class: groupClass }) : probe;
        const text = svg("text", { class: className });
        parent.append(text);
        if (parent !== probe) {
          probe.append(parent);
        }

        exposeHiddenProbe(probe, text);
        contexts.set(key, textTypography(text));
      }

      return contexts.get(key);
    };

    return render(Object.freeze({ forClass }));
  } finally {
    probe.remove();
    host.classList.toggle(HOST_CLASS, hadHostClass);
  }
}

/**
 * Makes SVG glyph measurement available when the chart's ancestors are hidden.
 *
 * @param {SVGSVGElement} probe - Invisible temporary chart surface.
 * @param {SVGTextElement} text - Text node whose computed font comes from the host.
 * @returns {void} Hidden-host typography is preserved before measuring outside that subtree.
 */
function exposeHiddenProbe(probe, text) {
  if (probe.getClientRects().length > 0) {
    return;
  }

  const computed = getComputedStyle(text);

  for (const property of computed) {
    text.style.setProperty(property, computed.getPropertyValue(property));
  }

  probe.style.setProperty("display", "block");
  document.body.append(probe);
}

/**
 * Captures browser glyph metrics and caches widths throughout one render pass.
 *
 * @param {SVGTextElement} text - Connected text node with its role's computed CSS.
 * @returns {object} Immutable measurement function and vertical layout metrics.
 */
function textTypography(text) {
  const node = text;
  const measurements = new Map();

  const measure = (value) => {
    const label = String(value);

    if (!measurements.has(label)) {
      node.textContent = label;
      const bounds = node.getBBox();
      measurements.set(
        label,
        Object.freeze({
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
          advance: node.getComputedTextLength(),
        }),
      );
    }

    return measurements.get(label);
  };

  const sample = measure("MgЁjp");
  const cssLineHeight = Number(getComputedStyle(node).lineHeight.replace("px", ""));

  return Object.freeze({
    widthOf: (value) => Math.max(measure(value).advance, measure(value).width),
    boundsOf: measure,
    lineHeight: Math.max(sample.height, Number.isNaN(cssLineHeight) ? sample.height : cssLineHeight),
    metricsFor: (labels) => legendMetrics(labels.map((label) => measure(label))),
  });
}

/**
 * Reserves row and plot clearance for the actual legend glyphs.
 *
 * @param {object[]} measurements - Browser measurements for every complete legend label.
 * @returns {object} Immutable vertical spacing with the standard compact layout as its floor.
 */
function legendMetrics(measurements) {
  const ascent = Math.max(0, ...measurements.map((entry) => -entry.y));
  const descent = Math.max(0, ...measurements.map((entry) => entry.y + entry.height));

  return Object.freeze({
    rowHeight: Math.max(LEGEND_ROW_HEIGHT, Math.ceil(ascent + descent + LEGEND_LINE_GAP)),
    baselineInset: Math.max(LEGEND_BASELINE_INSET, Math.ceil(descent)),
    contentGap: Math.max(LEGEND_CONTENT_GAP, Math.ceil(ascent + LEGEND_TOP_GAP)),
  });
}

export { withChartTypography };
