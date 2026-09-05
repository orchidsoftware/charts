export type ChartType =
  | "line"
  | "bar"
  | "scatter"
  | "mixed"
  | "bubble"
  | "pie"
  | "donut"
  | "percentage"
  | "radar"
  | "polar-area"
  | "heatmap"
  | "timesheet";
export interface Point {
  x: number;
  y: number;
}
export interface BubblePoint extends Point {
  r: number;
}
export type TimesheetDate = Date | string | number;
export type ValueRange = readonly [start: number, end: number];
export type ValueFormatTarget = "axis" | "tooltip" | "value-label" | "accessibility";

export interface ChartValueFormatContext {
  readonly target: ValueFormatTarget;
  readonly chartType: ChartType;
  readonly datasetIndex?: number;
  readonly datasetName?: string;
  readonly index?: number;
  readonly label?: string | number;
  readonly point?: Readonly<Point>;
}
export interface DatasetValueFormatContext extends ChartValueFormatContext {
  readonly target: Exclude<ValueFormatTarget, "axis">;
  readonly datasetIndex: number;
  readonly index: number;
  readonly point: Readonly<Point>;
}
export type ChartValueFormatter = (value: number, context: Readonly<ChartValueFormatContext>) => string;
export type DatasetValueFormatter = (value: number, context: Readonly<DatasetValueFormatContext>) => string;
export type AxisValueFormatter = ChartValueFormatter;
export type LabelFormatter = (
  label: string | number,
  context: Readonly<ChartValueFormatContext>,
) => string | readonly string[];
export type DateFormatter = (date: Readonly<Date>) => string;
export type DurationFormatter = (milliseconds: number) => string;
export type MarkerLabelFormatter = (
  label: string,
  value: number,
  context: Readonly<ChartValueFormatContext>,
) => string;
export type RegionLabelFormatter = (
  label: string,
  range: ValueRange,
  context: Readonly<ChartValueFormatContext>,
) => string;

export interface GradientOptions {
  fromOpacity?: number;
  toOpacity?: number;
}
export interface DatasetInput<TValue extends number | Point = number | Point> {
  name?: string;
  values: readonly TValue[];
  color?: string;
  opacity?: number;
  formatValue?: DatasetValueFormatter;
}
export interface LineDatasetInput extends DatasetInput<number> {
  gradient?: boolean | GradientOptions;
  smooth?: boolean;
  dots?: boolean;
  dotSize?: number;
  line?: boolean;
  area?: boolean;
  strokeWidth?: number;
}
export interface BarDatasetInput extends DatasetInput<number> {
  radius?: number;
}
export interface ScatterDatasetInput extends DatasetInput<number | Point> {}
export interface BubbleDatasetInput extends DatasetInput<BubblePoint> {}
export type MixedDatasetInput =
  | (LineDatasetInput & { chartType: "line" })
  | (BarDatasetInput & { chartType: "bar" })
  | (ScatterDatasetInput & { chartType: "scatter" });
export type AnyDatasetInput = LineDatasetInput | BarDatasetInput | ScatterDatasetInput | BubbleDatasetInput;

export interface MarkerInput {
  label: string;
  value: number;
  color?: string;
  width?: number;
  opacity?: number;
  lineStyle?: "solid" | "dashed" | "dotted";
  dash?: readonly number[];
  labelPosition?: "start" | "center" | "end";
  labelColor?: string;
  includeInDomain?: boolean;
  formatLabel?: MarkerLabelFormatter;
}
export interface RegionInput {
  label: string;
  range: ValueRange;
  color?: string;
  opacity?: number;
  labelPosition?: "start" | "center" | "end";
  labelColor?: string;
  includeInDomain?: boolean;
  formatLabel?: RegionLabelFormatter;
}
export interface TimesheetTaskInput {
  label: string;
  start: TimesheetDate;
  end: TimesheetDate;
  group?: string;
  color?: string;
}
export interface SeriesData<TDatasetInput extends DatasetInput = AnyDatasetInput> {
  labels?: readonly string[];
  datasets: readonly TDatasetInput[];
}
export interface CartesianSeriesData<
  TDatasetInput extends DatasetInput = AnyDatasetInput,
