# Timesheet Charts

## Introduction

Timesheet charts place tasks across a time axis. They are suitable for release
plans, phases, bookings, schedules, and other product views where both start
and end dates matter.

## Creating a Timesheet Chart

```js
import { TimesheetChart } from "@orchidsoftware/charts";
import "@orchidsoftware/charts/style.css";

const chart = TimesheetChart.make("#release-plan")
  .task("Design", "2026-09-01", "2026-09-03")
  .task("Build", "2026-09-03", "2026-09-08")
  .render();
```

Dates may be `Date` objects, millisecond timestamps, `YYYY-MM-DD` strings, or
date-time strings with an explicit timezone.

## Task Details

Pass an object when a task needs a group or color:

```js
import { TimesheetChart } from "@orchidsoftware/charts";

TimesheetChart.make("#release-plan")
  .task({
    label: "Design",
    start: "2026-09-01",
    end: "2026-09-03",
    group: "Product",
    color: "#8b5cf6",
  })
  .task({
    label: "Build",
    start: "2026-09-03",
    end: "2026-09-08",
    group: "Engineering",
    color: "#2563eb",
  })
  .render();
```

## Displaying a Fixed Range

Without `range()`, Orchid Charts derives the timeline from the earliest start and
latest end. Use `range()` when the view should include additional time:

```js
import { TimesheetChart } from "@orchidsoftware/charts";

TimesheetChart.make("#release-plan")
  .range("2026-09-01", "2026-09-12")
  .task("Design", "2026-09-01", "2026-09-03")
  .task("Build", "2026-09-03", "2026-09-08")
  .render();
```

## Axes, Grid, and Labels

Use `axes(false)`, `grid(false)`, and `valueLabels(false)` to remove individual
presentation layers:

```js
import { TimesheetChart } from "@orchidsoftware/charts";

TimesheetChart.make("#release-plan")
  .task("Design", "2026-09-01", "2026-09-03")
  .axes(false)
  .grid(false)
  .valueLabels(false)
  .render();
```

## Date and Duration Formatting

`formatDate()` formats dates in chart content, `formatDuration()` formats task
durations, and `formatTick()` formats the time axis:

```js
import { TimesheetChart } from "@orchidsoftware/charts";

TimesheetChart.make("#release-plan")
  .task("Design", "2026-09-01", "2026-09-03")
  .formatDate((date) => date.toLocaleDateString())
  .formatDuration((milliseconds) => `${milliseconds / 86_400_000} days`)
  .formatTick((date) => date.toLocaleDateString(undefined, { month: "short", day: "numeric" }))
  .render();
```

## Rounded Task Bars

The `radius()` method rounds task bars in CSS pixels:

```js
import { TimesheetChart } from "@orchidsoftware/charts";

TimesheetChart.make("#release-plan")
  .task("Design", "2026-09-01", "2026-09-03")
  .radius(5)
  .render();
```

## Formatting the Tooltip

The timesheet tooltip provides its own date and duration formatters:

```js
import { TimesheetChart } from "@orchidsoftware/charts";

TimesheetChart.make("#release-plan")
  .task("Design", "2026-09-01", "2026-09-03")
  .tooltip((tooltip) => {
    tooltip
      .formatDate((date) => date.toLocaleDateString())
      .formatDuration((milliseconds) => `${milliseconds / 86_400_000} days`);
  })
  .render();
```

Timesheet charts also support the shared `title()`, `description()`,
`ariaLabel()`, `width()`, `height()`, `colors()`, `tooltip()`, and `onSelect()`
methods. See [Customization](./customization.md) for details.
