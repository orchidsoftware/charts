export type CartesianChartType = "line" | "bar" | "scatter" | "axis-mixed" | "bubble";
export type AggregationChartType = "pie" | "donut" | "percentage";
export type SeriesChartType = CartesianChartType | AggregationChartType | "radar" | "polar-area";
export type ChartType = SeriesChartType | "heatmap" | "timesheet";
export type BarOrientation = "vertical" | "horizontal";
export type YAxisPosition = "left" | "right";

export interface Point {
  x?: number;
  y: number;
  r?: number;
}
export interface Dataset {
  name?: string;
  color?: string;
  chartType?: "line" | "bar" | "scatter";
  values: readonly (number | Point)[];
}
export interface YMarker {
  value: number;
  label?: string;
  options?: { labelPos?: "left" | "right"; stroke?: string; lineType?: "solid" | "dashed" };
}
export interface YRegion {
  start: number;
  end: number;
  label?: string;
  options?: { labelPos?: "left" | "right" };
}
export interface SeriesData {
  labels?: readonly string[];
  datasets: readonly Dataset[];
  yMarkers?: readonly YMarker[];
  yRegions?: readonly YRegion[];
}
export interface HeatmapData {
  start?: Date;
  end?: Date;
  dataPoints?: Readonly<Record<string | number, number>>;
}
export type TimesheetDate = Date | string | number;
export interface TimesheetTask {
  label?: string;
  start: TimesheetDate;
  end: TimesheetDate;
  group?: string;
  color?: string;
}
export interface TimesheetData {
  start?: TimesheetDate;
  end?: TimesheetDate;
  tasks: readonly TimesheetTask[];
}
export interface SeriesPointSnapshot {
  index: number;
  label: string;
  values: readonly (number | undefined)[];
}
export interface HeatmapPointSnapshot {
  date: Date;
  key: string;
  value: number;
}
export interface TimesheetPointSnapshot {
  label: string;
  start: Date;
  end: Date;
  group?: string;
  color: string;
}
export type ChartPoint<TData> = TData extends HeatmapData
  ? HeatmapPointSnapshot
  : TData extends TimesheetData
    ? TimesheetPointSnapshot
    : SeriesPointSnapshot;
export interface SelectionPoint {
  datasetIndex: number;
  dataset: string;
  label: string | number;
  x: number;
  y: number;
  r?: number;
}
export interface ChartSelection {
  type: ChartType;
  index: number;
  label?: string | number;
  x?: number;
  y?: number;
  value?: number;
  values?: readonly (number | undefined)[];
  datasetIndex?: number;
  dataset?: string;
  points?: readonly SelectionPoint[];
  key?: string;
  date?: Date;
  start?: Date;
  end?: Date;
  duration?: number;
  group?: string;
  color?: string;
  task?: TimesheetTask;
}
export interface CommonChartOptions {
  title?: string;
  width?: number;
  height?: number;
  colors?: readonly string[];
  ariaLabel?: string;
  description?: string;
  showLegend?: boolean;
  showTooltip?: boolean;
  onSelect?: (detail: ChartSelection) => void;
}
export interface SeriesChartOptions extends CommonChartOptions {
  type: SeriesChartType;
  data: SeriesData;
  showAxes?: boolean;
  showGrid?: boolean;
  showLabels?: boolean;
  showDots?: boolean;
  orientation?: BarOrientation;
  gradient?: boolean;
  lineOptions?: {
    regionFill?: boolean;
    hideDots?: boolean;
    hideLine?: boolean;
    dotSize?: number;
    spline?: boolean;
  };
  barOptions?: { stacked?: boolean; radius?: number };
  axisOptions?: {
    yAxisPosition?: YAxisPosition;
    formatLabel?: (
      value: string,
      index: number,
      context: { orientation: BarOrientation; type: SeriesChartType },
    ) => string | readonly string[];
  } | null;
  tooltipOptions?: {
    formatTooltipX?: (value: unknown) => string;
    formatTooltipY?: (value: number) => string;
  };
  maxSlices?: number;
  startAngle?: number;
  padAngle?: number;
  sectorOptions?: { cornerRadius?: number };
  strokeWidth?: number;
}
export interface HeatmapOptions extends CommonChartOptions {
  type: "heatmap";
  data: HeatmapData;
  countLabel?: string;
  radius?: number;
}
export interface TimesheetOptions extends CommonChartOptions {
  type: "timesheet";
  data: TimesheetData;
  showAxes?: boolean;
  showGrid?: boolean;
  showLabels?: boolean;
  timesheetOptions?: {
    formatTick?: (date: Date) => string;
    formatDate?: (date: Date) => string;
    formatDuration?: (milliseconds: number) => string;
    radius?: number;
  };
}
export type ChartOptions = SeriesChartOptions | HeatmapOptions | TimesheetOptions;
export interface Chart<TData> {
  readonly element: SVGSVGElement;
  update(data: TData): this;
  point(index?: number): ChartPoint<TData> | undefined;
  toSvg(): string;
  download(filename?: string): this;
  destroy(): void;
}
export declare function createChart(parent: string | Element, options: HeatmapOptions): Chart<HeatmapData>;
export declare function createChart(parent: string | Element, options: TimesheetOptions): Chart<TimesheetData>;
export declare function createChart(parent: string | Element, options: SeriesChartOptions): Chart<SeriesData>;