> extends SeriesData<TDatasetInput> {
  markers?: readonly MarkerInput[];
  regions?: readonly RegionInput[];
}
export interface HeatmapData {
  start?: Date;
  end?: Date;
  points: Readonly<Record<string | number, number>>;
}
export interface TimesheetData {
  start?: TimesheetDate;
  end?: TimesheetDate;
  tasks: readonly TimesheetTaskInput[];
}

export interface SeriesPointSnapshot {
  readonly index: number;
  readonly label: string | number;
  readonly values: readonly (number | undefined)[];
}
export interface SeriesMarkSnapshot {
  readonly index: number;
  readonly datasetIndex: number;
  readonly dataset: string;
  readonly pointIndex: number;
  readonly label: string | number;
  readonly x: number;
  readonly y: number;
  readonly r?: number;
  readonly chartType?: "line" | "bar" | "scatter";
}
export interface HeatmapPointSnapshot {
  readonly date: Date;
  readonly key: string;
  readonly value: number;
}
export interface TimesheetPointSnapshot {
  readonly label: string;
  readonly start: Date;
  readonly end: Date;
  readonly group?: string;
  readonly color: string;
}
export interface TimesheetTaskSnapshot extends TimesheetPointSnapshot {}
export type ChartPoint =
  SeriesPointSnapshot | SeriesMarkSnapshot | HeatmapPointSnapshot | TimesheetPointSnapshot;

export interface SeriesSelection {
  readonly type: "line" | "bar" | "scatter" | "mixed" | "bubble" | "radar";
  readonly index: number;
  readonly label: string | number;
  readonly value: number;
  readonly values: readonly (number | undefined)[];
  readonly datasetIndex: number;
  readonly dataset: string;
  readonly x: number;
  readonly y: number;
  readonly r?: number;
}
export interface CompositionSelection {
  readonly type: "pie" | "donut" | "percentage" | "polar-area";
  readonly index: number;
  readonly label: string;
  readonly value: number;
  readonly color: string;
}
export interface HeatmapSelection {
  readonly type: "heatmap";
  readonly index: number;
  readonly key: string;
  readonly date: Date;
  readonly value: number;
  readonly color: string;
}
export interface TimesheetSelection {
  readonly type: "timesheet";
  readonly index: number;
  readonly label: string;
  readonly start: Date;
  readonly end: Date;
  readonly duration: number;
  readonly group?: string;
  readonly color: string;
  readonly task: Readonly<TimesheetTaskSnapshot>;
}
export type ChartSelection = SeriesSelection | CompositionSelection | HeatmapSelection | TimesheetSelection;

export interface Chart<TData, TPoint extends ChartPoint> {
  readonly element: SVGSVGElement;
  update(data: TData): this;
  point(index?: number): TPoint | undefined;
  toSvg(): string;
  download(filename?: string): this;
  destroy(): void;
}
export interface ChartDefinition<TBuilder> {
  make(parent: string | Element): TBuilder;
}

