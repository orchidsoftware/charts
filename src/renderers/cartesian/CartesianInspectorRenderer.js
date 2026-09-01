import { markMetadata, svg, titled } from "../../support/Dom.js";
import { formatLabel, formatValue } from "../../support/presentation/Formatting.js";

/**
 * Renders category-sized interaction targets for dense Cartesian series.
 */
export default class CartesianInspectorRenderer {
  #chart;
  #layout;
  #surface;

  /**
   * Binds normalized chart state to one immutable Cartesian layout snapshot.
   *
   * @param {object} state - Collaborators required for one inspector pass.
   * @param {object} state.chart - Frozen chart data and options.
   * @param {object} state.layout - Scales and bounds resolved by `CartesianRenderer`.
   * @param {import("../SvgSurface.js").default} state.surface - Owned SVG drawing surface.
   */
  constructor({ chart, layout, surface }) {
    this.#chart = chart;
    this.#layout = layout;
    this.#surface = surface;
  }

  /**
   * Appends one accessible interaction target for every category.
   *
   * @returns {void} Inspector targets and structured tooltip metadata are appended.
   */
  render() {
    for (let index = 0; index < this.#layout.categories.count; index += 1) {
      const rawLabel = this.#chart.labels[index];
      const label = formatLabel(this.#chart.options, rawLabel, { target: "tooltip", index });
      const items = this.#itemsAt(index);

      const hitTarget = markMetadata(
        svg("rect", {
          ...this.#layout.inspectorAt(index),
          fill: "transparent",
          class: "charts2-x-hit charts2-mark",
        }),
        -1,
        index,
      );

      Object.assign(hitTarget.dataset, {
        tooltipHeading: String(label),
        tooltipItems: JSON.stringify(items),
      });
      const summary = items.map((item) => `${item.name}: ${item.value}`).join(" · ");
      this.#surface.append(titled(hitTarget, `${label} — ${summary}`));
    }
  }

  /**
   * Presents every available series value at one category index.
   *
   * @param {number} index - Category index shared by all datasets.
   * @returns {Array<object>} Existing values formatted as tooltip rows.
   */
  #itemsAt(index) {
    return this.#chart.datasets.map((dataset, datasetIndex) => {
      const point = dataset.points[index];

      const formattedValue = formatValue(this.#chart.options, point.y, {
        target: "tooltip",
        dataset,
        datasetIndex,
        datasetName: dataset.name,
        index,
        label: this.#chart.labels[index],
        point,
      });

      const size = point.r === undefined ? "" : `, size ${point.r}`;

      return {
        name: dataset.name,
        value: `${formattedValue}${size}`,
        color: dataset.color,
      };
    });
  }
}
