# Карта кода и аудит упрощения

This document records earlier review decisions and measurements. For the current
module structure and matrix implementation, see [ARCHITECTURE.md](./ARCHITECTURE.md)
and [MATRIX_IMPLEMENTATION.md](./MATRIX_IMPLEMENTATION.md).

Снимок обновлён по текущему рабочему дереву 29 августа 2026 года. В карту
включён production-контур `src/`: 44 текстовых файла, 12 014 строк и 377 726
байт. Удалённый в рабочем дереве `core/NextChartId.js` не включён. PNG-снапшоты,
тесты, demo и tooling показаны только агрегатами: они не участвуют в runtime
графе.

Обозначение ребра `A -->|x| B`: файл A импортирует и вызывает/использует `x` из
файла B. Размер в узле — физические строки и KiB исходника, до минификации.

## Карта файлов и вызовов

### Публичная граница и создание chart

```mermaid
flowchart LR
  index["index.js — 14 LOC / 0.2 KiB"] -->|"12 named definitions"| definition
  types["index.d.ts — 481 LOC / 16.7 KiB"]
  styles["styles.css — 334 LOC / 6.5 KiB"]

  subgraph core["core: создание и lifecycle"]
    definition["ChartDefinition.js — 133 LOC / 4.2 KiB"]
    chart["Chart.js — 597 LOC / 19.0 KiB"]
    data["ChartData.js — 361 LOC / 10.2 KiB"]
    selection["ChartSelection.js — 375 LOC / 10.7 KiB"]
    tooltip["ChartTooltip.js — 378 LOC / 12.9 KiB"]
    interaction["InteractionController.js — 376 LOC / 12.4 KiB"]
    options["Options.js — 353 LOC / 10.2 KiB"]
    annotations["NormalizeAnnotations.js — 214 LOC / 6.2 KiB"]
  end

  definition -->|"new Builder"| builders["Builder families"]
  definition -->|"new Chart"| chart
  definition -->|"create model"| data
  definition -->|"bind createModel / render"| implementation["Frozen implementation"]
  implementation -->|"render function"| renderers["Family renderers"]
  implementation -->|"model factory"| data
  chart -->|"createModel / render"| implementation
  chart -->|"renderChart"| render["Render.js"]
  chart -->|"owns"| tooltip
  chart -->|"replaces per render"| interaction
  chart -->|"normalize options / colors"| options
  data -->|"creates and delegates"| selection
  data -->|"normalize annotations"| annotations
  data -->|"normalize datasets / temporal data"| normalize["Normalize.js"]
  chart -->|"DOM primitives"| dom["Dom.js"]
  chart -->|"closed choices"| constants["Constants.js"]
  options -->|"measure host"| dom
  options -->|"defaults / enums"| constants
  selection -->|"selection policy by ChartType"| constants
  tooltip -->|"fallback palette"| constants
```

`index.d.ts` и `styles.css` — параллельные публичные контракты, а не runtime
imports: TypeScript проверяет fluent grammar, CSS оформляет созданные SVG/HTML
узлы.

### Fluent authoring

```mermaid
flowchart LR
  definition["ChartDefinition.js — 133 LOC / 4.2 KiB"] -->|"LineChartBuilder"| builder
  definition -->|"Bar / Scatter / Mixed"| cartesian
  definition -->|"Pie / Donut / Percentage / Radar / Polar"| composition
  definition -->|"Heatmap / Timesheet"| temporal

  subgraph authoring["core: fluent authoring"]
    builder["Builder.js — 163 LOC / 3.9 KiB"]
    cartesian["CartesianBuilders.js — 119 LOC / 2.7 KiB"]
    composition["CompositionBuilders.js — 65 LOC / 1.6 KiB"]
    temporal["TemporalBuilders.js — 112 LOC / 2.9 KiB"]
    argumentsFile["BuilderArguments.js — 108 LOC / 2.7 KiB"]
    scopes["BuilderScopes.js — 354 LOC / 6.7 KiB"]
    state["BuilderState.js — 205 LOC / 3.9 KiB"]
    validation["BuilderValidation.js — 282 LOC / 5.9 KiB"]
  end

  builder -->|"dataset / marker / region grammar"| argumentsFile
  builder -->|"axis / tooltip scope"| scopes
  builder -->|"option / compile / consume"| state
  cartesian -->|"inherits CartesianChartBuilder"| builder
  cartesian -->|"configuredDataset"| argumentsFile
  cartesian -->|"dataset scope classes"| scopes
  cartesian -->|"dataset / option"| state
  cartesian -->|"validateBoolean"| validation
  composition -->|"inherits SeriesChartBuilder"| builder
  composition -->|"configuredDataset"| argumentsFile
  composition -->|"DatasetBuilder"| scopes
  composition -->|"dataset / option"| state
  temporal -->|"inherits CommonChartBuilder"| builder
  temporal -->|"append / write"| state
  temporal -->|"tooltip scopes"| scopes
  argumentsFile -->|"marker / region scopes"| scopes
  argumentsFile -->|"dataset scopes"| scopes
  argumentsFile -->|"defensive copy"| state
  scopes -->|"copy / state"| state
  scopes -->|"validate scoped value"| validation
  scopes -->|"temporal option validation"| validation
  state -->|"validate option / labels / text"| validation
```

