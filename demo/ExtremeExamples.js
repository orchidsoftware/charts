import {
  BarChart,
  BubbleChart,
  DonutChart,
  HeatmapChart,
  LineChart,
  MixedChart,
  PercentageChart,
  PieChart,
  PolarAreaChart,
  RadarChart,
  ScatterChart,
  TimesheetChart,
} from "../src/index.js";

const chartTypes = {
  BarChart,
  BubbleChart,
  DonutChart,
  HeatmapChart,
  LineChart,
  MixedChart,
  PercentageChart,
  PieChart,
  PolarAreaChart,
  RadarChart,
  ScatterChart,
  TimesheetChart,
};

const types = [
  [
    "line",
    "LineChart",
  ],
  [
    "bar",
    "BarChart",
  ],
  [
    "mixed",
    "MixedChart",
  ],
  [
    "scatter",
    "ScatterChart",
  ],
  [
    "bubble",
    "BubbleChart",
  ],
  [
    "radar",
    "RadarChart",
  ],
  [
    "polar-area",
    "PolarAreaChart",
  ],
  [
    "pie",
    "PieChart",
  ],
  [
    "donut",
    "DonutChart",
  ],
  [
    "percentage",
    "PercentageChart",
  ],
  [
    "timesheet",
    "TimesheetChart",
  ],
  [
    "heatmap",
    "HeatmapChart",
  ],
];
const scenarios = [
  { id: "zero", title: "All values are zero", count: 4 },
  { id: "million", title: "All values exceed 1,000,000", count: 4 },
  { id: "empty", title: "Zero parameters", count: 0 },
  { id: "many", title: "Twelve legend entries", count: 12 },
];

function valueFor(scenario, index) {
  if (scenario === "zero") {
    return 0;
  }
  return scenario === "million" ? 1_250_000 + index * 375_000 : 20 + index * 7;
}

function manySeriesCalls(type) {
  const labels = [
    "Category A",
    "Category B",
    "Category C",
    "Category D",
  ];
  const datasets = Array.from({ length: 12 }, (_, seriesIndex) => {
    const values = labels.map((_label, index) => {
      const y = 20 + seriesIndex * 7 + index * ((seriesIndex % 3) + 1) * 5;
      if (type === "bubble") {
        return {
          x: index * 20 + seriesIndex,
          y,
          r: 3 + seriesIndex,
        };
      }
      if (type === "scatter") {
        return {
          x: index * 20 + seriesIndex,
          y,
        };
      }
      return y;
    });
    const name = `Parameter ${seriesIndex + 1}`;
    if (type === "mixed") {
      return [
        seriesIndex % 2 === 0 ? "bar" : "line",
        [
          name,
          values,
        ],
      ];
    }
    return [
      "dataset",
      [
        { name, values },
      ],
    ];
  });
  return [
    [
      "labels",
      [
        labels,
      ],
    ],
    ...datasets,
    [
      "height",
      [
        420,
      ],
    ],
  ];
}

function fixtureCalls(type, scenario) {
  if (
    scenario.id === "many" &&
    [
      "line",
      "bar",
      "mixed",
      "scatter",
      "bubble",
      "radar",
    ].includes(type)
  ) {
    return manySeriesCalls(type);
  }
  const labels = Array.from({ length: scenario.count }, (_, index) => `Parameter ${index + 1}`);
  const values = labels.map((_, index) => valueFor(scenario.id, index));
  if (type === "heatmap") {
    const points = Object.fromEntries(
      values.map((value, index) => [
        `2026-09-${String(index + 1).padStart(2, "0")}`,
        value,
      ]),
    );
    return [
      [
        "range",
        [
          "2026-09-01",
          `2026-09-${String(scenario.count || 30).padStart(2, "0")}`,
        ],
      ],
      [
        "points",
        [
          points,
        ],
      ],
      ...(scenario.id === "many"
        ? [
            [
              "colors",
              [
                Array.from({ length: 12 }, (_, index) => `hsl(210, 85%, ${96 - index * 6}%)`),
              ],
            ],
          ]
        : []),
    ];
  }
  if (type === "timesheet") {
    const start = Date.UTC(2026, 8, 1);
    return [
      [
        "range",
        [
          start,
          start + 14 * 86_400_000,
        ],
      ],
      ...values.map((value, index) => [
        "task",
        [
          {
            label: labels[index],
            start: start + index * 86_400_000,
            end: start + index * 86_400_000 + (scenario.id === "million" ? value : value * 1000),
          },
        ],
      ]),
      [
        "height",
        [
          scenario.count > 10 ? 520 : 300,
        ],
      ],
    ];
  }
  const calls = [
    [
      "labels",
      [
        labels,
      ],
    ],
  ];
  if (type === "mixed") {
    calls.push(
      [
        "bar",
        [
          "Columns",
          values,
        ],
      ],
      [
        "line",
        [
          "Trend",
          values,
        ],
      ],
    );
  }
  if (type !== "mixed") {
    const coordinates = values.map((value) =>
      type === "bubble"
        ? {
            x: value,
            y: value,
            r: scenario.id === "million" ? 20 * Math.sqrt(value / Math.max(...values)) : value,
          }
        : { x: value, y: value },
    );
    calls.push([
      "dataset",
      [
        {
          name: "Values",
          values: [
            "scatter",
            "bubble",
          ].includes(type)
            ? coordinates
            : values,
        },
      ],
    ]);
  }
  if (
    [
      "pie",
      "donut",
      "percentage",
    ].includes(type)
  ) {
    calls.push([
      "maxSlices",
      [
        12,
      ],
    ]);
  }
  calls.push([
    "height",
    [
      300,
    ],
  ]);
  return calls;
}

