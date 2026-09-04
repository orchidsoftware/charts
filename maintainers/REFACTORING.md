# Матрица архитектурного рефакторинга

Это не стенограмма и не личное одобрение перечисленных авторов. Матрица —
проверяемая интерпретация их публичных принципов применительно к Orchid Charts.

Источники:

- DHH: [Rails Doctrine](https://rubyonrails.org/doctrine),
  [Conceptual Compression](https://signalvnoise.com/svn3/conceptual-compression-means-beginners-dont-need-to-know-sql-hallelujah/),
  [Simple just isn’t that important](https://signalvnoise.com/svn3/simple-just-isnt-that-important/)
  и [The Majestic Monolith](https://signalvnoise.com/svn3/the-majestic-monolith/).
- Taylor Otwell / Laravel:
  [Meet Laravel](https://laravel.com/framework/docs/12.x),
  [Directory Structure](https://laravel.com/framework/docs/13.x/structure) и
  [Service Container](https://laravel.com/framework/docs/13.x/container).
- Robert C. Martin:
  [The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
  и [If Else Switch](https://blog.cleancoder.com/uncle-bob/2021/03/06/ifElseSwitch.html).
- Александр Черняев:
  [«Великий монолит»](https://github.com/tabuna/dandy-code/blob/main/content/003-big.md),
  [«Размер имеет значение»](https://github.com/tabuna/dandy-code/blob/main/content/009-size.md),
  [«Аргументы»](https://github.com/tabuna/dandy-code/blob/main/content/013-arguments.md),
  [«Не бойся удалять код»](https://github.com/tabuna/dandy-code/blob/main/content/016-remove.md)
  и [«Не отказывайтесь от будущего»](https://github.com/tabuna/dandy-code/blob/main/content/019-upgrade.md).
- TC39: [ECMAScript 2026 — Classes and PrivateIdentifier](https://tc39.es/ecma262/2026/multipage/ecmascript-language-functions-and-classes.html).

## Матрица мнений

| Вопрос           | DHH                                                                                            | Taylor / Laravel                                                                             | Robert Martin                                                          | Александр Черняев                                                                        | Решение Orchid Charts                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Форма системы    | Интегрированный majestic monolith; минимум лишних conceptual models                            | Предсказуемая convention-first структура без обязательной ceremony                           | Границы по ответственности, зависимости направлены к правилам          | Жёсткая структура — общий язык команды                                                   | Один пакет и lifecycle, но каталоги являются реальными границами                                                               |
| Публичный API    | Красивый код и programmer happiness важнее формальной симметрии                                | Один выразительный happy path, хорошие defaults, zero-config где возможно                    | Boundary должен скрывать детали механизмов                             | README обязан сразу отвечать «как пользоваться?»                                         | Named chart definitions, fluent domain methods и пять методов mounted lifecycle                                                |
| Где нужны классы | «No one paradigm»: объект хорош для связанного поведения и состояния, но не для каждой функции | Почти весь app-код выражен классами; concrete dependencies не требуют ручной DI-конфигурации | Объекты и полиморфизм защищают policy от mechanism и `switch`-магнитов | Класс — игрок, публичный метод — целостный пас; нельзя дробить на пустые прокси          | Классы владеют lifecycle, data state, interaction state и renderer behavior; математика остаётся функциями                     |
| Видимость        | Sharp knives предполагают доверие, но красивый API не обязан показывать механизм               | Конструктор получает зависимости, наружу выходит только нужное поведение                     | Boundary скрывает детали и не пропускает наружу механизмы              | Объект сам принимает решения; внешний код говорит ему намерение, а не разбирает данные   | Все mutable поля и lifecycle helpers — native `#private`; package API не отдаёт `options`, `tooltip`, `svg` или render methods |
| Абстракции       | Удалять needless abstraction; не плодить сервисы/классы                                        | Не требовать интерфейс/контейнер без нескольких реализаций                                   | Изолировать чистые правила от UI/DOM                                   | У каждой директории одна объяснимая зона                                                 | Нет base renderer, container и DTO-классов; renderers получают frozen chart state и узкий SVG boundary                         |
| Размер методов   | Цельность системы важнее формального SRP по числу строк                                        | Convention делает назначение класса и метода очевидным                                       | Класс имеет одну причину изменения, boundary пересекают простые данные | Не делать 1000-строчные методы, но и не прятать шаги за бессмысленными приватными прокси | Публичные методы выражают lifecycle-команды; private helper существует только для самостоятельного логического блока           |
| Аргументы        | Выразительность call site важнее механической симметрии                                        | Constructor injection вместо скрытого service locator                                        | Через границы проходят простые структуры, удобные внутренней policy    | Не более трёх позиционных аргументов; при большем числе предпочесть объект               | Межклассовая передача — именованные object parameters и frozen render snapshot                                                 |
| Расширение типов | Новая возможность должна жить внутри цельной системы                                           | Конвенция должна подсказывать место нового кода                                              | Renderer detail подключается снаружи, pure rules не знают DOM          | Для нового файла должен быть однозначный каталог                                         | Новый тип = option union + renderer; новый lifecycle запрещён                                                                  |
| Совместимость    | Progress over stability допускает осознанный break                                             | Upgrade должен быть прямым, а API — без исторического мусора                                 | Старые детали не должны загрязнять boundary                            | Мёртвые/дублирующиеся пути разрушают договорённость                                      | Удалены Sparkline, compact, angularInset, named/default constructors                                                           |
| Тестирование     | Тесты не должны диктовать лишние seams                                                         | Feature/API tests должны выглядеть как реальное использование                                | Pure rules тестируются без UI; browser — внешний слой                  | README содержит воспроизводимые команды                                                  | Unit/API/browser/visual/performance gates, без mock-слоёв внутри boundary                                                      |

## Исходный диагноз

- `SvgChart.js`: 1790 строк и 25 методов; одновременно data validation,
  geometry, layout, DOM, tooltip, interactions, six renderers и lifecycle.
- `chart.js`: 13 публичных классов, почти все лишь меняли `type`.
- Два эквивалентных входа (`createChart` и `new Chart`) плюс default export.
- Deprecated API продолжал занимать runtime, declarations, docs и tests.
- `export()` одновременно сериализовал SVG и запускал browser download.
- Структура `src/js/charts` / `src/js/utils` не отвечала, где должны жить
  normalization, geometry или новая стратегия.

## Принятый план и статус

1. **Заморозить поведение** — 76 visual baselines для full-body,
   desktop/mobile/dark и
   hover/pressed/active/focus состояний. Выполнено.
2. **Упростить boundary** — оставить только `createChart`, сделать `type`
   обязательным, удалить public constructor hierarchy. Выполнено.
3. **Удалить deprecated** — Sparkline route/class, compact preset,
   `angularInset` и связанные типы/тесты. Выполнено.
4. **Разделить God class** — core lifecycle, renderer strategies и stateless
   support calculations/browser primitives. Выполнено.
5. **Разделить query и command** — `toSvg()` без эффекта, `download()` с явно
   названным эффектом. Выполнено.
6. **Закрепить контракт** — TypeScript negative tests, architecture README,
   visual gate, coverage/performance/build. Выполнено.
7. **Закрыть runtime state** — заменить object-literal renderers и `.call(this)`
   на concrete classes, перенести data behavior в `ChartData`, interaction state
   в `InteractionController`, а поля и helpers владельцев сделать native
   `#private`. Выполнено.
8. **Ввести исполняемый quality contract** — ESLint flat config, строгий JSDoc,
   import/cycle, promise, security, SonarJS, Unicorn и complexity budgets.
   Выполнено; `npm run lint` проходит с `--max-warnings 0`.

## Важнейшие решения

### ADR-000 — Breaking boundary выпускается как 0.0.1

Удаление constructor/deprecated API не маскируется под patch. Новый узкий
контракт является первой стабильной major-границей пакета.

### ADR-001 — Один factory вместо constructor zoo (заменён ADR-022)

`createChart(parent, options)` — единственная точка создания. Тип графика —
данные конфигурации, а не наследование. Это уменьшает число понятий и делает
все примеры одинаковыми.

### ADR-002 — Интегрированный core, concrete renderer classes

`core/Chart.js` остаётся единственным владельцем mutable state и DOM lifecycle.
`renderChart` выбирает один concrete renderer class из закрытого registry.
Renderer получает frozen plain-object chart state и узкий `SvgSurface`, не наследуясь от
искусственного base class. Так сохраняется integrated system DHH,
Laravel-like constructor collaboration и polymorphic dispatch Мартина без
мини-фреймворка.

### ADR-003 — Pure inward rules

Pure modules `support/Normalize.js`, `support/geometry/Math.js` и
`support/presentation/Presentation.js` не импортируют `core` или
browser interaction.
Это применяет Dependency Rule Мартина там, где в библиотеке действительно есть
архитектурная граница, без интерфейсов «на всякий случай».

### ADR-004 — Явность вместо hidden presets (заменён ADR-022)

Frameless chart — обычный line/bar с явными `show…: false`. Читатель видит цену
каждого решения, а runtime не содержит legacy normalization.

### ADR-005 — Baseline обновляется только через review

`npm run test:visual` сравнивает, `npm run test:visual:update` принимает
намеренное изменение. Reference/actual/diff являются частью review.

### ADR-006 — Native privacy вместо соглашений

Mutable runtime state, DOM ownership и helper methods объявляются через `#`.
Публичными остаются только методы, входящие в package contract, или намеренная
точка сотрудничества двух внутренних классов. JavaScript не имеет native
`protected`, поэтому наследование не используется для имитации этой области
видимости; зависимости передаются через constructor и frozen chart state.

### ADR-007 — Класс должен владеть поведением

`ChartData` не является DTO: он нормализует replacement, читает точки и строит
selection payload. `InteractionController` не является набором callbacks: он
владеет selected index и roving tabindex. Stateless geometry/layout остаются
функциями — static utility class не добавил бы ни state, ни polymorphism, ни
инкапсуляцию и противоречил бы DHH и «Размер имеет значение».

### ADR-008 — Строгость должна защищать архитектуру, а не стиль ради стиля

ESLint 10 запускает official recommended rules вместе с Import-X, Promise,
Security, SonarJS, Unicorn и JSDoc. Ограничены complexity, nesting, число
параметров, statements и размер production-функций. Для каждого production
метода и function declaration обязателен многострочный объясняющий JSDoc с
описаниями параметров и результата.

Правила адаптированы к browser library: `null` разрешён как нативная DOM-
семантика, Node-only ограничения применяются только к scripts/config, а
`security/detect-object-injection` отключён как hotspot, дающий ложные ошибки
на контролируемом индексировании нормализованных chart data. Исключение
документировано здесь, а не размазано inline-disable комментариями.

Cartesian rendering дополнительно разделён на coordinator,
`CartesianAxesRenderer`, функциональные стратегии `CartesianSeriesRendering` и
`CartesianInspectorRenderer`. Это не слой ради слоя: модули владеют разными
изменениями — axes/annotations, data marks и category interaction targets — и
получают один behavioral `CartesianLayout` через композицию.

### ADR-009 — Закрытые словари являются frozen runtime contracts

Типы графиков, ориентации и позиции оси определены через `Object.freeze` и
используются во validation и rendering вместо повторяющихся magic strings.
Каждая frozen chart definition напрямую связывает тип с model и renderer functions;
отдельного runtime registry нет. Общие палитры,
membership lists и time steps — frozen arrays: в отличие от `Object.freeze(new
Set())`, это действительно запрещает изменение содержимого. Architecture tests
проверяют runtime-неизменяемость и запрещают возвращение прямых сравнений с
доменными строками вне `support/Constants.js`.

### ADR-010 — SOLID применяется к причинам изменения, а не числу классов

Подтверждённые SRP/OCP-нарушения разделены по независимым политикам:

- `Options.js` владеет stateless validation/defaulting functions; `Chart`
  остаётся lifecycle façade/composition root.
- `ChartData` владеет атомарным normalized state, а `ChartSelection` — формой
  публичных selection events.
- прежний `RadialRenderer` удалён: radar и polar-area имеют отдельные классы и
  независимые renderer registrations.

`ChartTooltip` и `InteractionController` намеренно не дробятся: placement и
content составляют одну tooltip policy, а pointer/keyboard/focus — одну
interaction state machine. Количество private methods само по себе не является
SRP-метрикой. Наследование не введено, поэтому LSP-проблем и искусственного base
class contract нет; зависимости связываются в `Chart` как composition root.

### ADR-011 — Удалить классы без identity или behavior

Повторный DHH/Taylor audit обнаружил ceremony, появившуюся после механического
прочтения SOLID. `ChartOptions` был stateless wrapper, `RendererContext` — 115
строк getters вокруг DTO, а `ChartIdSequence` — класс вокруг одного счётчика.
Они удалены. Однометодный `ChartRenderer` также заменён прямой функцией
dispatch. Configuration выражена именованными функциями, renderer boundary —
frozen plain object, sequence — module-private state и одна функция.

`ChartSelection` сохранён осознанно: его методы взаимозависимы и работают над
одним model snapshot, то есть это cohesive presenter, а не namespace. Теперь
один экземпляр создаётся при commit данных и переиспользуется до следующего
`update`, вместо allocation на каждый click. Это следует Rails Doctrine «no one
paradigm» и Laravel-подходу: класс появляется там, где он действительно владеет
совместным поведением; простая трансформация остаётся функцией.

### ADR-012 — Render boundary говорит `chart / layout / surface`

Generic `context` удалён из renderer API. `renderChart` отделяет DOM-корень от
frozen chart state и передаёт renderer-у ровно две зависимости: `chart` для
чтения и `surface` для SVG-команд. Для Cartesian-семейства coordinator добавляет
третьего collaborator-а — behavioral `CartesianLayout`. Call sites теперь
объясняют намерение без Java-style accessor-ов и без объектных мешков из
несвязанных координат.

`SvgSurface` намеренно мал: append, mark, text и настройка собственного root.
Он не знает chart options, tooltip, lifecycle или listeners. Если boundary
начнёт превращаться в универсальный DOM framework, класс следует уменьшить, а
не расширять.

### ADR-013 — Geometry отделяется только там, где она образует язык

`CartesianLayout` владеет scales, point/bar placement и inspector bands;
`TimesheetLayout` — temporal scale, ticks и task rows; `Composition` — parts,
shares и sector descriptors. Renderer-ы этих семейств теперь отвечают за SVG
presentation. Простые Radar, PolarArea и Heatmap намеренно не получили scene
graph или отдельный layout-класс: дополнительный слой пока не окупает себя и
ухудшил бы чтение и путь рендера больших наборов данных.

### ADR-014 — `ChartDatasets` отклонён после аудита

Повторяется в основном стандартная итерация массива: `map`, `flatMap`, `reduce`
и `entries`. Три похожих чтения `points[index]` служат разным политикам:
публичному point query, selection payload и part-to-whole aggregation. Общего
доменного поведения с тремя потребителями нет. Обёртка либо повторила бы Array,
либо заставила бы renderer-ы извлекать внутренний массив, добавив ceremony без
инкапсуляции. Решение пересматривается только при появлении одной и той же
операции и инварианта минимум в трёх независимых consumers.

### ADR-015 — Feature DSL описывает действия, assertions остаются явными

`ChartScenario` и `ChartMark` переводят `hover`, `click`, `focus` и полный
keyboard press в browser events. Они не прячут `expect`, SVG selectors, ARIA или
tooltip content. Низкоуровневый тест `InteractionController` остаётся прямым,
потому что там предмет проверки — именно последовательность событий state
machine, а не пользовательский сценарий.

### ADR-016 — Каталог появляется только для настоящей области

Верхний уровень сохраняет три границы: `core` владеет lifecycle и interaction
state, `renderers` содержит стратегии визуальных грамматик, а `support` —
stateless normalization, geometry, presentation и browser primitives. Внутри
них каталоги появляются только для подтверждённых групп из нескольких файлов:
`core/builders`, chart families `renderers/cartesian|composition|temporal` и
чистые политики `support/geometry|presentation`.

Это Laravel-style DX-интерпретация, а не утверждение о личном решении Taylor
Otwell: новый каталог появляется, когда несколько cohesive файлов образуют
устойчивую область. Fitness-тесты проверяют точный набор областей,
запрещают support зависеть от `core` или renderers, а renderer families —
импортировать соседние families.

### ADR-017 — Formatter и linters имеют разные обязанности

Prettier является единственным formatter-ом JavaScript, CSS, HTML и Markdown;
`format:check` делает форматирование частью CI-контракта. ESLint не используется
как printer: он проверяет JavaScript quality, imports, complexity и JSDoc.
Stylelint проверяет CSS correctness, kebab-case selectors и логический порядок
свойств через RECESS-order. `styles.css` и demo stylesheet разделены
комментариями на смысловые секции, чтобы машинный порядок внутри rules не
разрушал человеческую навигацию по файлу. `no-descending-specificity` отключён:
он сравнивал несвязанные component sections и выдавал ложные ошибки; реальный
cascade и visual states защищены browser/visual suite.

### ADR-018 — Первый релиз собирается автоматически, публикуется осознанно

Один локальный `npm run check` совпадает с обязательным CI gate: форматирование,
линтеры, declarations, Chromium coverage, performance и production build.
`npm run pack:check` показывает точный public artifact. CI прогоняет контракт на
минимальной поддерживаемой и актуальной Node.js, отдельно выполняются CodeQL и
dependency review.

GitHub repository и workflow `Release candidate` существуют, но workflow только
собирает проверенный `.tgz`: он не создаёт tag, GitHub Release или npm
publication. Это не маскирует необратимое внешнее действие удобной
кнопкой. После первой ручной npm-публикации trusted publishing и release
automation добавляются как отдельное решение с проверенным package
identity и процедурой восстановления.

### ADR-019 — Demo разделяет product narrative и quality evidence

Главная страница больше не заканчивается постоянно раскрытой матрицей с
внутренними формулировками `stress`, `edge case` и `absurd labels`. Они хорошо
описывали назначение теста, но плохо представляли библиотеку пользователю.
Showroom теперь ведёт от обещания и каталога типов к реальным продуктовым
сценариям, frameless examples и полному public API snippet.

Семь сложных наборов данных не удалены. Вместе со всеми product fixtures они
находятся на отдельной странице `demo/lab.html`, сгруппированы по renderer type
и проверяются `test/Lab.test.js`. Это сохраняет доказательство precision,
localization, density и signed/flat values, не смешивая QA-терминологию с demo.

### ADR-020 — Маркетинг продаёт место в продукте, а не список internals

README, npm description и hero используют одну позицию: `Charts that belong in
your product.` Это применение, а не приписывание личного одобрения DHH или
Taylor Otwell. Из позиции DHH взяты conceptual compression и право библиотеки
иметь мнение о хорошем результате. Из Laravel-style DX взяты один happy path,
product-ready defaults, progressive disclosure и документация, начинающаяся с
рабочего вызова. Frappe Charts подтверждает саму нишу небольших responsive SVG
charts, но Orchid Charts не заявляет совместимость и не копирует его публичный язык.

Поэтому README сначала называет аудиторию и показывает install с полным
named fluent call site, затем объясняет продуктовые задачи и только после них —
interaction и измеримые quality guarantees. SVG, zero dependencies,
accessibility и MIT являются доказательствами законченности и низкого риска, а
не главным обещанием. Architecture, naming policy и release mechanics остаются
доступны, но не стоят между пользователем и первым полезным графиком. Полная
иерархия сообщений и план выхода закреплены в [POSITIONING.md](./POSITIONING.md).

### ADR-021 — Object bag не считается архитектурным контрактом

`max-params` нельзя обходить переносом семи аргументов в анонимный `state`.
Внутренний object parameter содержит не более четырёх cohesive полей; более
широкая потребность означает, что расчёт нужно разделить или назвать отдельным
value/layout object. Private method не принимает inline object шире четырёх
полей, а функция не возвращает анонимный record шире шести полей.

Plain objects остаются уместны на честных границах: SVG attributes, public
configuration и небольшие сериализуемые records. Повторно используемая
геометрия группируется предметными понятиями `center`, `radii`, `angles` и
`rounding`. Selection payloads, percentage strip, polar layout, heatmap
dimensions и timesheet task placement получили именованные типы, потому что у
них есть стабильная форма и самостоятельный смысл. Эти ограничения закреплены
AST selectors в ESLint и не допускают обхода перестановкой object parameter.

## Оценка public API по линзе Taylor Otwell / Laravel

Это внутренняя rubric-оценка, **не заявление о личном одобрении Taylor Otwell**.

| Критерий                      |      Вес |     Балл | Доказательство                                                        |
| ----------------------------- | -------: | -------: | --------------------------------------------------------------------- |
| Один очевидный happy path     |      2.0 |      2.0 | Named definition, `make`, data и один `render`                        |
| Convention over configuration |      1.5 |      1.5 | Responsive sizing, палитра, gradient, labels и accessibility defaults |
| Выразительность call site     |      2.0 |      2.0 | `dataset`, `colors`, `height`, `gradient`, затем mounted lifecycle    |
| Ошибки и type guidance        |      1.5 |      1.5 | Discriminated union и fail-fast `TypeError`                           |
| Минимум ceremony              |      1.5 |      1.5 | Нет options bag, public constructors, adapters, hooks или `.end()`    |
| Документация и onboarding     |      1.5 |      1.5 | Canonical 95% path, cold-use gate и demo translation fixtures         |
| **Итого**                     | **10.0** | **10.0** | Taylor/Laravel veto пройден                                           |

Итог относится к принятому target contract. Runtime получает эту оценку только
после repository-coherence gate из `FLUENT_API.md`.

### ADR-022 — Named fluent definitions вместо generic options protocol

ADR-001 и ADR-004 полезно зафиксировали удаление constructor zoo и legacy
aliases, но их вывод о лучшей публичной форме заменён полной спецификацией
[FLUENT_API.md](./FLUENT_API.md). Generic `createChart(parent, options)` и шесть
отрицательных `show*` flags заставляют обычный product call site говорить на
языке внутренней конфигурации. Целевой boundary экспортирует двенадцать frozen
definitions — `LineChart`, `BarChart` и остальные — с одной операцией
`make(parent)`.

Mutable single-use builders находятся в `core`, копируют входы при fluent-вызове
и компилируют их в detached scene record. Они не знают DOM, layout, tooltip или
renderer classes. Только `render()` передаёт готовый snapshot внутреннему
lifecycle root. Mounted chart по-прежнему предоставляет только `element`,
`update`, `point`, `toSvg`, `download` и `destroy`.

Chart-wide conventions выражаются прямыми domain methods: `.colors()`,
`.height()`, `.gradient()`, `.horizontal()`, `.stacked()` и `.frameless()`.
`frameless()` является законченным product preset с явно определённым
precedence, а не compatibility alias. Scoped callbacks существуют только для
локального dataset/tooltip/axis/annotation override и автоматически завершают
scope без `.end()`.

Этот ADR является целевым. Старый runtime, declarations и tests мигрируют одним
replacement и не образуют второй постоянный public API. Полный method inventory,
validation, lifecycle и release gate задаёт только `FLUENT_API.md`.

### ADR-023 — Один lifecycle для callback scopes

Все callback-only dataset, tooltip, axis и annotation builders находятся в
`core/builders/BuilderScopes.js`. Они используют один module-private `WeakMap`, один
`runScope` и обязательное завершение через `finally`. Retained scope продолжает
выбрасывать `TypeError` с доменным именем независимо от успешного или аварийного
завершения callback.

Validation writers остаются раздельными для dataset/axis, annotations и
temporal tooltips. Они сохраняют собственные validators и fallback-имена, но
делят ownership и expiry lifecycle. Новый callback scope добавляется в этот
модуль; второй state map или второй runner не допускается.