export interface DatasetBuilder {
  color(value: string): this;
  opacity(value: number): this;
  formatValue(formatter: DatasetValueFormatter): this;
}
export interface LineDatasetBuilder extends DatasetBuilder {
  gradient(value?: boolean | GradientOptions): this;
  smooth(enabled?: boolean): this;
  dots(visible: boolean): this;
  dotSize(value: number): this;
  line(visible: boolean): this;
  area(enabled?: boolean): this;
  strokeWidth(value: number): this;
}
export interface BarDatasetBuilder extends DatasetBuilder {
  radius(value: number): this;
}
export interface AxisBuilder {
  position(value: "left" | "right"): this;
  formatValue(formatter: AxisValueFormatter): this;
}
export interface SeriesTooltipBuilder {
  formatLabel(formatter: LabelFormatter): this;
  formatValue(formatter: DatasetValueFormatter): this;
}
export interface HeatmapTooltipBuilder {
  formatDate(formatter: DateFormatter): this;
  formatValue(formatter: ChartValueFormatter): this;
}
export interface TimesheetTooltipBuilder {
  formatDate(formatter: DateFormatter): this;
  formatDuration(formatter: DurationFormatter): this;
}
export interface MarkerBuilder {
  color(value: string): this;
  width(value: number): this;
  opacity(value: number): this;
  lineStyle(value: "solid" | "dashed" | "dotted"): this;
  dash(pattern: readonly number[]): this;
  labelPosition(value: "start" | "center" | "end"): this;
  labelColor(value: string): this;
  includeInDomain(enabled: boolean): this;
  formatLabel(formatter: MarkerLabelFormatter): this;
}
export interface RegionBuilder {
  color(value: string): this;
  opacity(value: number): this;
  labelPosition(value: "start" | "center" | "end"): this;
  labelColor(value: string): this;
  includeInDomain(enabled: boolean): this;
  formatLabel(formatter: RegionLabelFormatter): this;
}

export interface CommonChartBuilder<TTooltipBuilder, TSelection extends ChartSelection> {
  title(value: string): this;
  description(value: string): this;
  ariaLabel(value: string): this;
  width(value: number): this;
  height(value: number): this;
  colors(values: readonly string[]): this;
  tooltip(visible: boolean): this;
  tooltip(configure: (tooltip: TTooltipBuilder) => void): this;
  onSelect(callback: (selection: TSelection | undefined) => void): this;
}
export interface IntrinsicHeightChartBuilder<TTooltipBuilder, TSelection extends ChartSelection> {
  title(value: string): this;
  description(value: string): this;
  ariaLabel(value: string): this;
  width(value: number): this;
  colors(values: readonly string[]): this;
  tooltip(visible: boolean): this;
  tooltip(configure: (tooltip: TTooltipBuilder) => void): this;
  onSelect(callback: (selection: TSelection | undefined) => void): this;
}
export interface LegendChartBuilder {
  legend(visible: boolean): this;
}
export interface SeriesDataBuilder<TDatasetBuilder, TDatasetInput extends DatasetInput> {
  labels(values: readonly string[]): this;
  dataset(values: TDatasetInput["values"]): this;
  dataset(values: TDatasetInput["values"], color: string): this;
  dataset(values: TDatasetInput["values"], configure: (dataset: TDatasetBuilder) => void): this;
  dataset(name: string, values: TDatasetInput["values"]): this;
  dataset(name: string, values: TDatasetInput["values"], color: string): this;
  dataset(name: string, values: TDatasetInput["values"], configure: (dataset: TDatasetBuilder) => void): this;
  dataset(input: TDatasetInput, configure?: (dataset: TDatasetBuilder) => void): this;
}
export interface CartesianBuilderMethods {
  axes(visible: boolean): this;
  grid(visible: boolean): this;
  valueLabels(visible: boolean): this;
  frameless(enabled?: boolean): this;
  formatLabel(formatter: LabelFormatter): this;
  formatValue(formatter: ChartValueFormatter): this;
  yAxis(configure: (axis: AxisBuilder) => void): this;
  marker(label: string, value: number): this;
  marker(label: string, value: number, color: string): this;
  marker(label: string, value: number, configure: (marker: MarkerBuilder) => void): this;
  marker(input: MarkerInput, configure?: (marker: MarkerBuilder) => void): this;
  region(label: string, range: ValueRange): this;
  region(label: string, range: ValueRange, color: string): this;
  region(label: string, range: ValueRange, configure: (region: RegionBuilder) => void): this;
  region(input: RegionInput, configure?: (region: RegionBuilder) => void): this;
}

