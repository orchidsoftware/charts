import { CHART_BUBBLE, MAX_X_INSPECTOR_POINTS } from "../../support/Constants.js";
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
    if (this.#layout.categories.count > MAX_X_INSPECTOR_POINTS) {
      this.#renderDense();

      return;
    }

    for (let index = 0; index < this.#layout.categories.count; index += 1) {
      const address = this.#addressAt(index, this.#visuals[0]?.[index]);
      this.#surface.mark(
        "rect",
        {
          ...this.#layout.inspectorAt(index),
          fill: "transparent",
          class: "orchid-charts-x-hit orchid-charts-mark",
        },
        {
          kind: "category",
          dataset: 0,
          point: index,
          title: address.label,
          tooltip: address.tooltip,
          visualElement: address.visualElement,
        },
      );
    }
  }

  /**
   * Covers an arbitrarily long category series with one target and highlight.
   *
   * @returns {void} The shared target is appended.
   */
  #renderDense() {
    const { left, top, right, bottom } = this.#layout.frame;

    const highlight = this.#surface.append("rect", {
      class: "orchid-charts-x-hit",
      "pointer-events": "none",
      visibility: "hidden",
    });

    const inspection = {
      count: this.#layout.categories.count,
      bandAt: (index) => this.#layout.inspectorAt(index),
      indexAt: (x, y) => this.#layout.inspectionIndexAt(x, y),
      addressAt: (index) => this.#addressAt(index, highlight),
    };

    const address = inspection.addressAt(0);
    this.#surface.mark(
      "rect",
      {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
        fill: "transparent",
        class: "orchid-charts-mark orchid-charts-dense-hit",
      },
      {
        kind: "category",
        dataset: 0,
        point: 0,
        title: address.label,
        tooltip: address.tooltip,
        visualElement: highlight,
        inspection,
      },
    );
  }

  /**
   * Formats only the category currently being inspected.
   *
   * @param {number} index - Category index.
   * @param {SVGElement} highlight - Reusable visual peer.
   * @returns {object} Renderer-owned metadata for tooltip and selection.
   */
  #addressAt(index, highlight) {
    const label = formatLabel(
      this.#chart.options,
      this.#chart.labels[index] ?? this.#chart.datasets[0].points[index].x,
      { target: "tooltip", index },
    );

    const items = this.#itemsAt(index);
    const summary = items.map((item) => `${item.name}: ${item.value}`).join(" · ");
    const band = this.#layout.inspectorAt(index);

    const address = {
      kind: "category",
      datasetIndex: 0,
      pointIndex: index,
      label: `${label} — ${summary}`,
      tooltip: { heading: String(label), items },
      visualElement: highlight,
      anchor: { x: band.x + band.width / 2, y: band.y + band.height / 2 },
    };

    return address;
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

      const size = this.#layout.type === CHART_BUBBLE ? `, size ${point.r}` : "";

      return {
        name: dataset.name,
        value: `${formattedValue}${size}`,
        color: dataset.color,
      };
    });
  }
}
