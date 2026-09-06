import { formatLabel, formatValue, seriesContext } from "../../support/presentation/Formatting.js";

/**
 * Renders category-sized interaction targets for dense Cartesian series.
 */
export default class CartesianInspectorRenderer {
  #chart;
  #layout;
  #surface;
  #visuals;

  /**
   * Binds normalized chart state to one immutable Cartesian layout snapshot.
   *
   * @param {object} state - Collaborators required for one inspector pass.
   * @param {object} state.chart - Frozen chart data and options.
   * @param {object} state.layout - Scales and bounds resolved by `CartesianRenderer`.
   * @param {import("../SvgSurface.js").default} state.surface - Owned SVG drawing surface.
   * @param {SVGElement[][]} state.visuals - Explicit visual peers indexed by dataset and point.
   */
  constructor({ chart, layout, surface, visuals }) {
    this.#chart = chart;
    this.#layout = layout;
    this.#surface = surface;
    this.#visuals = visuals;
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

      const summary = items.map((item) => `${item.name}: ${item.value}`).join(" · ");
      this.#surface.mark(
        "rect",
        {
          ...this.#layout.inspectorAt(index),
          fill: "transparent",
          class: "charts2-x-hit charts2-mark",
        },
        {
          kind: "category",
          dataset: 0,
          point: index,
          title: `${label} — ${summary}`,
          tooltip: { heading: String(label), items },
          visualElement: this.#visuals[0]?.[index],
        },
      );
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
        ...seriesContext(this.#chart, datasetIndex, index),
        target: "tooltip",
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