export interface LineChartBuilder
  extends
    CommonChartBuilder<SeriesTooltipBuilder, SeriesSelection>,
    LegendChartBuilder,
    SeriesDataBuilder<LineDatasetBuilder, LineDatasetInput>,
    CartesianBuilderMethods {
  smooth(enabled?: boolean): this;
  dots(visible: boolean): this;
  dotSize(value: number): this;
  line(visible: boolean): this;
  area(enabled?: boolean): this;
  gradient(value?: boolean | GradientOptions): this;
  strokeWidth(value: number): this;
  render(): Chart<CartesianSeriesData<LineDatasetInput>, SeriesPointSnapshot>;
}
export interface BarChartBuilder
  extends
    CommonChartBuilder<SeriesTooltipBuilder, SeriesSelection>,
    LegendChartBuilder,
    SeriesDataBuilder<BarDatasetBuilder, BarDatasetInput>,
    CartesianBuilderMethods {
  horizontal(enabled?: boolean): this;
  stacked(enabled?: boolean): this;
  radius(value: number): this;
  render(): Chart<CartesianSeriesData<BarDatasetInput>, SeriesPointSnapshot>;
}
export interface ScatterChartBuilder
  extends
    CommonChartBuilder<SeriesTooltipBuilder, SeriesSelection>,
    LegendChartBuilder,
    SeriesDataBuilder<DatasetBuilder, ScatterDatasetInput>,
    CartesianBuilderMethods {
  dots(visible: boolean): this;
  render(): Chart<CartesianSeriesData<ScatterDatasetInput>, SeriesMarkSnapshot>;
}
export interface BubbleChartBuilder
  extends
    CommonChartBuilder<SeriesTooltipBuilder, SeriesSelection>,
    LegendChartBuilder,
    SeriesDataBuilder<DatasetBuilder, BubbleDatasetInput>,
    CartesianBuilderMethods {
  dots(visible: boolean): this;
  render(): Chart<CartesianSeriesData<BubbleDatasetInput>, SeriesMarkSnapshot>;
}

export interface MixedDataBuilder {
  labels(values: readonly string[]): this;
  line(
    name: string,
    values: readonly number[],
    colorOrConfigure?: string | ((dataset: LineDatasetBuilder) => void),
  ): this;
  bar(
    name: string,
    values: readonly number[],
    colorOrConfigure?: string | ((dataset: BarDatasetBuilder) => void),
  ): this;
  scatter(
    name: string,
    values: readonly (number | Point)[],
    colorOrConfigure?: string | ((dataset: DatasetBuilder) => void),
  ): this;
  dataset(
    input: LineDatasetInput & { chartType: "line" },
    configure?: (dataset: LineDatasetBuilder) => void,
  ): this;
  dataset(
    input: BarDatasetInput & { chartType: "bar" },
    configure?: (dataset: BarDatasetBuilder) => void,
  ): this;
  dataset(
    input: ScatterDatasetInput & { chartType: "scatter" },
    configure?: (dataset: DatasetBuilder) => void,
  ): this;
}
export interface MixedChartBuilder
  extends
    CommonChartBuilder<SeriesTooltipBuilder, SeriesSelection>,
    LegendChartBuilder,
    MixedDataBuilder,
    CartesianBuilderMethods {
  gradient(value?: boolean | GradientOptions): this;
  render(): Chart<CartesianSeriesData<MixedDatasetInput>, SeriesMarkSnapshot>;
}

export interface NumericSeriesBuilder<
  TData extends DatasetInput<number>,
  TSelection extends ChartSelection = CompositionSelection,