### Rendering

```mermaid
flowchart LR
  chart["Chart.js — 597 LOC / 19.0 KiB"] -->|"renderChart"| render

  subgraph rendererFiles["renderers"]
    render["Render.js — 23 LOC / 0.8 KiB"]
    surface["SvgSurface.js — 85 LOC / 2.7 KiB"]
    cartesian["CartesianRenderer.js — 106 LOC / 3.4 KiB"]
    layout["CartesianLayout.js — 468 LOC / 15.3 KiB"]
    axes["CartesianAxesRenderer.js — 590 LOC / 18.5 KiB"]
    series["CartesianSeriesRenderer.js — 586 LOC / 18.6 KiB"]
    inspector["CartesianInspectorRenderer.js — 81 LOC / 2.6 KiB"]
    aggregation["AggregationRenderer.js — 304 LOC / 9.8 KiB"]
    composition["Composition.js — 223 LOC / 6.9 KiB"]
    radar["RadarRenderer.js — 240 LOC / 7.8 KiB"]
    polar["PolarAreaRenderer.js — 229 LOC / 7.3 KiB"]
    heatmap["HeatmapRenderer.js — 416 LOC / 13.2 KiB"]
    timesheet["TimesheetRenderer.js — 240 LOC / 7.0 KiB"]
    timesheetLayout["TimesheetLayout.js — 226 LOC / 7.0 KiB"]
    legend["LegendRenderer.js — 77 LOC / 2.4 KiB"]
  end

  render -->|"new SvgSurface; call bound renderer"| surface
  cartesian -->|"new layout"| layout
  cartesian -->|"axes"| axes
  cartesian -->|"series functions"| series
  cartesian -->|"inspector"| inspector
  cartesian -->|"legend"| legend
  aggregation -->|"new Composition"| composition
  aggregation -->|"legend"| legend
  radar -->|"legend"| legend
  polar -->|"legend"| legend
  timesheet -->|"new layout"| timesheetLayout

  surface -->|"svg / mark metadata / title"| dom["Dom.js"]
  axes -->|"labels / formatting / finite check"| support["support policies"]
  series -->|"paths / marks / formatting / summaries"| support
  layout -->|"scales / padding / legend layout"| support
  inspector -->|"marks / formatting"| support
  aggregation -->|"SVG / formatting / layout"| support
  composition -->|"sector geometry"| math["Math.js"]
  radar -->|"polarPoint / formatting / layout"| support
  polar -->|"sector geometry / formatting / layout"| support
  heatmap -->|"extent / SVG / formatting"| support
  timesheetLayout -->|"scale / time / measurement"| support
  timesheet -->|"SVG primitives"| dom
  legend -->|"SVG / legendLayout"| support
```

`ChartDefinition.js` вызывает family entry functions:
`renderAggregationChart`, `renderLineChart`, `renderBarChart`,
`renderPointChart`, `renderMixedChart`, `renderRadarChart`,
`renderPolarAreaChart`, `renderHeatmapChart` и `renderTimesheetChart`.

### Stateless support

