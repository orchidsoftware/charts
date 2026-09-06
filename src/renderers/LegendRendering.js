import { SERIES_SWATCH_DIAMETER, LEGEND_LABEL_OFFSET } from "../support/Constants.js";
import { svg } from "../support/Dom.js";
import { seriesContentLayout } from "../support/presentation/Presentation.js";
import { labelElement } from "../support/presentation/TextLayout.js";

/**
 * Draws one compact color key using shared wrapping and bottom placement.
 *
 * @param {object} rendering - Frozen chart snapshot and SVG surface.
 * @param {object} rendering.chart - Frozen chart data and options.
 * @param {object} rendering.surface - Owned SVG drawing surface.
 * @param {object} [layout] - Measured composition layout, or the default series layout.
 * @returns {void} Visible legend items are appended without interaction targets.
 */
function renderLegend({ chart, surface }, layout = seriesContentLayout(chart)) {
  if (layout.legendBaseline === null) {
    return;
  }

  const { items, legendBaseline } = layout;
  const group = svg("g", { class: "charts2-legend-group", "aria-label": "Legend" });

  for (const item of items) {
    const { labelMaxWidth, x, yOffset } = item;
    const y = legendBaseline + yOffset;
    group.append(
      svg("circle", {
        cx: x + SERIES_SWATCH_DIAMETER / 2,
        cy: y - SERIES_SWATCH_DIAMETER / 2,
        r: SERIES_SWATCH_DIAMETER / 2,
        fill: item.color,
        class: "charts2-legend-swatch charts2-series-swatch",
        "aria-hidden": "true",
      }),
      labelElement({
        value: item.label,
        attributes: { x: x + LEGEND_LABEL_OFFSET, y, class: "charts2-legend" },
        measurement: { maxWidth: labelMaxWidth },
      }),
    );
  }

  surface.append(group);
}

export { renderLegend };