>
  extends
    CommonChartBuilder<SeriesTooltipBuilder, TSelection>,
    LegendChartBuilder,
    SeriesDataBuilder<DatasetBuilder, TData> {
  formatLabel(formatter: LabelFormatter): this;
  formatValue(formatter: ChartValueFormatter): this;
}
export interface SectorChartBuilder extends NumericSeriesBuilder<DatasetInput<number>> {
  maxSlices(value: number): this;
  startAngle(degrees: number): this;
  padAngle(degrees: number): this;
  cornerRadius(value: number): this;
  render(): Chart<SeriesData<DatasetInput<number>>, SeriesPointSnapshot>;
}
export interface PieChartBuilder extends SectorChartBuilder {}
export interface DonutChartBuilder extends SectorChartBuilder {}
export interface PercentageChartBuilder extends NumericSeriesBuilder<DatasetInput<number>> {
  maxSlices(value: number): this;
  radius(value: number): this;
  render(): Chart<SeriesData<DatasetInput<number>>, SeriesPointSnapshot>;
}
export interface PolarAreaChartBuilder extends NumericSeriesBuilder<DatasetInput<number>> {
  padAngle(degrees: number): this;
  cornerRadius(value: number): this;
  render(): Chart<SeriesData<DatasetInput<number>>, SeriesPointSnapshot>;
}
export interface RadarChartBuilder
  extends
    CommonChartBuilder<SeriesTooltipBuilder, SeriesSelection>,
    LegendChartBuilder,
    SeriesDataBuilder<DatasetBuilder, DatasetInput<number>> {
  formatLabel(formatter: LabelFormatter): this;
  formatValue(formatter: ChartValueFormatter): this;
  strokeWidth(value: number): this;
  render(): Chart<SeriesData<DatasetInput<number>>, SeriesPointSnapshot>;
}
export interface HeatmapChartBuilder extends IntrinsicHeightChartBuilder<
  HeatmapTooltipBuilder,
  HeatmapSelection
> {
  range(start: Date, end: Date): this;
  points(values: Readonly<Record<string | number, number>>): this;
  countLabel(value: string): this;
  radius(value: number): this;
  render(): Chart<HeatmapData, HeatmapPointSnapshot>;
}
export interface TimesheetChartBuilder extends CommonChartBuilder<
  TimesheetTooltipBuilder,
  TimesheetSelection
> {
  range(start: TimesheetDate, end: TimesheetDate): this;
  task(label: string, start: TimesheetDate, end: TimesheetDate): this;
  task(input: TimesheetTaskInput): this;
  axes(visible: boolean): this;
  grid(visible: boolean): this;
  valueLabels(visible: boolean): this;
  formatDate(formatter: DateFormatter): this;
  formatDuration(formatter: DurationFormatter): this;
  formatTick(formatter: DateFormatter): this;
  radius(value: number): this;
  render(): Chart<TimesheetData, TimesheetPointSnapshot>;
}

export declare const LineChart: Readonly<ChartDefinition<LineChartBuilder>>;
export declare const BarChart: Readonly<ChartDefinition<BarChartBuilder>>;
export declare const ScatterChart: Readonly<ChartDefinition<ScatterChartBuilder>>;
export declare const MixedChart: Readonly<ChartDefinition<MixedChartBuilder>>;
export declare const BubbleChart: Readonly<ChartDefinition<BubbleChartBuilder>>;
export declare const PieChart: Readonly<ChartDefinition<PieChartBuilder>>;
export declare const DonutChart: Readonly<ChartDefinition<DonutChartBuilder>>;
export declare const PercentageChart: Readonly<ChartDefinition<PercentageChartBuilder>>;
export declare const RadarChart: Readonly<ChartDefinition<RadarChartBuilder>>;
export declare const PolarAreaChart: Readonly<ChartDefinition<PolarAreaChartBuilder>>;
export declare const HeatmapChart: Readonly<ChartDefinition<HeatmapChartBuilder>>;
export declare const TimesheetChart: Readonly<ChartDefinition<TimesheetChartBuilder>>;