```mermaid
flowchart LR
  subgraph supportFiles["support"]
    constants["Constants.js — 151 LOC / 3.4 KiB"]
    dom["Dom.js — 349 LOC / 11.1 KiB"]
    formatting["Formatting.js — 114 LOC / 3.7 KiB"]
    math["Math.js — 10 LOC / 0.3 KiB"]
    normalize["Normalize.js — 740 LOC / 23.3 KiB"]
    presentation["Presentation.js — 229 LOC / 8.7 KiB"]
    scale["Scale.js — 99 LOC / 3.2 KiB"]
    cartesianGeometry["CartesianGeometry.js — 169 LOC / 5.7 KiB"]
    sectorGeometry["SectorGeometry.js — 306 LOC / 12.5 KiB"]
    time["Time.js — 116 LOC / 3.6 KiB"]
  end

  dom -->|"SVG namespace / number formatters"| constants
  formatting -->|"formatNumber"| dom
  normalize -->|"types / palettes"| constants
  presentation -->|"layout constants"| constants
  presentation -->|"measurement / truncation"| dom
  presentation -->|"formatLabel / formatValue"| formatting
  presentation -->|"extent"| math
  time -->|"time constants"| constants
  time -->|"formatterText"| formatting
  scale -->|"grid divisions"| constants
  cartesianGeometry -->|"orientation"| constants
  sectorGeometry -->|"minimum sweep"| constants
  math -->|"re-export paths"| cartesianGeometry
  math -->|"re-export scales"| scale
  math -->|"re-export sectors"| sectorGeometry

  coreConsumers["core consumers"] --> normalize
  rendererConsumers["renderer consumers"] --> dom
  rendererConsumers --> formatting
  rendererConsumers --> presentation
  rendererConsumers --> math
```

Входящая связность подтверждает роль фасадов: `Constants.js` имеет 21
потребителя, `Dom.js` — 15, `Formatting.js` — 9, `Math.js` — 8,
`BuilderState.js` — 6. Циклов между файлами нет; направление
`core/renderers -> support` соблюдается.

## Карта классов

```mermaid
classDiagram
  class CommonChartBuilder
  class SeriesChartBuilder
  class CartesianChartBuilder
  class LineChartBuilder
  class BarChartBuilder
  class ScatterChartBuilder
  class MixedChartBuilder
  class NumericSeriesBuilder
  class SectorChartBuilder
  class PercentageChartBuilder
  class PolarAreaChartBuilder
  class RadarChartBuilder
  class RangedChartBuilder
  class HeatmapChartBuilder
  class TimesheetChartBuilder

  CommonChartBuilder <|-- SeriesChartBuilder
  SeriesChartBuilder <|-- CartesianChartBuilder
  CartesianChartBuilder <|-- LineChartBuilder
  CartesianChartBuilder <|-- BarChartBuilder
  CartesianChartBuilder <|-- ScatterChartBuilder
  CartesianChartBuilder <|-- MixedChartBuilder
  SeriesChartBuilder <|-- NumericSeriesBuilder
  NumericSeriesBuilder <|-- SectorChartBuilder
  NumericSeriesBuilder <|-- PercentageChartBuilder
  NumericSeriesBuilder <|-- PolarAreaChartBuilder
  NumericSeriesBuilder <|-- RadarChartBuilder
  CommonChartBuilder <|-- RangedChartBuilder
  RangedChartBuilder <|-- HeatmapChartBuilder
  RangedChartBuilder <|-- TimesheetChartBuilder

  class DatasetBuilder
  class LineDatasetBuilder
  class BarDatasetBuilder
  class SeriesTooltipBuilder
  class AxisBuilder
  class AnnotationBuilder
  class MarkerBuilder
  class RegionBuilder
  class DateTooltipBuilder
  class HeatmapTooltipBuilder
  class TimesheetTooltipBuilder

  DatasetBuilder <|-- LineDatasetBuilder
  DatasetBuilder <|-- BarDatasetBuilder
  AnnotationBuilder <|-- MarkerBuilder
  AnnotationBuilder <|-- RegionBuilder
  DateTooltipBuilder <|-- HeatmapTooltipBuilder
  DateTooltipBuilder <|-- TimesheetTooltipBuilder

  class Chart
  class ChartData
  class ChartSelection
  class ChartTooltip
  class InteractionController
  Chart *-- ChartData : owns snapshot
  ChartData *-- ChartSelection : owns presenter
  Chart *-- ChartTooltip : owns lifecycle
  Chart *-- InteractionController : replaces

  class SvgSurface
  class CartesianRenderer
  class CartesianLayout
  class CartesianAxesRenderer
  class CartesianInspectorRenderer
  class LinePresentation
  class AggregationRenderer
  class Composition
  class RadarRenderer
  class PolarAreaRenderer
  class HeatmapRenderer
  class TimesheetRenderer
  class TimesheetLayout
  class LegendRenderer
  class TimesheetPalette

  Chart ..> SvgSurface : render boundary creates
  CartesianRenderer *-- CartesianLayout
  CartesianRenderer *-- CartesianAxesRenderer
  CartesianRenderer *-- CartesianInspectorRenderer
  CartesianRenderer ..> LinePresentation : series functions create
  AggregationRenderer *-- Composition
  AggregationRenderer ..> LegendRenderer
  RadarRenderer ..> LegendRenderer
  PolarAreaRenderer ..> LegendRenderer
  TimesheetRenderer *-- TimesheetLayout
  ChartData ..> TimesheetPalette : normalization creates
```

