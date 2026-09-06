import { BarChart, LineChart } from "../src/index.js";

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const lightTheme = {
  "color-scheme": "light",
  background: "#ffffff",
  "--orchid-charts-label-color": "#1c2226",
  "--orchid-charts-secondary-label-color": "#4f5d69",
  "--orchid-charts-axis-line-color": "#d3dce3",
  "--orchid-charts-tooltip-bg": "#ffffff",
  "--orchid-charts-tooltip-value": "#1c2226",
  "--orchid-charts-focus-ring": "#8267aa",
  "--orchid-charts-mark-separator": "#ffffff",
  "--orchid-charts-point-fill": "#ffffff",
};
const darkTheme = {
  "color-scheme": "dark",
  background: "#252c31",
  "--orchid-charts-label-color": "#ffffff",
  "--orchid-charts-secondary-label-color": "#b8c2ca",
  "--orchid-charts-axis-line-color": "#4f5d69",
  "--orchid-charts-tooltip-bg": "#1c2226",
  "--orchid-charts-tooltip-value": "#ffffff",
  "--orchid-charts-focus-ring": "#b09ad1",
  "--orchid-charts-mark-separator": "#252c31",
  "--orchid-charts-point-fill": "#252c31",
};

function labelsFor(count) {
  return count <= months.length
    ? months.slice(0, count)
    : Array.from({ length: count }, (_, index) => `Month ${index + 1}`);
}

function chartSource(type, values) {
  const name = type === "bar" ? "BarChart" : "LineChart";
  return `import { ${name} } from "@orchidsoftware/charts";
import "@orchidsoftware/charts/style.css";

const chart = ${name}.make("#your-chart")
  .labels([${labelsFor(values.length)
    .map((label) => JSON.stringify(label))
    .join(", ")}])
  .dataset("Revenue", [${values.join(", ")}])
  .colors(["#8267aa"])
  .height(260)
  .render();`;
}

function readValues(input) {
  const parts = input.value.split(",").map((value) => value.trim());
  const values = parts.map(Number);
  if (parts.includes("") || values.some((value) => !Number.isFinite(value))) {
    throw new Error(
      "Enter one or more finite numbers separated by commas, for example: 4, 8, 15, 16, 23, 42, 108.",
    );
  }
  return values;
}

function applyTheme(host, dark) {
  const properties = Object.entries(dark ? darkTheme : lightTheme);
  for (const [
    name,
    value,
  ] of properties) {
    host.style.setProperty(name, value);
  }
  return `#your-chart {\n${properties
    .map(
      ([
        name,
        value,
      ]) => `  ${name}: ${value};`,
    )
    .join("\n")}\n}`;
}

/**
 * Connects editable data, chart type, theme, copy, and export to the live example.
 *
 * @param {HTMLElement | null} root - Example section when present on the page.
 * @returns {Function | undefined} Cleanup for the mounted example.
 */
export function mountTryChart(root) {
  if (!root) {
    return;
  }

  const ui = {
    host: root.querySelector("#your-chart"),
    form: root.querySelector("#try-form"),
    input: root.querySelector("#try-values"),
    type: root.querySelector("#try-type"),
    theme: root.querySelector("#try-theme"),
    code: root.querySelector("#try-source"),
    css: root.querySelector("#try-css"),
    error: root.querySelector("#try-error"),
    status: root.querySelector("#try-status"),
    controls: root.querySelector("#try-controls"),
    copy: root.querySelector("#try-copy"),
    download: root.querySelector("#try-download"),
  };
  const controller = new AbortController();
  const events = { signal: controller.signal };
  let values = readValues(ui.input);
  let chart;

  const render = () => {
    chart?.destroy();
    const Definition = ui.type.value === "bar" ? BarChart : LineChart;
    chart = Definition.make(ui.host)
      .labels(labelsFor(values.length))
      .dataset("Revenue", values)
      .colors([
        "#8267aa",
      ])
      .height(260)
      .render();
    ui.code.textContent = chartSource(ui.type.value, values);
  };

  ui.css.textContent = applyTheme(ui.host, false);
  render();
  ui.controls.disabled = false;
  ui.copy.disabled = false;
  ui.download.disabled = false;

  ui.form.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      try {
        const next = readValues(ui.input);
        chart.update({
          labels: labelsFor(next.length),
          datasets: [
            { name: "Revenue", values: next },
          ],
        });
        values = next;
        ui.code.textContent = chartSource(ui.type.value, values);
        ui.error.textContent = "";
        ui.input.removeAttribute("aria-invalid");
        ui.status.textContent = "Chart and code updated with your values.";
      } catch (error_) {
        ui.error.textContent = error_.message;
        ui.input.setAttribute("aria-invalid", "true");
        ui.input.focus();
      }
    },
    events,
  );

  ui.type.addEventListener(
    "change",
    () => {
      render();
      ui.status.textContent = `${ui.type.value === "bar" ? "Bar" : "Line"} chart. Same data, same API.`;
    },
    events,
  );
  ui.theme.addEventListener(
    "change",
    () => {
      ui.css.textContent = applyTheme(ui.host, ui.theme.value === "dark");
      ui.status.textContent = `${ui.theme.value === "dark" ? "Dark" : "Light"} surface applied. See the CSS below the JavaScript.`;
    },
    events,
  );
  ui.copy.addEventListener(
    "click",
    async () => {
      try {
        await navigator.clipboard.writeText(ui.code.textContent);
        ui.status.replaceChildren(
          "JavaScript copied. Add the host element and import the package to use it.",
        );
      } catch {
        ui.status.replaceChildren(
          "Copy is unavailable in this browser. Select the JavaScript above to copy it.",
        );
      }
    },
    events,
  );
  ui.download.addEventListener(
    "click",
    () => {
      chart.download("monthly-revenue");
      ui.status.textContent = "SVG download requested with your current data and theme.";
    },
    events,
  );

  return () => {
    controller.abort();
    chart.destroy();
  };
}
