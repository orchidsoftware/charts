# Позиционирование Orchid Charts

Orchid Charts — готовые SVG-графики для продуктовых интерфейсов: дашбордов,
отчётов, календарей активности и планов работ. Мы помогаем разработчику получить
цельный результат с небольшим количеством понятного кода.

## Позиция

**Категория:** product-interface charting library.

**Аудитория:** frontend-разработчики, создающие SaaS-приложения,
административные панели, отчёты, activity views и планы работ.

**Работа пользователя:** быстро встроить понятный график, который уже выглядит
и ведёт себя как законченная часть интерфейса.

**Противопоставление:** Orchid Charts — не visualization framework. Библиотека не
пытается покрыть карты, BI-конструкторы, WebGL и произвольные renderers. Она
делает повседневные продуктовые графики цельными и предсказуемыми.

**Главное обещание:**

> Charts that belong in your product.

**Объяснение обещания:**

> Orchid Charts turns everyday product data into clear, responsive SVG charts with
> one small JavaScript API.

## Почему такая позиция

Подход следует трём принципам:

1. Apple: ясная иерархия, внимание к содержанию и качество деталей. Ценность
   должна быть видна в результате и взаимодействии.
2. Laravel: выразительный код и понятный путь от идеи до работающего интерфейса.
   Первый пример должен вызывать желание использовать API.
3. Rails: последовательные настройки по умолчанию сокращают число решений,
   необходимых для обычной задачи.

Это наши практические выводы из опубликованных подходов, а не оценки Orchid Charts
со стороны этих команд. [Матрица продуктовой проверки](./PRODUCT_REVIEW.md)
переводит их в конкретные действия и проверяемые результаты.

## Иерархия сообщений

### Первый уровень — результат

- Charts that belong in your product.
- Clear charts for dashboards, reports, activity, and planning.
- Built for products, not chart projects.

### Второй уровень — способ

- One small JavaScript API.
- Product-ready defaults.
- Twelve chart types for everyday product work.
- Responsive SVG that follows the surrounding interface.

### Третий уровень — доказательства

- Zero runtime dependencies.
- TypeScript declarations.
- Consistent update, selection, export, and destroy lifecycle.
- Keyboard navigation and descriptive semantics included automatically.
- Visual regression, coverage, and performance gates.

Лицензия и accessibility не используются как главное конкурентное обещание.
Они остаются признаками низкого риска и законченности продукта.

## Точные публичные описания

### GitHub About

> Clear, responsive SVG charts for product interfaces with one small JavaScript
> API.

### npm `description`

> Clear, responsive SVG charts for product interfaces with one small JavaScript
> API

### Hero

**Eyebrow:** Responsive SVG charts for product interfaces

**Heading:** Charts that belong in your product.

**Body:** Turn everyday product data into clear, interactive charts without
turning chart configuration into a project. One small API covers trends,
comparisons, composition, activity, and planning.

### Короткое описание для каталогов

> Product-ready SVG charts with one small JavaScript API.

### Расширенное описание

> Orchid Charts is a small JavaScript charting library for dashboards, reports,
> activity views, and release plans. Twelve responsive SVG chart types share one
> consistent API for rendering, updates, interaction, export, and cleanup.

## Как показать ценность

Каждое ключевое обещание подтверждается графиком, коротким кодом или действием,
которое посетитель может выполнить прямо в демо.

### 1. Выиграть первый опыт

- README должен показывать рабочий график до перечисления возможностей.
- Demo должна открываться реальными продуктовыми сценариями, а не тестовой
  матрицей или архитектурной терминологией.
- Первый график должен запускаться одним import и короткой цепочкой `LineChart.make(...).dataset(...).render()`.

### 2. Создать узнаваемую эстетику

- Держать единый визуальный язык для всех типов.
- Показывать графики внутри карточек, отчётов и planning views, а не изолированно
  на белом полотне.
- Показывать на одних данных переключение line/bar; для календаря и планирования
  использовать соответствующие предметные данные.

### 3. Помочь попробовать на своей задаче

- Дать изменить данные, тип и тему прямо в демо и получить соответствующий код.
- Показать обновление и SVG-экспорт на текущих данных.
- Предложить подключить библиотеку к одному экрану через примеры React, Vue
  и Hotwire.
- Объяснять область применения через наши задачи и возможности. Не строить
  README и демо вокруг названий других библиотек или сравнительных таблиц.

### 4. Сделать документацию частью продукта

- Quick start должен занимать один экран.
- Для каждого типа нужна одна страница с реальным вопросом, минимальным примером
  и ссылкой на полный набор options.
- Ошибки должны называть неверное поле и показывать ожидаемую форму данных.

### 5. Расширяться от happy path

Приоритет следующей возможности определяется не числом запросов на новый тип,
а тем, усиливает ли она основную работу пользователя. Высокий приоритет имеют
framework wrappers, пустые/loading/error states, theme recipes и примеры интеграции. Карты, WebGL, plugin framework и BI-конструктор размывают позицию.

## План выхода

### Этап 1 — основание

- Синхронизировать README, npm description, GitHub About и demo hero.
- Опубликовать живую demo с постоянным URL.
- Добавить repository, homepage и bugs metadata в npm package.

### Этап 2 — демонстрация вкуса

- Подготовить один короткий launch post: проблема, 20 строк кода, живой
  результат.
- Выпустить галерею из пяти продуктовых сценариев вместо каталога всех options.
- Показать responsive и dark variants как часть интерфейса.

### Этап 3 — помощь во внедрении

- Опубликовать законченные примеры интеграции и опыт пользователей.
- Добавить React и Vue examples либо тонкие официальные wrappers.
- Создать отдельные индексируемые страницы для line, bar, percentage, heatmap и
  timesheet.

### Этап 4 — доверие

- Публиковать visual и performance evidence без превращения их в hero message.
- Просить ранних пользователей разрешить показать реальные интерфейсы.
- Превращать повторяющиеся support questions в короткие documentation recipes.

## Ограничители

- Не использовать `simple`, `modern`, `beautiful` без визуального
  доказательства рядом.
- Не называть Orchid Charts drop-in replacement для другой библиотеки без тестируемой
  совместимости.
- Не обещать enterprise-scale или работу с миллионами интерактивных SVG marks.
- Не превращать количество chart types в гонку с универсальными библиотеками.
- Не менять главное обещание между GitHub, npm и demo.