Важно: `CartesianSeriesRenderer.js` сейчас не содержит renderer-класса. Это
набор функций и небольшой value object `LinePresentation`. Поэтому превращать
его в класс только ради симметрии с остальными renderer-файлами не следует.

## Размер и концентрация сложности

| Зона        | Файлов |   LOC |    Байт | Наблюдение                                |
| ----------- | -----: | ----: | ------: | ----------------------------------------- |
| `core`      |     16 | 5 008 | 150 664 | Fluent API, lifecycle, model, interaction |
| `renderers` |     15 | 3 894 | 125 941 | Реальная SVG/layout сложность             |
| `support`   |     10 | 2 283 |  77 201 | Pure rules и browser primitives           |
| public root |      3 |   829 |  23 920 | JS entry, declarations, CSS               |

Крупнейшие production-файлы: `Normalize.js` 740 LOC, `Chart.js` 597,
`CartesianAxesRenderer.js` 590, `CartesianSeriesRenderer.js` 586,
`index.d.ts` 481 и `CartesianLayout.js` 468. Это точки внимания, но размер сам
по себе не доказывает нарушение ответственности.

В JS-файлах `core`, `renderers`, `support` около 3 519 строк block/line
comments из 11 185 физических строк, то есть примерно 31,5%. Большая часть —
обязательный JSDoc на private methods и локальных functions.

Вне runtime-контура: `test` — 17 текстовых файлов / 5 190 LOC; `demo` — 6 /
3 720 LOC; `docs` до этого отчёта — 12 / 3 043 LOC; `scripts` — 2 / 385 LOC.
Текущий собранный ESM из `demo/BuildSize.js`: 69 913 raw / 21 256 gzip bytes;
aggregate build: 102 066 raw / 30 180 gzip bytes.

## Интерпретация DHH и Taylor Otwell

Это не приписывание авторам мнения о Orchid Charts, а применение их опубликованных
принципов.

- DHH ставит programmer happiness, convention over configuration, отсутствие
  догмы одного paradigm и integrated systems выше архитектурной чистоты ради
  неё самой. Он прямо допускает, что красивый простой внешний API может иметь
  сложную реализацию, и предупреждает против преждевременного дробления системы.
- Laravel описывает цель как expressive/elegant syntax, даёт предсказуемую
  стартовую структуру, но не навязывает каталоги, и использует явную constructor
  injection для настоящих class dependencies.