function fixtureTitle(type, scenario) {
  if (scenario.id !== "many") {
    return scenario.title;
  }
  if (type === "timesheet") {
    return "Twelve tasks (no legend)";
  }
  if (type === "polar-area") {
    return "Twelve categories (no legend)";
  }
  return scenario.title;
}

function manyLegendDescription(type) {
  if (type === "polar-area") {
    return "This chart type supports one series and shows category labels instead of a legend; twelve categories are shown.";
  }
  if (type === "timesheet") {
    return "This chart type has no legend; twelve labeled tasks are shown instead.";
  }
  if (type === "heatmap") {
    return "Twelve color levels in the intensity legend, from Less to More.";
  }
  return "Twelve named entries in the legend, with one color key per parameter.";
}

function fixtureDescription(type, scenario) {
  if (type === "bubble" && scenario.id === "million") {
    return "Four points with coordinates and source magnitudes above 1,000,000. Magnitudes are mapped to circle area using r = 20 × √(value / maximum), with a maximum radius of 20 CSS pixels.";
  }
  if (scenario.id === "many") {
    return manyLegendDescription(type);
  }
  if (type === "timesheet") {
    if (scenario.id === "zero") {
      return "Four tasks with zero duration (start equals end).";
    }
    if (scenario.id === "million") {
      return "Every task duration exceeds 1,000,000 milliseconds.";
    }
    return `${scenario.count} tasks in a fixed date range.`;
  }
  if (type === "heatmap") {
    return `${scenario.count} supplied daily counts; the September range matches the supplied days when non-empty.`;
  }
  if (
    [
      "scatter",
      "bubble",
    ].includes(type)
  ) {
    return `${scenario.count} points; the scenario applies to every coordinate${type === "bubble" ? " and bubble magnitude" : ""}.`;
  }
  return `${scenario.count} categories per series. ${scenario.title}.`;
}

export const extremeFixtures = scenarios.flatMap((scenario) =>
  types.map(
    ([
      type,
      chartName,
    ]) => {
      const id = `extreme-${type}-${scenario.id}`;
      const description = fixtureDescription(type, scenario);
      const title = fixtureTitle(type, scenario);
      const calls = [
        ...fixtureCalls(type, scenario),
        [
          "ariaLabel",
          [
            `${type}: ${title}`,
          ],
        ],
        [
          "description",
          [
            description,
          ],
        ],
      ];
      const selector = `#${id}`;
      const code = [
        `import { ${chartName} } from "@orchidsoftware/charts";`,
        'import "@orchidsoftware/charts/style.css";',
        "",
        `${chartName}.make(${JSON.stringify(selector)})`,
        ...calls.map(
          ([
            method,
            args,
          ]) => `  .${method}(${args.map((argument) => JSON.stringify(argument)).join(", ")})`,
        ),
        "  .render();",
      ].join("\n");
      const render = () => {
        try {
          const builder = chartTypes[chartName].make(`#${id}`);
          for (const [
            method,
            args,
          ] of calls) {
            builder[method](...args);
          }
          const chart = builder.render();
          document.querySelector(`#${CSS.escape(id)}`).dataset.result = "rendered";
          return { chart };
        } catch (error) {
          const host = document.querySelector(`#${CSS.escape(id)}`);
          host.dataset.result = "rejected";
          const status = document.createElement("p");
          status.className = "lab-fixture-error";
          status.textContent = `Rendering rejected — ${error.name}: ${error.message}`;
          host.replaceChildren(status);
          return { error };
        }
      };
      const fixture = {
        id,
        type,
        scenario: scenario.id,
        title,
        description,
        calls,
        render,
        code,
      };
      return fixture;
    },
  ),
);

/**
 * Mounts the lab-only matrix and returns copyable public API examples.
 *
 * @returns {Array<Array>} Example selectors, render functions, and standalone code.
 */
export function mountExtremeExamples() {
  const container = document.querySelector("#extreme-fixtures");
  if (!container) {
    return [];
  }
  for (const scenario of scenarios) {
    const section = document.createElement("section");
    section.id = `extreme-${scenario.id}-fixtures`;
    section.className = "lab-group";
    section.dataset.fixtureGroup = `extreme-${scenario.id}`;
    section.setAttribute("aria-labelledby", `extreme-${scenario.id}-title`);
    section.innerHTML = `<header class="lab-group-header"><h2 id="extreme-${scenario.id}-title">${scenario.title}</h2><p>Every public chart type. Unsupported inputs display the API validation error for QA inspection.</p></header><div class="lab-grid"></div>`;
    const fixtures = extremeFixtures.filter((item) => item.scenario === scenario.id);
    for (const fixture of fixtures) {
      const card = document.createElement("article");
      card.className = "lab-fixture";
      card.dataset.fixture = fixture.id;
      card.innerHTML = `<header><div><span class="tag">${fixture.type.toUpperCase()} · EXTREME</span><h3>${fixture.title}</h3></div><code>#${fixture.id}</code></header><p class="lab-fixture-description">${fixture.description}</p><div id="${fixture.id}"></div>`;
      section.querySelector(".lab-grid").append(card);
    }
    container.append(section);
  }
  return extremeFixtures.map(({ id, render, code }) => [
    `#${id}`,
    render,
    code,
  ]);
}