Источники: [Rails Doctrine](https://rubyonrails.org/doctrine),
[Conceptual Compression](https://signalvnoise.com/svn3/conceptual-compression-means-beginners-dont-need-to-know-sql-hallelujah/),
[The Majestic Monolith](https://signalvnoise.com/svn3/the-majestic-monolith/),
[Laravel: Meet Laravel](https://laravel.com/framework/docs/12.x),
[Laravel directory structure](https://laravel.com/docs/13.x/structure),
[Laravel service container](https://laravel.com/docs/master/container).

## Что упростить

### 1. Убрать обязательный JSDoc с очевидных private/local функций

Это самый безопасный и самый большой резерв сокращения. Оставить документацию
для public API, exported boundary, сложной математики, browser quirks и
неочевидных invariants. Не документировать механически `@param`, `@returns` и
пересказ имени каждого private helper.

Для этого достаточно ослабить `jsdoc/require-jsdoc` в `eslint.config.js` до
public/exported API. Потенциальное сокращение — ориентировочно 2 000–3 000 LOC
без изменения runtime, типов или поведения. Это буквально делает код более
выразительным вместо параллельного prose-слоя.

### 2. Упростить quality contract до правил, ловящих дефекты

Сохранить cycles/restricted paths, correctness, complexity ceiling и public
boundary tests. Пересмотреть:

- глобальный запрет `else`;
- custom `declarationWallSelector`;
- обязательные blank lines между почти всеми statement groups;
- одинаковые жёсткие лимиты для geometry, event state machine и glue code;
- обязательный informative JSDoc для каждой функции.

Эти правила уже влияют на форму программы и создают helper-функции/константы
ради прохождения lint. DHH/Taylor-проверка здесь проста: правило должно снимать
реальную повторяющуюся боль проекта, а не навязывать любимую парадигму.

### 3. Единый lifecycle временных fluent scopes выполнен

Dataset, tooltip, axis и annotation callback builders находятся в
`BuilderScopes.js` и используют один `ScopeState`, один WeakMap и один
`runScope`. Каждый публичный метод явно вызывает свой маленький validator, а
общий writer отвечает только за lifecycle и defensive copy. Fallback-сообщения,
public API и момент ошибок не изменились.

### 4. Сохранить fluent API, даже если он занимает много исходника

Builder hierarchy и `index.d.ts` выглядят объёмно, но это conceptual compression
для пользователя: autocomplete показывает только методы конкретного типа, а
call site остаётся читаемым. Генерация методов из таблиц сократит исходник, но
ухудшит навигацию, stack traces и декларации. Это ложная экономия.

Если объём станет реальной проблемой, следующий большой шаг — перенос source в
TypeScript и генерация `.d.ts`, а не runtime metaprogramming. Сейчас такой
переезд слишком широк для задачи сокращения сложности.

### 5. Не дробить крупные cohesive-файлы только по LOC

- `Chart.js` владеет одним lifecycle: atomic render/update, resize, tooltip,
  interaction binding, export и destroy. Его разделение добавит owners и
  протоколы. Сначала убрать documentation ceremony; затем переоценить файл.
- `Normalize.js` велик, потому что содержит три независимых data grammars.
  Разделение на Series/Heatmap/Timesheet улучшит локальную навигацию, но не
  сократит код. Делать только при росте параллельной разработки этих областей.
- `CartesianAxesRenderer.js`, `CartesianSeriesRenderer.js` и
  `CartesianLayout.js` уже разделены по реальным причинам изменения. Объединять
  их ради majestic monolith не нужно: система уже остаётся одним пакетом и
  одним render pipeline.

### 6. Не удалять полезные маленькие фасады

`Math.js` — всего 10 LOC, но скрывает физическое размещение Scale/Cartesian/
Sector geometry от восьми renderer consumers. `Render.js` и `SvgSurface.js`
задают узкую DOM mutation boundary. Их удаление уменьшит число файлов, но
увеличит coupling и количество понятий на call site.

### 7. Отложить микроэкономию renderer entry wrappers

Family-функции `renderXChart()` в основном создают renderer и вызывают
`render()`. Передача constructor вместо function может убрать несколько строк,
но потребует единого class contract и переделки функционального Cartesian
series path. Выигрыш мал; не делать до появления второго реального consumer.

## Рекомендуемый порядок

1. Ослабить JSDoc/lint ceremony, выполнить полный `npm run check`, сравнить LOC
   и bundle — поведение и build size не должны измениться.
2. Сохранять единый callback-scope lifecycle и immediate validation tests при
   добавлении новых fluent scopes.
3. После этих двух шагов повторно измерить `Chart.js`, `Normalize.js` и
   Cartesian files. Не планировать split/merge заранее.
4. Для каждого следующего abstraction требовать два доказательства: минимум
   два реальных consumer-а и уменьшение общего числа понятий на call site.

Итог: текущая архитектура в целом здорова — один пакет, один composition root,
нет dependency cycles, support направлен внутрь. Главная возможность сокращения
находится не в доменной логике графиков, а в мета-коде вокруг неё: обязательной
документации, чрезмерно директивном lint и трёх реализациях одного scope
lifecycle.
